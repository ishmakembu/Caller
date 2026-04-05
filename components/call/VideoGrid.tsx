'use client'

import React from 'react'

type VideoGridProps = {
  children?: React.ReactNode
}

export default function VideoGrid({ children }: VideoGridProps) {
  return (
    <div className="video-grid">
      <style>{`
        .video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-3);
          padding: var(--space-4);
          width: 100%;
          height: 100%;
        }
        @media (max-width: 640px) {
          .video-grid {
            grid-template-columns: 1fr;
            gap: var(--space-2);
          }
        }
        @media (min-width: 1280px) {
          .video-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      {children}
    </div>
  )
}
