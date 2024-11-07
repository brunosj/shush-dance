/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    colors: {
      pri: {
        DEFAULT: '#FEFEF6',
      },
      sec: {
        DEFAULT: '#97AAFF',
      },
      ter: {
        DEFAULT: '#8BBF9F',
      },
      black: {
        DEFAULT: '#000000',
      },
      gray: {
        DEFAULT: '#b3b3b3',
      },
      darkGray: {
        DEFAULT: '#666666',
      },
      white: {
        DEFAULT: '#FFFFFF',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        marquee: 'marquee 120s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
