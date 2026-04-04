'use client'

import { useUIStore } from '@/store/uiStore'
import { LayoutGrid, Maximize2 } from 'lucide-react'

export default function LayoutSwitcher() {
  const layout = useUIStore((s) => s.layout)
  const setLayout = useUIStore((s) => s.setLayout)

  const toggle = () => {
    setLayout(layout === 'grid' ? 'spotlight' : 'grid')
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg bg-bg-elevated/80 backdrop-blur-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all"
      aria-label={`Switch to ${layout === 'grid' ? 'spotlight' : 'grid'} layout`}
    >
      {layout === 'grid' ? <Maximize2 size={18} /> : <LayoutGrid size={18} />}
    </button>
  )
}
