# WebRTC Implementation Guide
## Vide — Video Calling PWA

This is a step-by-step implementation guide. Follow in order.

---

## Step 1: Get Local Media

Always get local media **before** creating any peer connections. Put this logic in `useLocalMedia.ts`.

```typescript
// hooks/useLocalMedia.ts
import { useState, useEffect, useRef } from 'react'

interface LocalMediaOptions {
  video?: boolean | MediaTrackConstraints
  audio?: boolean | MediaTrackConstraints
}

export function useLocalMedia(options: LocalMediaOptions = { video: true, audio: true }) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<'denied' | 'notfound' | 'unknown' | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const acquire = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: options.video ?? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: options.audio ?? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = s
      setStream(s)
      setError(null)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setError('denied')
      else if (err.name === 'NotFoundError') setError('notfound')
      else setError('unknown')
    }
  }

  const release = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setStream(null)
  }

  const toggleAudio = () => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
  }

  const toggleVideo = () => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
  }

  useEffect(() => () => { release() }, [])

  return { stream, error, acquire, release, toggleAudio, toggleVideo }
}
```

**Key points:**
- `facingMode: 'user'` ensures front camera on mobile by default
- `echoCancellation: true` is critical for preventing feedback
- Always call `release()` on component unmount to stop the camera LED
- Handle all three error cases in your UI

---

## Step 2: Signaling Server

The signaling server is a Node.js + Socket.io server. It only passes messages — it never touches media.

```typescript
// apps/signaling/src/index.ts
import { createServer } from 'http'
import { Server } from 'socket.io'
import { handleRoomEvents } from './rooms'

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', socket => {
  console.log(`[connect] ${socket.id}`)
  handleRoomEvents(io, socket)
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`)
  })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => console.log(`Signaling server on :${PORT}`))
```

```typescript
// apps/signaling/src/rooms.ts
import { Server, Socket } from 'socket.io'

interface RoomPeer {
  socketId: string
  displayName: string
  hasVideo: boolean
  hasAudio: boolean
  isHost: boolean
  pinHash?: string  // for PIN-protected rooms
}

const rooms = new Map<string, Map<string, RoomPeer>>()

export function handleRoomEvents(io: Server, socket: Socket) {
  socket.on('room:join', ({ roomId, displayName, hasVideo, hasAudio, pin }) => {
    // Validate PIN if room exists and has a PIN
    const room = rooms.get(roomId)
    if (room) {
      const host = [...room.values()].find(p => p.isHost)
      if (host?.pinHash && pin !== host.pinHash) {
        socket.emit('room:error', { code: 'WRONG_PIN', message: 'Incorrect PIN' })
        return
      }
    }

    // Create room if it doesn't exist
    if (!room) rooms.set(roomId, new Map())

    const isHost = rooms.get(roomId)!.size === 0
    const peer: RoomPeer = { socketId: socket.id, displayName, hasVideo, hasAudio, isHost }
    rooms.get(roomId)!.set(socket.id, peer)
    socket.join(roomId)

    // Tell the joiner about existing peers
    const existingPeers = [...rooms.get(roomId)!.values()]
      .filter(p => p.socketId !== socket.id)
    socket.emit('room:joined', { roomId, socketId: socket.id, isHost })
    socket.emit('room:peers', existingPeers)

    // Tell existing peers about the joiner
    socket.to(roomId).emit('room:new_peer', peer)
  })

  // Relay WebRTC signals (offer, answer, ICE)
  for (const event of ['signal:offer', 'signal:answer', 'signal:ice']) {
    socket.on(event, ({ to, ...payload }) => {
      io.to(to).emit(event, { from: socket.id, ...payload })
    })
  }

  // Relay peer state changes
  socket.on('peer:mute', payload => {
    socket.rooms.forEach(roomId => {
      if (roomId !== socket.id) socket.to(roomId).emit('peer:state', { socketId: socket.id, ...payload })
    })
  })

  // Chat messages
  socket.on('chat:message', ({ text }) => {
    const roomId = [...socket.rooms].find(r => r !== socket.id)
    if (!roomId) return
    const peer = rooms.get(roomId)?.get(socket.id)
    if (!peer) return
    const msg = { from: socket.id, displayName: peer.displayName, text: text.slice(0, 500), timestamp: Date.now() }
    io.to(roomId).emit('chat:message', msg)
  })

  // Handle disconnect
  socket.on('disconnecting', () => {
    socket.rooms.forEach(roomId => {
      if (roomId === socket.id) return
      rooms.get(roomId)?.delete(socket.id)
      if (rooms.get(roomId)?.size === 0) rooms.delete(roomId)
      socket.to(roomId).emit('room:peer_left', { socketId: socket.id })
    })
  })
}
```

---

## Step 3: WebRTC Hook

This is the core hook. It manages all peer connections.

```typescript
// hooks/useWebRTC.ts
import { useEffect, useRef, useCallback } from 'react'
import { useCallStore } from '@/store/callStore'
import { getSocket } from '@/lib/socket'
import { ICE_SERVERS } from '@/lib/stunConfig'

