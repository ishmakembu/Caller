# Architecture Guide
## Vide — Video Calling PWA

---

## Overview

Vide uses a **peer-to-peer mesh WebRTC** topology for media, with a lightweight **Socket.io signaling server** to broker peer connections. No media ever touches the server — it flows directly browser-to-browser.

```
                    ┌─────────────────────────┐
                    │   Signaling Server       │
                    │   (Socket.io / Node.js)  │
                    │   Railway / Fly.io        │
                    └────────┬────────┬────────┘
                             │        │  (signaling only)
                    WebSocket│        │WebSocket
                             │        │
               ┌─────────────┴──┐  ┌──┴──────────────┐
               │  Browser A     │  │  Browser B       │
               │  Next.js PWA   │  │  Next.js PWA     │
               │  (Alice)       │  │  (Bob)           │
               └────────────────┘  └──────────────────┘
                        │                   │
                        └─────────────────┘
                         WebRTC (P2P media)
                         video + audio + data
```

---

## Signaling Flow (Step by Step)

This is the exact sequence of Socket.io events for two peers connecting.

```
Alice (initiator)                     Server                    Bob (joiner)
      │                                  │                           │
      │── socket.emit("room:join") ──────►│                           │
      │                                  │◄── socket.emit("room:join")│
      │                                  │                           │
      │◄── "room:peers" [bobId] ─────────│                           │
      │                                  │─── "room:new_peer" ───────►│
      │                                  │    { peerId: aliceId }     │
      │                                  │                           │
      │  (Alice creates RTCPeerConnection)                            │
      │  (Alice calls addTrack for local streams)                     │
      │  (Alice creates offer)                                        │
      │                                  │                           │
      │── "signal:offer" ───────────────►│─── "signal:offer" ────────►│
      │   { to: bobId, sdp }             │    { from: aliceId, sdp }  │
      │                                  │                           │
      │                                  │  (Bob creates RTCPeerConnection)
      │                                  │  (Bob adds remote description)
      │                                  │  (Bob creates answer)
      │                                  │                           │
      │◄── "signal:answer" ──────────────│◄── "signal:answer" ───────│
      │    { from: bobId, sdp }          │    { to: aliceId, sdp }   │
      │                                  │                           │
      │── "signal:ice" ─────────────────►│─── "signal:ice" ──────────►│
      │◄── "signal:ice" ─────────────────│◄── "signal:ice" ───────────│
      │   (ICE trickle, both directions) │                           │
      │                                  │                           │
      │◄═══════════════════ P2P media stream established ════════════►│
```

---

## Socket.io Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `room:join` | `{ roomId, displayName, hasVideo, hasAudio }` | Join or create a room |
| `room:leave` | — | Leave current room |
| `signal:offer` | `{ to: socketId, sdp: RTCSessionDescription }` | Send SDP offer to a peer |
| `signal:answer` | `{ to: socketId, sdp: RTCSessionDescription }` | Send SDP answer to a peer |
| `signal:ice` | `{ to: socketId, candidate: RTCIceCandidate }` | Trickle ICE candidate |
| `peer:mute` | `{ audio?: bool, video?: bool }` | Broadcast mute state change to room |
| `peer:screen_share` | `{ sharing: bool }` | Broadcast screen share state |
| `chat:message` | `{ text: string }` | Send chat message to room |
| `room:kick` | `{ socketId: string }` | Host only: remove a participant |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room:joined` | `{ roomId, socketId, isHost }` | Confirm join, receive own socket ID |
| `room:peers` | `Peer[]` | List of existing peers in room |
| `room:new_peer` | `Peer` | A new peer joined |
| `room:peer_left` | `{ socketId: string }` | A peer disconnected |
| `signal:offer` | `{ from: socketId, sdp }` | Incoming SDP offer |
| `signal:answer` | `{ from: socketId, sdp }` | Incoming SDP answer |
| `signal:ice` | `{ from: socketId, candidate }` | Incoming ICE candidate |
| `peer:state` | `{ socketId, audio, video, screen }` | Peer changed media state |
| `chat:message` | `{ from: socketId, displayName, text, timestamp }` | Incoming chat message |
| `room:error` | `{ code, message }` | Error (wrong PIN, room full, etc.) |

---

## Peer Type

```typescript
interface Peer {
  socketId: string
  displayName: string
  hasVideo: boolean
  hasAudio: boolean
  isHost: boolean
  isScreenSharing: boolean
}
```

---

## WebRTC Peer Connection Setup

Each pair of peers maintains one `RTCPeerConnection`. For N participants, each client holds N-1 connections.

```typescript
// lib/webrtc.ts
export function createPeerConnection(iceConfig: RTCConfiguration): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: [
      { urls: process.env.NEXT_PUBLIC_STUN_URL! },
      {
        urls: process.env.NEXT_PUBLIC_TURN_URL!,
        username: process.env.NEXT_PUBLIC_TURN_USERNAME!,
        credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL!,
      },
    ],
    iceCandidatePoolSize: 10,
  })
}
```

### Track negotiation order (important for iOS Safari)

1. Add local tracks to `RTCPeerConnection` **before** creating the offer
2. The initiator (earliest joiner) always creates the offer
3. Use `onnegotiationneeded` for renegotiation (e.g. adding screen share track)
4. Always use `unified-plan` SDP semantics (default in modern browsers)

---

## State Management (Zustand)

### callStore.ts

```typescript
interface CallState {
  roomId: string | null
  localStream: MediaStream | null
  peers: Map<string, PeerState>        // socketId → PeerState
  connections: Map<string, RTCPeerConnection>
  isMuted: boolean
  isCameraOff: boolean
  isScreenSharing: boolean
  screenStream: MediaStream | null
  
