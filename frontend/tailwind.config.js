/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e1a',
          surface: '#0f172a',
          card: '#1a1a2e',
          border: '#1e293b',
          neon: {
            cyan: '#00f0ff',
            magenta: '#ff00ff',
            purple: '#8b5cf6',
            blue: '#3b82f6',
            green: '#22c55e',
            red: '#ef4444',
            orange: '#f59e0b',
          },
          glow: {
            cyan: '0 0 10px rgba(0,240,255,0.5), 0 0 20px rgba(0,240,255,0.2)',
            magenta: '0 0 10px rgba(255,0,255,0.5), 0 0 20px rgba(255,0,255,0.2)',
            purple: '0 0 10px rgba(139,92,246,0.5), 0 0 20px rgba(139,92,246,0.2)',
            blue: '0 0 10px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.2)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,240,255,0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(0,240,255,0.8)' },
        },
      },
    },
  },
  plugins: [],
}
