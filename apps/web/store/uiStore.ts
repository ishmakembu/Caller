import { create } from 'zustand'

export type ChatMessage = {
  id: string
  senderId: string
  senderName: string
  from?: string
  displayName?: string
  text: string
  timestamp: number
}

type UIState = {
  layout: string
  pinnedPeerId: string | null
  showSelfView: boolean
  isChatOpen: boolean
  isParticipantsOpen: boolean
  isDeviceSelectorOpen: boolean
  chatMessages: ChatMessage[]
  unreadChatCount: number
  setLayout: (l: string) => void
  setPinnedPeer: (id: string | null) => void
  setShowSelfView: (show: boolean) => void
  toggleChat: () => void
  toggleParticipants: () => void
  setDeviceSelectorOpen: (open: boolean) => void
  addChatMessage: (msg: ChatMessage) => void
  markChatRead: () => void
  clearChat: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  layout: 'grid',
  pinnedPeerId: null,
  showSelfView: true,
  isChatOpen: false,
  isParticipantsOpen: false,
  isDeviceSelectorOpen: false,
  chatMessages: [],
  unreadChatCount: 0,
  setLayout: (l) => set({ layout: l }),
  setPinnedPeer: (id) => set({ pinnedPeerId: id }),
  setShowSelfView: (show) => set({ showSelfView: show }),
  toggleChat: () => set((s) => {
    const newState = !s.isChatOpen
    if (newState) {
      return { isChatOpen: true, unreadChatCount: 0 }
    }
    return { isChatOpen: false }
  }),
  toggleParticipants: () => set((s) => ({ isParticipantsOpen: !s.isParticipantsOpen })),
  setDeviceSelectorOpen: (open) => set({ isDeviceSelectorOpen: open }),
  addChatMessage: (msg) => set((s) => {
    const newMessages = [...s.chatMessages, msg]
    const newUnread = s.isChatOpen ? 0 : s.unreadChatCount + 1
    return { chatMessages: newMessages, unreadChatCount: newUnread }
  }),
  markChatRead: () => set({ unreadChatCount: 0 }),
  clearChat: () => set({ chatMessages: [], unreadChatCount: 0 }),
}))
