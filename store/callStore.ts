import { create } from 'zustand'

export type Peer = {
  id: string
  name: string
  socketId?: string
  displayName?: string
  hasVideo?: boolean
  hasAudio?: boolean
  isHost?: boolean
  isScreenSharing?: boolean
}

export type ChatMessage = {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: number
}

type CallState = {
  peers: Map<string, Peer>
  localPeerId?: string
  localSocketId?: string
  roomId?: string
  isHost: boolean
  isMuted: boolean
  isCameraOff: boolean
  localStream: MediaStream | null
  screenStream: MediaStream | null
  setRoomId: (id: string | undefined) => void
  setLocalSocketId: (id: string) => void
  setIsHost: (isHost: boolean) => void
  addPeer: (p: Peer) => void
  removePeer: (id: string) => void
  updatePeer: (id: string, updates: Partial<Peer>) => void
  toggleMute: () => void
  toggleCamera: () => void
  setLocalStream: (stream: MediaStream | null) => void
  setScreenStream: (stream: MediaStream | null) => void
  reset: () => void
}

export const useCallStore = create<CallState>((set, get) => ({
  peers: new Map(),
  localPeerId: 'local',
  localSocketId: undefined,
  roomId: undefined,
  isHost: false,
  isMuted: false,
  isCameraOff: false,
  localStream: null,
  screenStream: null,
  setRoomId: (id) => set({ roomId: id }),
  setLocalSocketId: (id) => set({ localSocketId: id }),
  setIsHost: (isHost) => set({ isHost }),
  addPeer: (p) => set((s) => {
    const newPeers = new Map(s.peers)
    newPeers.set(p.id, p)
    return { peers: newPeers }
  }),
  removePeer: (id) => set((s) => {
    const newPeers = new Map(s.peers)
    newPeers.delete(id)
    return { peers: newPeers }
  }),
  updatePeer: (id, updates) => set((s) => {
    const newPeers = new Map(s.peers)
    const existing = newPeers.get(id)
    if (existing) {
      newPeers.set(id, { ...existing, ...updates })
    }
    return { peers: newPeers }
  }),
  toggleMute: () => {
    const { localStream, isMuted } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
    }
    set({ isMuted: !isMuted })
  },
  toggleCamera: () => {
    const { localStream, isCameraOff } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff
      })
    }
    set({ isCameraOff: !isCameraOff })
  },
  setLocalStream: (stream) => set({ localStream: stream }),
  setScreenStream: (stream) => set({ screenStream: stream }),
  reset: () => set({
    peers: new Map(),
    localPeerId: 'local',
    localSocketId: undefined,
    roomId: undefined,
    isHost: false,
    isMuted: false,
    isCameraOff: false,
    localStream: null,
    screenStream: null,
  }),
}))
