import { useEffect, useRef, useCallback } from 'react'
import { getSocket, connectSocket } from '@/lib/socket'
import { useCallStore } from '@/store/callStore'

interface PeerConnectionWrapper {
  peerId: string
  connection: RTCPeerConnection
  stream: MediaStream | null
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.metered.ca:80' },
]

if (process.env.NEXT_PUBLIC_TURN_URL && process.env.NEXT_PUBLIC_TURN_USERNAME && process.env.NEXT_PUBLIC_TURN_CREDENTIAL) {
  ICE_SERVERS.push({
    urls: process.env.NEXT_PUBLIC_TURN_URL,
    username: process.env.NEXT_PUBLIC_TURN_USERNAME,
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
  })
}

export function useWebRTC(localStream: MediaStream | null) {
  const peersRef = useRef<Map<string, PeerConnectionWrapper>>(new Map())
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  const addPeer = useCallStore((s) => s.addPeer)
  const removePeer = useCallStore((s) => s.removePeer)
  const updatePeer = useCallStore((s) => s.updatePeer)
  const localSocketId = useCallStore((s) => s.localSocketId)

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean): PeerConnectionWrapper => {
    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream)
      })
    }

    const peer: PeerConnectionWrapper = {
      peerId,
      connection,
      stream: null,
    }

    connection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal:ice-candidate', {
          targetSocketId: peerId,
          candidate: event.candidate,
        })
      }
    }

    connection.ontrack = (event) => {
      const [remoteStream] = event.streams
      peer.stream = remoteStream
      updatePeer(peerId, { hasVideo: true, hasAudio: true })
    }

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
        peer.stream = null
        removePeer(peerId)
      }
    }

    peersRef.current.set(peerId, peer)

    if (isInitiator) {
      connection.createOffer()
        .then((offer) => connection.setLocalDescription(offer))
        .then(() => {
          const socket = socketRef.current
          if (socket) {
            socket.emit('signal:offer', {
              targetSocketId: peerId,
              offer: connection.localDescription,
            })
          }
        })
    }

    return peer
  }, [localStream, updatePeer, removePeer])

  const handleOffer = useCallback(async (senderSocketId: string, offer: RTCSessionDescriptionInit) => {
    let peer = peersRef.current.get(senderSocketId)
    if (!peer) {
      peer = createPeerConnection(senderSocketId, false)
    }

    await peer.connection.setRemoteDescription(offer)
    const answer = await peer.connection.createAnswer()
    await peer.connection.setLocalDescription(answer)

    const socket = socketRef.current
    if (socket) {
      socket.emit('signal:answer', {
        targetSocketId: senderSocketId,
        answer: peer.connection.localDescription,
      })
    }
  }, [createPeerConnection])

  const handleAnswer = useCallback(async (senderSocketId: string, answer: RTCSessionDescriptionInit) => {
    const peer = peersRef.current.get(senderSocketId)
    if (peer) {
      await peer.connection.setRemoteDescription(answer)
    }
  }, [])

  const handleIceCandidate = useCallback(async (senderSocketId: string, candidate: RTCIceCandidateInit) => {
    const peer = peersRef.current.get(senderSocketId)
    if (peer) {
      await peer.connection.addIceCandidate(candidate)
    }
  }, [])

  useEffect(() => {
    if (!localSocketId) return

    socketRef.current = connectSocket()
    const socket = socketRef.current

    socket.on('signal:offer', (data: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
      handleOffer(data.senderSocketId, data.offer)
    })

    socket.on('signal:answer', (data: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
      handleAnswer(data.senderSocketId, data.answer)
    })

    socket.on('signal:ice-candidate', (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
      handleIceCandidate(data.senderSocketId, data.candidate)
    })

    socket.on('peer:joined', (data: { socketId: string; displayName: string }) => {
      if (localSocketId) {
        createPeerConnection(data.socketId, true)
        addPeer({
          id: data.socketId,
          name: data.displayName,
          socketId: data.socketId,
          displayName: data.displayName,
        })
      }
    })

    return () => {
      socket.off('signal:offer')
      socket.off('signal:answer')
      socket.off('signal:ice-candidate')
      socket.off('peer:joined')

      peersRef.current.forEach((peer) => {
        peer.connection.close()
      })
      peersRef.current.clear()
    }
  }, [localSocketId, handleOffer, handleAnswer, handleIceCandidate, createPeerConnection, addPeer])

  const getRemoteStreams = useCallback(() => {
    const streams: Map<string, MediaStream> = new Map()
    peersRef.current.forEach((peer, peerId) => {
      if (peer.stream) {
        streams.set(peerId, peer.stream)
      }
    })
    return streams
  }, [])

  return { getRemoteStreams }
}