export function useWebRTC(localStream: MediaStream | null) {
  const store = useCallStore()
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const socket = getSocket()

  const createConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    // Add local tracks
    localStream?.getTracks().forEach(track => {
      pc.addTrack(track, localStream)
    })

    // Receive remote stream
    pc.ontrack = ({ streams }) => {
      store.updatePeerStream(peerId, streams[0])
    }

    // Send ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('signal:ice', { to: peerId, candidate })
      }
    }

    // Connection state changes
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        store.removePeer(peerId)
        connectionsRef.current.delete(peerId)
      }
    }

    connectionsRef.current.set(peerId, pc)
    return pc
  }, [localStream, socket, store])

  // Initiate connection to a new peer (we are the caller)
  const initiatePeer = useCallback(async (peerId: string) => {
    const pc = createConnection(peerId)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('signal:offer', { to: peerId, sdp: pc.localDescription })
  }, [createConnection, socket])

  useEffect(() => {
    if (!localStream) return

    // Existing peers in room on join
    socket.on('room:peers', (peers) => {
      peers.forEach((peer: any) => {
        store.addPeer(peer.socketId, peer)
        initiatePeer(peer.socketId)
      })
    })

    // New peer joined after us
    socket.on('room:new_peer', (peer) => {
      store.addPeer(peer.socketId, peer)
      // They will initiate the offer to us
    })

    // Incoming offer
    socket.on('signal:offer', async ({ from, sdp }) => {
      const pc = createConnection(from)
      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('signal:answer', { to: from, sdp: pc.localDescription })
    })

    // Incoming answer
    socket.on('signal:answer', async ({ from, sdp }) => {
      const pc = connectionsRef.current.get(from)
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    // ICE candidates
    socket.on('signal:ice', async ({ from, candidate }) => {
      const pc = connectionsRef.current.get(from)
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate))
    })

    // Peer left
    socket.on('room:peer_left', ({ socketId }) => {
      connectionsRef.current.get(socketId)?.close()
      connectionsRef.current.delete(socketId)
      store.removePeer(socketId)
    })

    return () => {
      socket.off('room:peers')
      socket.off('room:new_peer')
      socket.off('signal:offer')
      socket.off('signal:answer')
      socket.off('signal:ice')
      socket.off('room:peer_left')
    }
  }, [localStream, socket, createConnection, initiatePeer, store])

  // Screen share: replace video track in all connections
  const startScreenShare = useCallback(async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: true,
    })
    const screenTrack = screenStream.getVideoTracks()[0]

    connectionsRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video')
      if (sender) sender.replaceTrack(screenTrack)
    })

    screenTrack.onended = () => stopScreenShare()
    store.setScreenStream(screenStream)
    socket.emit('peer:screen_share', { sharing: true })
  }, [socket, store])

  const stopScreenShare = useCallback(() => {
    const cameraTrack = localStream?.getVideoTracks()[0]
    if (!cameraTrack) return

    connectionsRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video')
      if (sender) sender.replaceTrack(cameraTrack)
    })

    store.setScreenStream(null)
    socket.emit('peer:screen_share', { sharing: false })
  }, [localStream, socket, store])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectionsRef.current.forEach(pc => pc.close())
      connectionsRef.current.clear()
    }
  }, [])

  return { startScreenShare, stopScreenShare }
}
```

---

## Step 4: ICE Server Configuration

```typescript
// lib/stunConfig.ts
export const ICE_SERVERS: RTCIceServer[] = [
  // Google's free STUN (no auth, works for most cases)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Metered STUN (more reliable)
  { urls: process.env.NEXT_PUBLIC_STUN_URL! },
  // TURN (required for users behind strict NATs, e.g. mobile carrier networks)
  {
    urls: process.env.NEXT_PUBLIC_TURN_URL!,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME!,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL!,
  },
]
```

**When is TURN needed?**
- Mobile carrier networks (especially in Kenya, most of Africa, India)
- Corporate/university firewalls
- Symmetric NAT (common on 4G/5G)

Always include a TURN server. Without it, ~15-20% of real-world connections fail.

---

## Step 5: Video Element Setup

Critical attributes for cross-browser compatibility:

```tsx
// components/call/VideoTile.tsx (video element section)
<video
  ref={videoRef}
  autoPlay          // Start playing immediately
  playsInline       // REQUIRED for iOS Safari (no fullscreen takeover)
  muted={isSelf}    // REQUIRED for self-view (autoplay policy)
  className="w-full h-full object-cover"
