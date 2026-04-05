import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

function getSignalingUrl() {
  if (typeof window === 'undefined') return 'http://localhost:4000'
  
  const envUrl = process.env.NEXT_PUBLIC_SIGNALING_URL
  if (envUrl) return envUrl
  
  const { protocol, hostname, port } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port || 4000}`
  }
  return `${protocol}//${hostname}`
}

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(getSignalingUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export const connectSocket = () => {
  const socket = getSocket()
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export { Socket }
