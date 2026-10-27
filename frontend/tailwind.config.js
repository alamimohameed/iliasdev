/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f6f4ef',
        ink: '#1d1b18',
        line: '#e4e0d7',
        urgent: { DEFAULT: '#f76b15', soft: '#fff1e6', ink: '#a8430a' },
        mandatory: { DEFAULT: '#e5484d', soft: '#fdeeee', ink: '#9b1c1f' },
        optional: { DEFAULT: '#3b82f6', soft: '#eaf1fe', ink: '#1e4fae' },
        fixed: { DEFAULT: '#8b5cf6', soft: '#f2edfe', ink: '#5b2fb8' },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        shimmer: 'shimmer 2.4s linear infinite',
        'bounce-in': 'bounce-in 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
