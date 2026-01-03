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
        // Brand primary (Emerald)
        primary: {
          DEFAULT: '#10B981', // emerald-400
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Brand neutrals
        brand: {
          black: '#101011',
          white: '#FFFFFF',
        },
        // Dark mode surface colors
        dark: {
          bg: '#101011',
          sidebar: '#1a1a1b',
          card: '#1f1f20',
          'card-hover': '#2a2a2b',
          border: '#2e2e30',
        },
        // Semantic colors (with light/dark variants)
        success: {
          light: '#D1FAE5',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        warning: {
          light: '#FEF3C7',
          DEFAULT: '#D97706',
          dark: '#B45309',
        },
        error: {
          light: '#FEE2E2',
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
        info: {
          light: '#DBEAFE',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        // Avatar colors (17 colors for variety)
        avatar: {
          red: '#EF4444',
          orange: '#F97316',
          amber: '#F59E0B',
          yellow: '#EAB308',
          lime: '#84CC16',
          green: '#22C55E',
          emerald: '#10B981',
          teal: '#14B8A6',
          cyan: '#06B6D4',
          sky: '#0EA5E9',
          blue: '#3B82F6',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          purple: '#A855F7',
          fuchsia: '#D946EF',
          pink: '#EC4899',
          rose: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Custom font sizes (smaller for enterprise SaaS)
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],    // 10px
        'xs': ['0.6875rem', { lineHeight: '1rem' }],        // 11px
        'sm': ['0.75rem', { lineHeight: '1.125rem' }],      // 12px - main body
        'base': ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px
        'md': ['0.875rem', { lineHeight: '1.25rem' }],      // 14px
        'lg': ['1rem', { lineHeight: '1.5rem' }],           // 16px
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],      // 20px
        '3xl': ['1.5rem', { lineHeight: '2rem' }],          // 24px
      },
      // Flatter shadows for modern look
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
      },
      // Smaller border radius
      borderRadius: {
        'sm': '0.25rem',    // 4px
        'DEFAULT': '0.375rem', // 6px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
      },
    },
  },
  plugins: [],
}
