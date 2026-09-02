/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gta6: ['"Barlow Condensed"', 'Antonio', 'Oswald', 'sans-serif'],
        antonio: ['Antonio', '"Barlow Condensed"', 'sans-serif'],
        oswald: ['Oswald', '"Barlow Condensed"', 'sans-serif'],
      },
      colors: {
        'gta-pink': '#FF2A85',
        'gta-cyan': '#00E5FF',
        'gta-orange': '#FF8A00',
        'gta-yellow': '#FFD600',
        'gta-purple': '#A855F7',
        'gta-dark': '#0B0D13',
      },
    },
  },
  plugins: [],
}
