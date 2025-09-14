/** @type {import('tailwindcss').Config} */
module.exports = {
  // Your darkMode setting is correct
  darkMode: 'class', 
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeInDown: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  // --- MERGED CHANGE ---
  // Added the official Tailwind forms plugin to handle dark mode in form inputs.
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // This ensures it respects your dark mode setting
    }),
  ],
}