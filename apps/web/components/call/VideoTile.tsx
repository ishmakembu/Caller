import React, { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

export interface VideoTileProps {
  peerId: string
  name?: string
  stream?: MediaStream | null
  muted?: boolean
  speaking?: boolean
  size?: 'large' | 'small'
}

const avatarColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6'
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const VideoTile: React.FC<VideoTileProps> = ({ peerId, name, stream, muted = false, speaking = false, size = 'small' }) => {
  const isLarge = size === 'large'
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasVideo, setHasVideo] = useState(true)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      setHasVideo(videoTrack?.enabled ?? true)
    }
  }, [stream])

  const showAvatar = !stream || !hasVideo

  return (
    <div
      className={`video-tile ${isLarge ? 'large' : 'small'} ${speaking ? 'speaking' : ''}`}
      style={{
        background: '#111',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        border: speaking ? '2px solid var(--success)' : '0.5px solid var(--border-subtle)',
        animation: 'tile-enter 280ms var(--ease-out) forwards',
      }}
      aria-label={`Video tile for ${name ?? peerId}`}
    >
      {!showAvatar ? (
        <video
          ref={videoRef}
          muted={muted}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: muted ? 'none' : 'none' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: getAvatarColor(name || peerId),
          }}
        >
          <span style={{ fontSize: isLarge ? '64px' : '32px', fontWeight: 500, color: 'white' }}>
            {getInitials(name || peerId)}
          </span>
        </div>
      )}

      {/* Name badge */}
      <div
        style={{
          position: 'absolute',
          left: 'var(--space-3)',
          bottom: 'var(--space-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <span
          style={{
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'white',
          }}
        >
          {name ?? peerId}
        </span>
        {muted && (
          <span
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MicOff size={14} color="var(--danger)" />
          </span>
        )}
      </div>

      <style>{`
        @keyframes tile-enter {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .video-tile.large {
          min-height: 300px;
        }
        .video-tile.small {
          min-height: 180px;
        }
        .video-tile.speaking {
          box-shadow: 0 0 0 2px var(--success);
          animation: speaking-pulse 800ms ease-in-out infinite, tile-enter 280ms var(--ease-out) forwards;
        }
        @keyframes speaking-pulse {
          0%, 100% { box-shadow: 0 0 0 2px var(--success); }
          50% { box-shadow: 0 0 0 4px var(--success); }
        }
        @media (max-width: 640px) {
          .video-tile.large { min-height: 200px; }
          .video-tile.small { min-height: 140px; }
        }
      `}</style>
    </div>
  )
}

export default VideoTile
