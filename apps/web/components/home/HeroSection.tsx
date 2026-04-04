'use client'

import { Button } from '@/components/ui/Button'

interface HeroSectionProps {
  onCreateRoom: () => void
}

export function HeroSection({ onCreateRoom }: HeroSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary leading-tight tracking-tight">
        Video calls.
        <br />
        No installs.
      </h1>
      <p className="mt-4 text-text-secondary text-lg max-w-md">
        Open a URL, share the link, and call. Works on desktop, iPhone, and Android.
      </p>
      <div className="mt-8 w-full max-w-sm">
        <Button variant="primary" size="lg" onClick={onCreateRoom} className="w-full">
          New Call
        </Button>
      </div>
    </div>
  )
}