/>
```

Setting the stream:
```typescript
useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream
    // iOS Safari sometimes needs a nudge
    videoRef.current.play().catch(() => {
      // Autoplay blocked — user will need to tap
    })
  }
}, [stream])
```

---

## Step 6: Active Speaker Detection

```typescript
// hooks/useAudioLevel.ts
export function useAudioLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0)
  
  useEffect(() => {
    if (!stream) return
    const audioCtx = new AudioContext()
    const analyser = audioCtx.createAnalyser()
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 256
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let rafId: number
    
    const measure = () => {
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setLevel(avg)
      rafId = requestAnimationFrame(measure)
    }
    measure()
    
    return () => {
      cancelAnimationFrame(rafId)
      source.disconnect()
      audioCtx.close()
    }
  }, [stream])
  
  return level  // 0–255, typically speaking at > 20
}
```

---

## Common Bugs and Fixes

| Bug | Cause | Fix |
|---|---|---|
| Black video tile | `srcObject` not set | Set `videoRef.current.srcObject = stream` in `useEffect` |
| Echo on iOS | `echoCancellation: false` | Set `echoCancellation: true` in `getUserMedia` constraints |
| "Autoplay was prevented" | Chrome autoplay policy | Always `muted` for self-view; call `.play()` from user gesture for others |
| ICE connection fails on mobile data | No TURN server | Add TURN server to `ICE_SERVERS` |
| `getDisplayMedia` rejected on iOS | Not supported | Detect with `!navigator.mediaDevices.getDisplayMedia` and hide the button |
| Remote audio not heard | Audio track not added | Confirm `addTrack` is called before `createOffer` |
| `RTCPeerConnection` not renegotiating after `replaceTrack` | Missing `onnegotiationneeded` handler | Add handler and re-offer on negotiation needed |
| Multiple `signal:offer` events fire | Event listener not cleaned up | Remove Socket.io listeners in `useEffect` cleanup |
| "Safari cannot connect" | Unified plan not used | Modern Safari supports it; confirm no legacy SDP config |
