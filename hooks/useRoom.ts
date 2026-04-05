import { useEffect, useRef, useCallback } from 'react'
import { getSocket, connectSocket } from '@/lib/socket'
import { useCallStore } from '@/store/callStore'
import { useUIStore } from '@/store/uiStore'

export function useRoom(roomId: string, displayName: string) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)
  const initializedRef = useRef(false)

  const setRoomId = useCallStore((s) => s.setRoomId)
  const setLocalSocketId = useCallStore((s) => s.setLocalSocketId)
  const setIsHost = useCallStore((s) => s.setIsHost)
  const addPeer = useCallStore((s) => s.addPeer)
  const removePeer = useCallStore((s) => s.removePeer)
  const reset = useCallStore((s) => s.reset)
  const clearChat = useUIStore((s) => s.clearChat)

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off('room:joined')
      socketRef.current.off('peer:joined')
      socketRef.current.off('peer:left')
      socketRef.current.off('chat:message')
      socketRef.current.off('room:host-changed')
      socketRef.current.off('room:kicked')
    }
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    socketRef.current = connectSocket()
    const socket = socketRef.current

    socket.on('room:joined', (data: { roomId: string; peers: Array<{ socketId: string; displayName: string }>; isHost: boolean; yourSocketId: string }) => {
      setRoomId(data.roomId)
      setLocalSocketId(data.yourSocketId)
      setIsHost(data.isHost)

      data.peers.forEach((peer) => {
        if (peer.socketId !== data.yourSocketId) {
          addPeer({
            id: peer.socketId,
            name: peer.displayName,
            socketId: peer.socketId,
            displayName: peer.displayName,
          })
        }
      })
    })

    socket.on('peer:joined', (data: { socketId: string; displayName: string }) => {
      addPeer({
        id: data.socketId,
        name: data.displayName,
        socketId: data.socketId,
        displayName: data.displayName,
      })
    })

    socket.on('peer:left', (data: { socketId: string }) => {
      removePeer(data.socketId)
    })

    socket.on('chat:message', (msg: { id: string; senderId: string; senderName: string; text: string; timestamp: number }) => {
      useUIStore.getState().addChatMessage({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: msg.timestamp,
      })
    })

    socket.on('room:host-changed', () => {
      setIsHost(true)
    })

    socket.on('room:kicked', () => {
      reset()
      clearChat()
      window.location.href = '/'
    })

    socket.emit('join', { roomId, displayName })

    return () => {
      cleanup()
      socket.emit('leave', { roomId })
      reset()
      clearChat()
    }
  }, [roomId, displayName, setRoomId, setLocalSocketId, setIsHost, addPeer, removePeer, reset, clearChat, cleanup])

  return { socket: socketRef.current }
}
