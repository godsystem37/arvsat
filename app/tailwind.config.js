/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: 'var(--color-cream)',
        paper: 'var(--color-paper)',
        ink: 'var(--color-ink)',
        forest: 'var(--color-forest)',
        clay: 'var(--color-clay)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        danger: 'var(--color-danger)',
        'forest-soft': 'var(--color-forest-soft)',
        'clay-soft': 'var(--color-clay-soft)',
        'danger-soft': 'var(--color-danger-soft)',
        'cream-soft': 'var(--color-cream-soft)',
      },
    },
  },
  plugins: [],
};
