/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          850: '#0c1527',
          900: '#080e1a',
          950: '#04070d'
        }
      }
    },
  },
  plugins: [],
}
