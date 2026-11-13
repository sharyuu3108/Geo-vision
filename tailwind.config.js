/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#06152E',
          900: '#0B1F3A',
          800: '#10294A',
          700: '#143560',
        },
        isro: {
          blue:    '#1677D2',
          sky:     '#55B8FF',
          saffron: '#FF9933',
          text:    '#B8C7D9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(22,119,210,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,119,210,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'panel': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(22,119,210,0.12)',
        'panel-hover': '0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(22,119,210,0.25)',
        'btn': '0 2px 8px rgba(22,119,210,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
