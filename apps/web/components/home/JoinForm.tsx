'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { extractRoomIdFromUrl, validateRoomId } from '@/lib/roomId'

interface RecentRoom {
  id: string
  name: string
  timestamp: number
}

function getRecentRooms(): RecentRoom[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('vide-recent-rooms') || '[]')
  } catch {
    return []
  }
}

function saveRecentRoom(id: string, name: string) {
  if (typeof window === 'undefined') return
  try {
    const rooms = getRecentRooms().filter((r) => r.id !== id)
    rooms.unshift({ id, name, timestamp: Date.now() })
    localStorage.setItem('vide-recent-rooms', JSON.stringify(rooms.slice(0, 5)))
  } catch {
    // Ignore
  }
}

export function JoinForm() {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const recentRooms = getRecentRooms()

  const handleJoin = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = input.trim()
    if (!trimmed) {
      setError('Please enter a room ID or URL')
      return
    }

    const roomId = extractRoomIdFromUrl(trimmed)
    if (!roomId) {
      setError('Invalid room ID or URL')
      return
    }

    saveRecentRoom(roomId, roomId)
    router.push(`/${roomId}`)
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-6">
      <form onSubmit={handleJoin} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setError(null)
          }}
          placeholder="Enter room code or URL"
          className="flex-1 bg-bg-elevated border border-border-subtle rounded-lg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
        />
        <Button variant="secondary" size="sm" type="submit">
          Join
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {recentRooms.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm text-text-secondary mb-2">Recent calls</h3>
          <ul className="space-y-1">
            {recentRooms.map((room) => (
              <li key={room.id}>
                <button
                  onClick={() => {
                    saveRecentRoom(room.id, room.name)
                    router.push(`/${room.id}`)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-colors flex items-center justify-between"
                >
                  <span>{room.name}</span>
                  <span className="text-text-tertiary text-xs">{formatTime(room.timestamp)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
