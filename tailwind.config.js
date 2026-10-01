/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#12131A',
        paper: '#F6F5F1',
        indigo: {
          DEFAULT: '#3730A9',
          deep: '#211D63',
          soft: '#E7E4FA',
        },
        signal: '#B6FF3B',
        amber: '#F2A93B',
        coral: '#E8543F',
        line: '#DEDACD',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '14px',
      },
    },
  },
  plugins: [],
};
