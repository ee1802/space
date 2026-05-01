/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'apeks': {
          'bg': '#070C18',
          'surface': '#0D1525',
          'surface-hover': '#152035',
          'border': '#1E2D4A',
          'border-hover': '#253558',
          'text': '#F0EDE8',
          'text-secondary': '#A8A5A0',
          'text-muted': '#6A6860',
          'gold': '#D9A441',
          'gold-hover': '#F4B860',
          'cyan': '#4ECDD4',
          'cyan-hover': '#6EE8EE',
          'green': '#5BD68A',
          'purple': '#8B6DD4',
          'red': '#FF7B6D',
          'orange': '#FFB547',
        }
      },
      fontFamily: {
        'serif': ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
