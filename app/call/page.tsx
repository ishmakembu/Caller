'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Copy, Check } from 'lucide-react'
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket'
import { useCallStore } from '@/store/callStore'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

interface PeerConnectionWrapper {
  peerId: string
  connection: RTCPeerConnection
  stream: MediaStream | null
}

export default function CallPage() {
  const [name, setName] = useState('')
  const [callCode] = useState(() => Math.random().toString(36).substring(2, 10).toUpperCase())
  const [inCall, setInCall] = useState(false)
  const [callTime, setCallTime] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connecting' | 'connected'>('waiting')
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<PeerConnectionWrapper | null>(null)
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('vide_display_name')
    if (saved) setName(saved)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (inCall) {
      interval = setInterval(() => setCallTime(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [inCall])

  const createPeerConnection = useCallback((peerId: string): PeerConnectionWrapper => {
    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    const localStream = localStreamRef.current

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream)
      })
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
      const [stream] = event.streams
      setRemoteStream(stream)
      setConnectionStatus('connected')
    }

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'disconnected' || connection.connectionState === 'failed') {
        setRemoteStream(null)
        setConnectionStatus('waiting')
      }
    }

    const peer: PeerConnectionWrapper = {
      peerId,
      connection,
      stream: null,
    }
    
    peerConnectionRef.current = peer
    
    connection.createOffer()
      .then((offer) => connection.setLocalDescription(offer))
      .then(() => {
        if (socketRef.current && connection.localDescription) {
          socketRef.current.emit('signal:offer', {
            targetSocketId: peerId,
            offer: connection.localDescription,
          })
        }
      })

    return peer
  }, [])

  const handleOffer = useCallback(async (senderSocketId: string, offer: RTCSessionDescriptionInit) => {
    let peer = peerConnectionRef.current
    if (!peer) {
      peer = createPeerConnection(senderSocketId)
    }

    await peer.connection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peer.connection.createAnswer()
    await peer.connection.setLocalDescription(answer)

    if (socketRef.current && peer.connection.localDescription) {
      socketRef.current.emit('signal:answer', {
        targetSocketId: senderSocketId,
        answer: peer.connection.localDescription,
      })
    }
  }, [createPeerConnection])

  const handleAnswer = useCallback(async (senderSocketId: string, answer: RTCSessionDescriptionInit) => {
    const peer = peerConnectionRef.current
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }, [])

  const handleIceCandidate = useCallback(async (senderSocketId: string, candidate: RTCIceCandidateInit) => {
    const peer = peerConnectionRef.current
    if (peer) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  const startCall = async () => {
    if (!name.trim()) return
    
    localStorage.setItem('vide_display_name', name)
    setConnecting(true)

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      
      localStreamRef.current = mediaStream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream
      }

      socketRef.current = connectSocket()
      const socket = socketRef.current

      socket.on('connect', () => {
        socket.emit('join', { roomId: callCode, displayName: name })
      })

      socket.on('room:joined', () => {
        setInCall(true)
        setConnecting(false)
        setConnectionStatus('waiting')
      })

      socket.on('peer:joined', (data: { socketId: string; displayName: string }) => {
        setConnectionStatus('connecting')
        createPeerConnection(data.socketId)
      })

      socket.on('signal:offer', (data: { senderSocketId: string; offer: RTCSessionDescriptionInit }) => {
        handleOffer(data.senderSocketId, data.offer)
      })

      socket.on('signal:answer', (data: { senderSocketId: string; answer: RTCSessionDescriptionInit }) => {
        handleAnswer(data.senderSocketId, data.answer)
      })

      socket.on('signal:ice-candidate', (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
        handleIceCandidate(data.senderSocketId, data.candidate)
      })

      socket.on('peer:left', () => {
        setRemoteStream(null)
        setConnectionStatus('waiting')
        if (peerConnectionRef.current) {
          peerConnectionRef.current.connection.close()
          peerConnectionRef.current = null
        }
      })

      socket.connect()
    } catch (err) {
      console.error('Failed to get media:', err)
      setConnecting(false)
    }
  }

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.connection.close()
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    window.location.href = '/'
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => track.enabled = isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => track.enabled = isCameraOn)
      setIsCameraOn(!isCameraOn)
    }
  }

  const copyCode = async () => {
    const url = `${window.location.origin}/join/${callCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  if (!inCall) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#0d0e12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '280px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100%',
            aspectRatio: '4/3',
            background: '#15171d',
            borderRadius: '16px',
            marginBottom: '24px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {localStreamRef.current && isCameraOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            ) : (
              <span style={{ fontSize: '48px', color: '#7eb8ff' }}>
                {name ? name[0].toUpperCase() : '?'}
              </span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: '#15171d',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                color: '#f0f0f2',
                fontSize: '15px',
                outline: 'none',
                textAlign: 'center'
              }}
            />
          </div>

          <button
            onClick={startCall}
            disabled={!name.trim() || connecting}
            style={{
              width: '100%',
              padding: '16px',
              background: name.trim() && !connecting ? '#7eb8ff' : '#252830',
              color: name.trim() && !connecting ? '#0d0e12' : '#4e5060',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: name.trim() && !connecting ? 'pointer' : 'default'
            }}
          >
            <Video size={20} />
            {connecting ? 'Connecting...' : 'Start Call'}
          </button>

          <div style={{ marginTop: '24px', padding: '16px', background: '#15171d', borderRadius: '12px' }}>
            <p style={{ color: '#8b8d96', fontSize: '13px', marginBottom: '8px' }}>
              Your call code:
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'monospace',
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '2px',
              color: '#f0f0f2'
            }}>
              {callCode}
              <button
                onClick={copyCode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7eb8ff',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p style={{ color: '#4e5060', fontSize: '12px', marginTop: '8px' }}>
              Send this code to your partner
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d0e12',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        gap: '16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '300px',
          aspectRatio: '4/3',
          borderRadius: '16px',
          overflow: 'hidden',
          background: '#15171d',
          position: 'relative'
        }}>
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#15171d'
            }}>
              <span style={{ fontSize: '48px', color: '#7eb8ff', marginBottom: '12px' }}>
                {connectionStatus === 'connected' ? '✓' : '⏳'}
              </span>
              <span style={{ color: '#8b8d96', fontSize: '14px' }}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 'Waiting for partner...'}
              </span>
            </div>
          )}
          
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.6)',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            Partner
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '100px',
          aspectRatio: '4/3',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#15171d',
          border: '2px solid #252830'
        }}>
          {localStreamRef.current && isCameraOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)'
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px', color: '#7eb8ff' }}>
                {name ? name[0].toUpperCase() : '?'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '8px' }}>
        <span style={{ color: '#4caf7d', fontSize: '14px' }}>
          {formatTime(callTime)}
        </span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))'
      }}>
        <button
          onClick={toggleMute}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: isMuted ? '#ff5f5f' : '#1e2028',
            border: '1px solid rgba(255,255,255,0.06)',
            color: isMuted ? '#fff' : '#f0f0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        <button
          onClick={toggleCamera}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: !isCameraOn ? '#ff5f5f' : '#1e2028',
            border: '1px solid rgba(255,255,255,0.06)',
            color: !isCameraOn ? '#fff' : '#f0f0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>

        <button
          onClick={endCall}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#ff5f5f',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </main>
  )
}