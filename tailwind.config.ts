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
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          green:    '#2FAE5B',
          greenHi:  '#3FC96B',
          amber:    '#E8A33D',
          ivory:    '#EFE8D8',
          paper:    '#F7F1E4',
          ink:      '#1A1714',
          inkDeep:  '#211C15',
          text:     '#F5F0E3',
          muted:    '#6B6255',
          danger:   '#C0392B',
        },
        // "Vintage OS" (Win95/98) tokens — shared brief, use these Tailwind
        // names everywhere, never raw hex. See scratchpad/BRIEF.md.
        desk:          'rgb(var(--desk) / <alpha-value>)',
        chrome:        'rgb(var(--chrome) / <alpha-value>)',
        'chrome-light':  'rgb(var(--chrome-light) / <alpha-value>)',
        'chrome-dark':   'rgb(var(--chrome-dark) / <alpha-value>)',
        'chrome-shadow': 'rgb(var(--chrome-shadow) / <alpha-value>)',
        paper:         'rgb(var(--paper) / <alpha-value>)',
        ink:           'rgb(var(--ink) / <alpha-value>)',
        'ink-soft':      'rgb(var(--ink-soft) / <alpha-value>)',
        title:         'rgb(var(--title) / <alpha-value>)',
        'title-alt':     'rgb(var(--title-alt) / <alpha-value>)',
        accent:        'rgb(var(--accent) / <alpha-value>)',
        success:       'rgb(var(--success) / <alpha-value>)',
        warning:       'rgb(var(--warning) / <alpha-value>)',
        danger:        'rgb(var(--danger) / <alpha-value>)',
      },
      borderRadius: {
        // Vintage OS shape rule: radius 0 everywhere. Every key kept so
        // existing `rounded-*` classes across the app keep compiling —
        // they now render flat instead of erroring.
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 1px)',
        sm: 'calc(var(--radius) - 1px)',
        none: '0px',
        DEFAULT: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      fontFamily: {
        // Vintage OS type: display = Press Start 2P (headings, window titles, buttons),
        // sans = Tiny5 (body, pixel, single weight), mono = Share Tech Mono (digits; Latin-only, so Cyrillic falls back to JetBrains Mono).
        sans:       ["'Tiny5'", 'system-ui', 'sans-serif'],
        display:    ["'Press Start 2P'", 'monospace'],
        unbounded:  ['Unbounded', 'sans-serif'],
        pixel:      ["'Press Start 2P'", "'Unbounded'", 'monospace'],
        mono:       ["'Share Tech Mono'", "'JetBrains Mono'", 'Consolas', 'monospace'],
        jakarta:    ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232FAE5B' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
        'glow-green':  '0 0 20px rgba(47,174,91,.35)',
        'glow-amber':  '0 0 20px rgba(232,163,61,.4)',
        'hard-sm':     '3px 3px 0 rgba(26,23,20,.9)',
        'hard-md':     '5px 5px 0 rgba(26,23,20,.9)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
