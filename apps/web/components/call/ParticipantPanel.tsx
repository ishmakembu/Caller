'use client'

import { X, Link as LinkIcon, UserMinus } from 'lucide-react'
import { useCallStore, Peer } from '@/store/callStore'
import { useUIStore } from '@/store/uiStore'
import { getSocket } from '@/lib/socket'
import toast from 'react-hot-toast'

export default function ParticipantPanel() {
  const isOpen = useUIStore((s) => s.isParticipantsOpen)
  const toggleParticipants = useUIStore((s) => s.toggleParticipants)
  const peers = useCallStore((s) => s.peers)
  const localSocketId = useCallStore((s) => s.localSocketId)
  const isHost = useCallStore((s) => s.isHost)

  if (!isOpen) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const kickPeer = (socketId: string) => {
    const socket = getSocket()
    socket.emit('room:kick', { socketId })
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-bg-base flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">Participants ({peers.size + 1})</h2>
          <button onClick={toggleParticipants} className="p-1 text-text-secondary hover:text-text-primary" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <ParticipantList peers={peers} localSocketId={localSocketId} isHost={isHost} onKick={kickPeer} />
        </div>
        <div className="px-4 py-3 border-t border-border-subtle">
          <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 py-2 text-accent text-sm hover:text-accent/80 transition-colors">
            <LinkIcon size={16} />
            Copy invite link
          </button>
        </div>
      </div>
    )
  }

  return null
}

export function ParticipantPanelDesktop() {
  const isOpen = useUIStore((s) => s.isParticipantsOpen)
  const toggleParticipants = useUIStore((s) => s.toggleParticipants)
  const peers = useCallStore((s) => s.peers)
  const localSocketId = useCallStore((s) => s.localSocketId)
  const isHost = useCallStore((s) => s.isHost)

  if (!isOpen) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const kickPeer = (socketId: string) => {
    const socket = getSocket()
    socket.emit('room:kick', { socketId })
  }

  return (
    <div className="w-72 border-l border-border-subtle bg-bg-surface flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <h2 className="text-base font-semibold text-text-primary">Participants ({peers.size + 1})</h2>
        <button onClick={toggleParticipants} className="p-1 text-text-secondary hover:text-text-primary" aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <ParticipantList peers={peers} localSocketId={localSocketId} isHost={isHost} onKick={kickPeer} />
      </div>
      <div className="px-4 py-3 border-t border-border-subtle">
        <button onClick={copyLink} className="w-full flex items-center justify-center gap-2 py-2 text-accent text-sm hover:text-accent/80 transition-colors">
          <LinkIcon size={16} />
          Copy invite link
        </button>
      </div>
    </div>
  )
}

function ParticipantList({ peers, localSocketId, isHost, onKick }: {
  peers: Map<string, Peer>
  localSocketId: string | undefined
  isHost: boolean
  onKick: (socketId: string) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-elevated">
        <span className="text-sm text-text-primary">You {isHost && '(Host)'}</span>
        <span className="text-xs text-success">Connected</span>
      </div>
      {[...peers.values()].map((peer) => {
        const peerSocketId = peer.socketId ?? peer.id
        const peerDisplayName = peer.displayName ?? peer.name
        return (
          <div key={peerSocketId} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-bg-hover transition-colors">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${peer.hasAudio ? 'bg-success' : 'bg-danger'}`} />
              <span className="text-sm text-text-primary">{peerDisplayName}</span>
            </div>
            {isHost && peerSocketId !== localSocketId && (
              <button onClick={() => onKick(peerSocketId)} className="p-1 text-text-tertiary hover:text-danger transition-colors" aria-label={`Remove ${peerDisplayName}`}>
                <UserMinus size={16} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
