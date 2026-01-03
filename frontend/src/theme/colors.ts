/**
 * Vilo Brand Colors
 * Single source of truth for all colors in the application.
 * Use Tailwind classes (preferred) or import from here for JS logic.
 */

export const colors = {
  // Brand primary (Emerald)
  primary: {
    DEFAULT: '#34D399', // emerald-400
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

  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Dark mode surface colors
  dark: {
    bg: '#101011',
    sidebar: '#1a1a1b',
    card: '#1f1f20',
    cardHover: '#2a2a2b',
    border: '#2e2e30',
  },

  // Semantic colors
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',
} as const;

// Light mode color mappings
export const lightModeColors = {
  background: colors.brand.white,
  surface: colors.gray[50],
  surfaceHover: colors.gray[100],
  card: colors.brand.white,
  cardHover: colors.gray[50],
  border: colors.gray[200],
  textPrimary: colors.gray[900],
  textSecondary: colors.gray[500],
  textMuted: colors.gray[400],
} as const;

// Dark mode color mappings
export const darkModeColors = {
  background: colors.dark.bg,
  surface: colors.dark.sidebar,
  surfaceHover: colors.dark.card,
  card: colors.dark.card,
  cardHover: colors.dark.cardHover,
  border: colors.dark.border,
  textPrimary: colors.brand.white,
  textSecondary: colors.gray[400],
  textMuted: colors.gray[500],
} as const;

export type ColorKey = keyof typeof colors;
