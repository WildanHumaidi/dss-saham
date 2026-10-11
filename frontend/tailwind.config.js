/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sidebar dark green
        sidebar: {
          bg: '#0d2818',
          hover: '#132f1e',
          active: '#ffffff',
          border: '#163321',
          text: '#7ab898',
          textHover: '#b8d9c8',
          textActive: '#0d2818',
        },
        // Brand green (emerald)
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,.06), 0 2px 4px -2px rgba(0,0,0,.04)',
      },
    },
  },
  plugins: [],
};
