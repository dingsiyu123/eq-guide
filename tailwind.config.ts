import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './views/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F2ECDC',
        ink: '#2B2B2B',
        cinnabar: '#9A2A2A',
        border: '#5C5C5C',
        stone: {
          DEFAULT: '#8C8C8C',
          '100': '#F5F5F5',
          '200': '#E7E5E4',
          '300': '#D6D3D1',
          '400': '#A8A29E',
          '500': '#78716C',
          '600': '#57534E',
          '900': '#1C1917'
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'SimSun', 'STSong', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
      boxShadow: {
        'book': '5px 5px 15px rgba(0,0,0,0.1), inset 0 0 30px rgba(242, 236, 220, 0.8)',
        'seal': '2px 2px 0px #7A1A1A',
      },
    },
  },
  plugins: [],
};

export default config;