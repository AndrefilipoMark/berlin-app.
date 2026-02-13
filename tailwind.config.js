/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-primary',
    'bg-accent',
    'text-primary',
    'text-accent',
    'bg-primary/5',
    'bg-primary/10',
    'bg-primary/20',
    'bg-accent/5',
    'bg-accent/10',
    'bg-accent/20',
    'from-primary',
    'to-primary',
    'from-accent',
    'to-accent',
    'border-primary',
    'border-accent',
    'group-hover:text-primary',
    'group-hover:text-accent',
    // Keeping old classes for safety during migration
    'bg-azure-blue',
    'bg-vibrant-yellow',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0057B7',
        accent: '#fbbf24',
        'azure-blue': '#0057B7', // Alias for backward compatibility
        'vibrant-yellow': '#fbbf24', // Alias for backward compatibility (updated to new accent)
        'soft-sand': '#f8fafc', // Updated background
      },
      borderRadius: {
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
