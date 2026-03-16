/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          red: '#fc3c44',
          'red-dark': '#e0353c',
          bg: '#000000',
          surface: '#1c1c1e',
          surface2: '#2c2c2e',
          surface3: '#3a3a3c',
          text: '#ffffff',
          'text-secondary': 'rgba(235,235,245,0.6)',
          'text-tertiary': 'rgba(235,235,245,0.3)',
          border: '#38383a',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'slide-up': 'slideUp 0.32s cubic-bezier(0.32,0.72,0,1)',
        'fade-in': 'fadeIn 0.18s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
