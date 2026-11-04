/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3F5BF6',
          strong: '#2A3FB8',
          soft: '#D6DBFD',
        },
        complete: {
          bg: '#EEF0FF',
          icon: '#6F7FF0',
        },
        pending: {
          bg: '#FDE6E6',
          icon: '#E04B4B',
        },
        ink: {
          DEFAULT: '#1F2430',
          muted: '#8A90A0',
          faint: '#C4C8D2',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
