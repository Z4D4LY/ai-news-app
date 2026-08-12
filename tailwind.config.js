/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#f97316',
        'accent-hover': '#ea580c',
        bg: '#0a0a0a',
        'bg-card': '#111111',
        'bg-hover': '#1a1a1a',
        border: '#222222',
        'text-primary': '#e5e5e5',
        'text-dim': '#888888',
      },
    },
  },
  plugins: [],
};