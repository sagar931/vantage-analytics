/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We will define our premium color palette here later
        'premium-dark': '#0f172a',
        'premium-card': '#1e293b',
      }
    },
  },
  plugins: [],
}