'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Copy, Check } from 'lucide-react'
import { nanoid } from 'nanoid'

export default function HomePage() {
  const [name, setName] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('vide_display_name')
    if (saved) setName(saved)
  }, [])

  const handleCall = () => {
    const savedName = name.trim() || 'Me'
    localStorage.setItem('vide_display_name', savedName)
    window.location.href = '/call'
  }

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d0e12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#8b8d96'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d0e12',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '280px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: '#7eb8ff',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Phone size={36} color="#0d0e12" />
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#f0f0f2'
        }}>
          Vide
        </h1>
        <p style={{
          color: '#8b8d96',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          Video call your loved one
        </p>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#15171d',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              color: '#f0f0f2',
              fontSize: '15px',
              outline: 'none',
              textAlign: 'center'
            }}
          />
        </div>

        <button
          onClick={handleCall}
          disabled={!name.trim()}
          style={{
            width: '100%',
            padding: '16px',
            background: name.trim() ? '#7eb8ff' : '#252830',
            color: name.trim() ? '#0d0e12' : '#4e5060',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: name.trim() ? 'pointer' : 'default'
          }}
        >
          <Phone size={20} />
          Call
        </button>
      </div>
    </main>
  )
}
