'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { useUIStore, ChatMessage } from '@/store/uiStore'
import { getSocket } from '@/lib/socket'
import { useCallStore } from '@/store/callStore'

export default function ChatPanel() {
  const isOpen = useUIStore((s) => s.isChatOpen)
  const messages = useUIStore((s) => s.chatMessages)
  const markChatRead = useUIStore((s) => s.markChatRead)
  const toggleChat = useUIStore((s) => s.toggleChat)
  const localSocketId = useCallStore((s) => s.localSocketId)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) markChatRead()
  }, [isOpen, markChatRead])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    const socket = getSocket()
    socket.emit('chat:message', { text })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) return null

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-bg-base">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <button onClick={toggleChat} className="p-2 -ml-2 text-text-secondary hover:text-text-primary" aria-label="Close chat">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-base font-semibold text-text-primary">Chat</h2>
          <div className="w-8" />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-text-tertiary text-sm mt-8">No messages yet</p>
          )}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} isSelf={msg.from === localSocketId} />
          ))}
          <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-border-subtle">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={500}
              className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2 bg-accent text-bg-base rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-l border-border-subtle bg-bg-surface flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-text-primary">Chat</h2>
        <button onClick={toggleChat} className="p-1 text-text-secondary hover:text-text-primary" aria-label="Close chat">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-text-tertiary text-sm mt-8">No messages yet</p>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} isSelf={msg.from === localSocketId} />
        ))}
        <div ref={messagesEndRef as React.RefObject<HTMLDivElement>} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border-subtle">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-4 py-2 bg-accent text-bg-base rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ msg, isSelf }: { msg: ChatMessage; isSelf: boolean }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isSelf) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%]">
          <p className="text-xs text-text-tertiary text-right mb-1">{time}</p>
          <div className="bg-bg-elevated rounded-lg px-3 py-2 text-sm text-text-primary">
            {msg.text}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[85%]">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xs font-medium text-accent">{msg.displayName}</span>
        <span className="text-xs text-text-tertiary">{time}</span>
      </div>
      <p className="text-sm text-text-primary">{msg.text}</p>
    </div>
  )
}
