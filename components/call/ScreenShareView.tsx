'use client'

import { useEffect, useRef } from 'react'
import { Monitor } from 'lucide-react'

interface ScreenShareViewProps {
  stream: MediaStream | null
}

export default function ScreenShareView({ stream }: ScreenShareViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  if (!stream) return null

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-bg-elevated/90 backdrop-blur-sm text-text-primary text-xs px-2 py-1 rounded-md flex items-center gap-1.5">
        <Monitor size={12} />
        Screen sharing
      </div>
    </div>
  )
}
