'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, Link as LinkIcon, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { useLocalMedia } from '@/hooks/useLocalMedia'
import toast from 'react-hot-toast'

interface WaitingRoomProps {
  roomId: string
  displayName: string
  onNameChange: (name: string) => void
  onJoin: () => void
  onBack: () => void
}

export default function WaitingRoom({ roomId, displayName, onNameChange, onJoin, onBack }: WaitingRoomProps) {
  const { stream, acquiring, acquire, release } = useLocalMedia()
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    acquire()
    return () => release()
  }, [acquire, release])

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  const handleToggleAudio = () => {
    const track = stream?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsMuted(!track.enabled)
    }
  }

  const handleToggleVideo = () => {
    const track = stream?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsCameraOff(!track.enabled)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-8">
      <button onClick={onBack} className="self-start mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>

      <div className="w-full max-w-lg">
        <div className="relative aspect-video bg-bg-surface rounded-xl overflow-hidden mb-6 border border-border-subtle">
          {stream && !isCameraOff ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-bg-elevated flex items-center justify-center text-3xl text-text-secondary">
                {displayName[0]?.toUpperCase() || '?'}
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <IconButton variant={isMuted ? 'danger' : 'default'} onClick={handleToggleAudio} aria-label="Toggle mic">
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </IconButton>
            <IconButton variant={isCameraOff ? 'danger' : 'default'} onClick={handleToggleVideo} aria-label="Toggle camera">
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </IconButton>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-text-secondary mb-2">Your name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name"
            maxLength={30}
            className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={onJoin}
          disabled={!displayName.trim() || acquiring}
          className="w-full mb-4"
        >
          {acquiring ? 'Starting camera...' : 'Join Call'}
        </Button>

        <div className="flex items-center justify-between bg-bg-surface border border-border-subtle rounded-lg px-4 py-3">
          <span className="text-sm text-text-secondary truncate mr-2">
            Room: {roomId}
          </span>
          <button onClick={copyLink} className="flex items-center gap-1 text-accent text-sm hover:text-accent/80 transition-colors flex-shrink-0">
            <LinkIcon size={14} />
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}
