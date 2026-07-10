/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12233b',      // deep civic navy - primary
        ink2: '#1c3457',
        parchment: '#f6f3ec', // warm neutral background
        brass: '#b98a3d',     // signature accent - "seal" gold
        brass2: '#8f6a2c',
        slate: '#5a6b7d',
        good: '#2f6b4f',
        warn: '#a8501b',
        crit: '#9e2b25',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
      },
    },
  },
  plugins: [],
};
