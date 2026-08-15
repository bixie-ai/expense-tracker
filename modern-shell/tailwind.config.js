/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6750A4',
          container: '#EADDFF',
        },
        secondary: {
          DEFAULT: '#625B71',
          container: '#E8DEF8',
        },
        tertiary: {
          DEFAULT: '#7D5260',
          container: '#FFD8E4',
        },
        error: {
          DEFAULT: '#B3261E',
          container: '#F9DEDC',
        },
        surface: {
          DEFAULT: '#FFFBFE',
          variant: '#E7E0EC',
        },
        background: '#FFFBFE',
        outline: '#79747E',
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        md: '12px',
      },
    },
  },
  plugins: [],
};
