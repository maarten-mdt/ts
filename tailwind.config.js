/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#c2410c',
          light: '#ea580c',
          dark: '#9a3412',
        },
        surface: {
          DEFAULT: '#0f0f0f',
          elevated: '#1a1a1a',
          muted: '#262626',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '72rem',
      },
    },
  },
  plugins: [],
}
