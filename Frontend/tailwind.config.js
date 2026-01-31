/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F766E',
        'primary-600': '#0F766E',
        accent: '#2563EB',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        divider: '#E2E8F0'
      },
      boxShadow: {
        'card-md': '0 12px 30px -12px rgba(15,23,42,0.12)'
      },
      borderRadius: {
        'xl-2': '1rem'
      }
    },
  },
  plugins: [],
}
