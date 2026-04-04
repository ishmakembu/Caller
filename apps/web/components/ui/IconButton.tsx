'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'active' | 'danger'
  badge?: number
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, variant = 'default', badge, className = '', ...props }, ref) => {
    const base = 'relative inline-flex items-center justify-center w-11 h-11 rounded-full transition-all duration-120 ease-out focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed'

    const variants: Record<string, string> = {
      default: 'bg-bg-elevated border border-border-subtle text-text-secondary hover:bg-bg-hover hover:text-text-primary',
      active: 'bg-bg-hover text-text-primary border border-border-subtle',
      danger: 'bg-danger/15 border border-danger/30 text-danger hover:bg-danger/25',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'
