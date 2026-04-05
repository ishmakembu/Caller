'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface SelfViewProps {
  stream: MediaStream | null
  isCameraOff?: boolean
  displayName?: string
}

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export default function SelfView({ stream, isCameraOff = false, displayName = 'You' }: SelfViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [position, setPosition] = useState<Corner>('bottom-right')
  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0 })
  const showSelfView = useUIStore((s) => s.showSelfView)
  const setShowSelfView = useUIStore((s) => s.setShowSelfView)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cx = vw / 2 + offset.x
    const cy = vh / 2 + offset.y
    let newCorner: Corner = 'bottom-right'
    if (cx < vw / 2 && cy < vh / 2) newCorner = 'top-left'
    else if (cx >= vw / 2 && cy < vh / 2) newCorner = 'top-right'
    else if (cx < vw / 2 && cy >= vh / 2) newCorner = 'bottom-left'
    setPosition(newCorner)
    setOffset({ x: 0, y: 0 })
  }, [offset])

  if (!showSelfView) return null

  const cornerClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-right': 'bottom-24 right-4',
  }

  return (
    <div
      className={`fixed z-30 w-32 sm:w-40 aspect-video rounded-lg overflow-hidden bg-bg-surface border border-border-subtle shadow-xl cursor-grab active:cursor-grabbing ${cornerClasses[position]} ${isDragging ? 'opacity-80 scale-105' : ''} transition-all`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
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
        <div className="w-full h-full flex items-center justify-center bg-bg-surface">
          <span className="text-text-secondary text-xs">{displayName[0]?.toUpperCase() || '?'}</span>
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowSelfView(false)
        }}
        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 opacity-0 hover:opacity-100 transition-opacity"
        aria-label="Hide self view"
      >
        <X size={12} />
      </button>
    </div>
  )
}
