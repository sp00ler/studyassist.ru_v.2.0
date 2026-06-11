import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          lime:     '#C5FF45',
          violet:   '#7C3AED',
          blue:     '#3B82F6',
          amber:    '#F59E0B',
          bg:       '#07070E',
          surface:  '#0E0E1C',
          surface2: '#141428',
          surface3: '#1A1A35',
          text:     '#F0F0EC',
          muted:    '#6A6A88',
          danger:   '#FF3B5C',
          /* legacy aliases */
          purple: '#7C3AED',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans:       ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
        unbounded:  ['Unbounded', 'sans-serif'],
        mono:       ["'JetBrains Mono'", 'Consolas', 'monospace'],
        jakarta:    ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':       'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, #8C4EFF 0%, #4B92FF 100%)',
        'gradient-dark':        'linear-gradient(180deg, #07070E 0%, #0E0E1C 100%)',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C5FF45' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        orb: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%':      { transform: 'translate(24px,-24px) scale(1.04)' },
        },
        blink: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.7)' },
        },
        'pulse-ring': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.18' },
          '50%':      { transform: 'scale(1.35)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'marquee-left': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-right': {
          '0%':   { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'orb':            'orb 9s ease-in-out infinite',
        'orb-reverse':    'orb 11s ease-in-out infinite reverse',
        'blink':          'blink 2s ease-in-out infinite',
        'pulse-ring':     'pulse-ring 2.2s ease-in-out infinite',
        'float':          'float 6s ease-in-out infinite',
        'glow':           'glow 3s ease-in-out infinite',
        'slide-up':       'slide-up 0.6s ease-out forwards',
        'fade-in':        'fade-in 0.5s ease-out forwards',
        'shimmer':        'shimmer 2s linear infinite',
        'marquee-left':   'marquee-left 45s linear infinite',
        'marquee-right':  'marquee-right 50s linear infinite',
      },
      boxShadow: {
        'glow-lime':   '0 0 30px rgba(197,255,69,.35)',
        'glow-purple': '0 0 30px rgba(124,58,237,.4)',
        'glow-blue':   '0 0 30px rgba(59,130,246,.4)',
        'glow-amber':  '0 0 20px rgba(245,158,11,.4)',
        glass:         '0 8px 32px rgba(0,0,0,.37)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
