import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './admin/**/*.{js,ts,jsx,tsx,mdx}',
    './customer/**/*.{js,ts,jsx,tsx,mdx}',
    './driver/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Kasi Orange - Primary brand color
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6b35', // Kasi Orange - warm, bold, township-inspired
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Kasi Blue - Secondary/accent color
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#00b4d8', // Kasi Blue - bright, energetic, modern
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Deep Black
        'kasi-black': '#000000',
        'kasi-orange': '#ff6b35',
        'kasi-blue': '#00b4d8',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Montserrat', 'sans-serif'],
        display: ['Poppins', 'Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