  // Actions
  setLocalStream: (stream: MediaStream) => void
  addPeer: (socketId: string, peer: PeerState) => void
  removePeer: (socketId: string) => void
  updatePeerStream: (socketId: string, stream: MediaStream) => void
  toggleMute: () => void
  toggleCamera: () => void
}
```

### uiStore.ts

```typescript
interface UIState {
  layout: 'grid' | 'spotlight' | 'sidebar'
  pinnedPeerId: string | null
  isChatOpen: boolean
  isParticipantsOpen: boolean
  isDeviceSelectorOpen: boolean
  activeSpeakerId: string | null
  unreadChatCount: number
  
  // Actions
  setLayout: (layout: UIState['layout']) => void
  pinPeer: (socketId: string | null) => void
  toggleChat: () => void
  toggleParticipants: () => void
}
```

---

## Data Channel (Chat)

Chat messages are relayed via the **signaling server** (not WebRTC data channels) for simplicity and reliability. This means:

- Messages are delivered even before P2P connection is fully established
- No need to manage data channel lifecycle
- Works fine for a personal app with low message volume

If you want true P2P chat (no server relay), you can add `RTCDataChannel` later.

---

## PWA Configuration

```json
// public/manifest.json
{
  "name": "Vide",
  "short_name": "Vide",
  "description": "Video calls, no installs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

The service worker (via `next-pwa`) caches:
- The app shell (HTML, JS, CSS)
- Static assets
- Does **not** cache socket connections or media streams (these are runtime)

---

## iOS Safari Gotchas

These are known issues — handle all of them:

| Issue | Solution |
|---|---|
| `getUserMedia` only works in response to user gesture | Show a "Start Camera" button, don't auto-request on load |
| `autoplay` is blocked for unmuted video | Always start video elements muted; unmute explicitly after user interaction |
| Audio output device selection not supported | Hide speaker selector on iOS; show only camera/mic |
| PiP not available on iPhone (only iPad) | Disable PiP button on iPhone; detect via `document.pictureInPictureEnabled` |
| WebRTC works but may need TURN | Test on 4G/5G, not just WiFi |
| PWA: no push notifications | Don't promise push; use in-call chat instead |
| Service worker scope limitations | Set `next-pwa` `scope: '/'` explicitly |

---

## Security Considerations

- Room IDs are randomly generated (use `nanoid`, 10 chars, URL-safe)
- Optional PIN: hashed server-side before storage, never sent to clients
- No user data is persisted — all state is in-memory on the signaling server
- TURN credentials should rotate (Metered.ca supports this)
- Do not log media or chat content on the server
