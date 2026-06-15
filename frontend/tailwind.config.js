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
        'sans': ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['var(--font-display)', 'Georgia', 'serif'],
        // Legacy heading utility used across the app — remapped from Georgia to the
        // brand sans (Manrope) so in-app headings stay cohesive with the rebrand.
        // The Unbounded display face is reserved for `font-display` (wordmark, landing, AI block).
        'serif': ['var(--font-sans)', 'Georgia', 'serif'],
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.9' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        twinkle: 'twinkle 3.5s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
