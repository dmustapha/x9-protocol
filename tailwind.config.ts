import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#00ff88',
        danger: '#ff4444',
      },
    },
  },
  plugins: [],
};

export default config;
