/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-azure-blue',
    'bg-vibrant-yellow',
    'bg-soft-sand',
    'text-azure-blue',
    'text-vibrant-yellow',
    'bg-azure-blue/5',
    'bg-azure-blue/10',
    'bg-azure-blue/20',
    'bg-vibrant-yellow/5',
    'bg-vibrant-yellow/10',
    'bg-vibrant-yellow/20',
    'from-azure-blue',
    'to-azure-blue',
    'from-vibrant-yellow',
    'to-vibrant-yellow',
    'from-azure-blue/5',
    'to-azure-blue/5',
    'from-vibrant-yellow/5',
    'to-vibrant-yellow/5',
    'from-azure-blue/20',
    'to-azure-blue/5',
    'from-vibrant-yellow/20',
    'to-vibrant-yellow/5',
    'border-azure-blue',
    'border-azure-blue/30',
    'group-hover:text-azure-blue',
    'group-hover:text-vibrant-yellow',
  ],
  theme: {
    extend: {
      colors: {
        'azure-blue': '#0057B7',
        'vibrant-yellow': '#FFD700',
        'soft-sand': '#F5F5F7',
      },
      borderRadius: {
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
