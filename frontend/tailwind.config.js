/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Green colors for landing page
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Primary accent - Orange (Twenty style)
        primary: {
          50: '#fef3f0',
          100: '#fde2db',
          200: '#fcc5b7',
          300: '#f9a088',
          400: '#f57452',
          500: '#f14e1e',
          600: '#e23a0c',
          700: '#bc2d0a',
          800: '#992710',
          900: '#7e2412',
          950: '#440f06',
        },
        // Accent colors
        'accent-primary': '#f14e1e',
        'accent-secondary': '#0086ff',
        'accent-hover': '#e23a0c',

        // Status colors
        success: '#00ac30',
        warning: '#faad14',
        error: '#f5222d',
        info: '#0086ff',

        // Theme-aware colors using CSS variables
        background: {
          DEFAULT: 'var(--bg-primary)',
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
        },
        surface: 'var(--surface)',
        border: {
          DEFAULT: 'var(--border)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },

        // Dark mode specific
        dark: {
          bg: '#1d1d1d',
          'bg-secondary': '#141414',
          'bg-elevated': '#252525',
          surface: '#2d2d2d',
          border: '#333333',
          'text-primary': '#f1f1f1',
          'text-secondary': '#8a8a8a',
          'text-muted': '#5c5c5c',
        },

        // Light mode specific
        light: {
          bg: '#f1f1f1',
          'bg-secondary': '#ffffff',
          'bg-elevated': '#fafafa',
          surface: '#ffffff',
          border: '#e5e5e5',
          'text-primary': '#141414',
          'text-secondary': '#6b6b6b',
          'text-muted': '#9a9a9a',
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'dark-card': '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        'sidebar-collapsed': '64px',
        'sidebar-expanded': '240px',
      },
      transitionDuration: {
        '200': '200ms',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Don't reset styles to avoid conflicts with MUI
  },
}
