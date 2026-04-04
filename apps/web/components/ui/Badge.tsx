'use client'

interface BadgeProps {
  label: string
  variant?: 'default' | 'accent' | 'danger' | 'success' | 'warning'
}

const variantClasses: Record<string, string> = {
  default: 'bg-bg-elevated text-text-secondary',
  accent: 'bg-accent/20 text-accent',
  danger: 'bg-danger/20 text-danger',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  )
}
