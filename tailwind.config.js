/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'command': {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          text: '#e0e0e0',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
}
