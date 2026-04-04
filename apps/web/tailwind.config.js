/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'bg-hover': 'var(--bg-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        accent: 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      animation: {
        'tile-enter': 'tile-enter 280ms var(--ease-out)',
        'speaking-pulse': 'speaking-pulse 800ms ease-in-out infinite',
        'reaction-float': 'reaction-float 2s ease-out forwards',
      },
      keyframes: {
        'tile-enter': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'speaking-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 2px var(--success)' },
          '50%': { boxShadow: '0 0 0 4px var(--success)' },
        },
        'reaction-float': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '80%': { opacity: '1', transform: 'translateY(-80px) scale(1.2)' },
          '100%': { opacity: '0', transform: 'translateY(-100px) scale(0.8)' },
        },
      },
    },
  },
  plugins: [],
}
