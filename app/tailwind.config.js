/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#F6F1E8',
        paper: '#FFFBF5',
        ink: '#1C1915',
        forest: '#2F5D50',
        clay: '#C45C26',
        muted: '#6B6459',
        line: '#E4D9C8',
        danger: '#A33B2B',
      },
    },
  },
  plugins: [],
};
