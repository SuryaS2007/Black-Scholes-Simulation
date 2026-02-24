/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Function-based colors: Tailwind passes the string through verbatim without
        // resolving the CSS variable at build time, enabling runtime light/dark theming.
        navy: Object.fromEntries(
          ['950','900','850','800','750','700','600','500','400','300','200','100','50'].map(n => [
            n,
            ({ opacityValue }) =>
              opacityValue !== undefined
                ? `rgb(var(--navy-${n}) / ${opacityValue})`
                : `rgb(var(--navy-${n}))`,
          ])
        ),
        electric: {
          DEFAULT: '#00C8FF',
          dim: '#0096BF',
          glow: 'rgba(0,200,255,0.12)',
        },
        neon: {
          DEFAULT: '#00FF8A',
          dim: '#00C26A',
          glow: 'rgba(0,255,138,0.12)',
        },
        loss: {
          DEFAULT: '#FF3366',
          dim: '#CC2952',
          glow: 'rgba(255,51,102,0.12)',
        },
        gold: {
          DEFAULT: '#FFB340',
          dim: '#CC8F33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,200,255,0.15)' },
          '50%': { boxShadow: '0 0 20px rgba(0,200,255,0.35)' },
        },
        'number-up': {
          '0%': { color: '#00FF8A' },
          '100%': { color: 'inherit' },
        },
        'number-down': {
          '0%': { color: '#FF3366' },
          '100%': { color: 'inherit' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out forwards',
        'slide-left': 'slide-left 0.25s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'number-up': 'number-up 0.6s ease-out',
        'number-down': 'number-down 0.6s ease-out',
      },
      boxShadow: {
        glass: '0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glass-lg': '0 8px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        glow: '0 0 24px rgba(0,200,255,0.12), 0 4px 32px rgba(0,0,0,0.5)',
        'glow-green': '0 0 24px rgba(0,255,138,0.12), 0 4px 32px rgba(0,0,0,0.5)',
        'glow-red': '0 0 24px rgba(255,51,102,0.12), 0 4px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
