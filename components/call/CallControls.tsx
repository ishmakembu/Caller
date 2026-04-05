'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, MessageSquare, Users, MoreHorizontal, PhoneOff, LayoutGrid, Maximize2, X } from 'lucide-react'
import { IconButton } from '@/components/ui/IconButton'
import { useCallStore } from '@/store/callStore'
import { useUIStore } from '@/store/uiStore'
import { getSocket } from '@/lib/socket'
import { useScreenShare } from '@/hooks/useScreenShare'
import { usePiP } from '@/hooks/usePiP'

interface CallControlsProps {
  onLeave: () => void
  onToggleLayout: () => void
}

export default function CallControls({ onLeave, onToggleLayout }: CallControlsProps) {
  const isMuted = useCallStore((s) => s.isMuted)
  const isCameraOff = useCallStore((s) => s.isCameraOff)
  const localStream = useCallStore((s) => s.localStream)
  const unreadChatCount = useUIStore((s) => s.unreadChatCount)
  const layout = useUIStore((s) => s.layout)
  const isChatOpen = useUIStore((s) => s.isChatOpen)
  const isParticipantsOpen = useUIStore((s) => s.isParticipantsOpen)
  const toggleChat = useUIStore((s) => s.toggleChat)
  const toggleParticipants = useUIStore((s) => s.toggleParticipants)
  const toggleMute = useCallStore((s) => s.toggleMute)
  const toggleCamera = useCallStore((s) => s.toggleCamera)
  const setDeviceSelectorOpen = useUIStore((s) => s.setDeviceSelectorOpen)

  const { isSharing, start: startShare, stop: stopShare, isSupported: screenShareSupported } = useScreenShare()
  const { isActive: pipActive, start: startPip, isAvailable: pipAvailable } = usePiP()

  const [showMore, setShowMore] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const resetHideTimer = useCallback(() => {
    if (!isMobile) return
    setControlsVisible(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile) return
    resetHideTimer()
    const handleMove = () => resetHideTimer()
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('touchstart', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('touchstart', handleMove)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [isMobile, resetHideTimer])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key.toLowerCase()) {
        case 'm':
          toggleMute()
          break
        case 'v':
          toggleCamera()
          break
        case 's':
          if (screenShareSupported) {
            isSharing ? stopShare() : startShare()
          }
          break
        case 'c':
          toggleChat()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMute, toggleCamera, toggleChat, screenShareSupported, isSharing, startShare, stopShare])

  const handleScreenShare = () => {
    isSharing ? stopShare() : startShare()
  }

  const handlePip = () => {
    if (pipActive) {
      document.exitPictureInPicture().catch(() => {})
    } else {
      const video = document.querySelector('video') as HTMLVideoElement | null
      if (video) startPip(video)
    }
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
        controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base/95 via-bg-base/60 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-center gap-2 px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {/* Mic */}
        <IconButton
          variant={isMuted ? 'danger' : 'default'}
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </IconButton>

        {/* Camera */}
        <IconButton
          variant={isCameraOff ? 'danger' : 'default'}
          onClick={toggleCamera}
          aria-label={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </IconButton>

        {/* Screen Share */}
        {screenShareSupported && (
          <IconButton
            variant={isSharing ? 'active' : 'default'}
            onClick={handleScreenShare}
            aria-label={isSharing ? 'Stop screen sharing' : 'Start screen sharing'}
          >
            {isSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
          </IconButton>
        )}

        {/* Layout Switcher */}
        <IconButton
          variant="default"
          onClick={onToggleLayout}
          aria-label={`Switch to ${layout === 'grid' ? 'spotlight' : 'grid'} layout`}
        >
          {layout === 'grid' ? <Maximize2 size={20} /> : <LayoutGrid size={20} />}
        </IconButton>

        {/* Chat */}
        <IconButton
          variant={isChatOpen ? 'active' : 'default'}
          onClick={toggleChat}
          aria-label="Toggle chat"
          badge={unreadChatCount > 0 ? unreadChatCount : undefined}
        >
          <MessageSquare size={20} />
        </IconButton>

        {/* Participants */}
        <IconButton
          variant={isParticipantsOpen ? 'active' : 'default'}
          onClick={toggleParticipants}
          aria-label="Toggle participants"
        >
          <Users size={20} />
        </IconButton>

        {/* More */}
        <div className="relative">
          <IconButton
            variant={showMore ? 'active' : 'default'}
            onClick={() => setShowMore(!showMore)}
            aria-label="More options"
          >
            <MoreHorizontal size={20} />
          </IconButton>

          {showMore && (
            <div className="absolute bottom-full mb-2 right-0 bg-bg-elevated border border-border-subtle rounded-xl p-2 min-w-[180px] shadow-xl">
              <button
                onClick={() => {
                  setDeviceSelectorOpen(true)
                  setShowMore(false)
                }}
                className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                Device settings
              </button>
              {pipAvailable && (
                <button
                  onClick={() => {
                    handlePip()
                    setShowMore(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                >
                  {pipActive ? 'Exit PiP' : 'Picture-in-Picture'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* End Call */}
        <button
          onClick={onLeave}
          className="inline-flex items-center justify-center w-16 h-11 rounded-full bg-danger text-white hover:bg-danger/90 active:scale-[0.95] transition-all ml-2"
          aria-label="End call"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  )
}
