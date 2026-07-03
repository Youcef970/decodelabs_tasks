/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0E14',
          900: '#10141C',
          800: '#161B26',
          700: '#1E2430',
          600: '#2A3140',
          500: '#3A4254',
        },
        paper: {
          100: '#E8EAED',
          200: '#C7CCD6',
          300: '#9AA1B0',
          400: '#6B7280',
        },
        signal: {
          DEFAULT: '#FFB627',
          dim: '#8A6A1E',
        },
        safe: {
          DEFAULT: '#3FB950',
          dim: '#1A4D2E',
          bg: '#0F1B14',
        },
        suspicious: {
          DEFAULT: '#FFB627',
          dim: '#5C4513',
          bg: '#1C1709',
        },
        danger: {
          DEFAULT: '#E5484D',
          dim: '#5C1E20',
          bg: '#1F1011',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'edge': '0 1px 0 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
