/**
 * Design System Tokens
 *
 * Centralized design tokens for consistent styling across the application.
 * These values should be used as the single source of truth for all design decisions.
 */

export const designTokens = {
  // ============================================
  // COLORS
  // ============================================
  colors: {
    // Brand Primary (Emerald)
    primary: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399', // DEFAULT
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
      DEFAULT: '#34D399',
    },

    // Brand Neutrals
    brand: {
      black: '#101011',
      white: '#FFFFFF',
    },

    // Gray Scale
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

    // Dark Mode Surfaces
    dark: {
      bg: '#101011',
      sidebar: '#1a1a1b',
      card: '#1f1f20',
      cardHover: '#2a2a2b',
      border: '#2e2e30',
    },

    // Semantic Colors
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

    // Avatar Colors (17 colors for variety)
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

  // ============================================
  // SPACING
  // ============================================
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
    },
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
      '4xl': ['1.875rem', { lineHeight: '2.25rem' }],     // 30px
      '5xl': ['2.25rem', { lineHeight: '2.5rem' }],       // 36px
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },

  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // ============================================
  // BORDER RADIUS
  // ============================================
  borderRadius: {
    none: '0',
    sm: '0.25rem',     // 4px
    DEFAULT: '0.375rem', // 6px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',
  },

  // ============================================
  // BREAKPOINTS
  // ============================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    auto: 'auto',
  },

  // ============================================
  // TRANSITIONS
  // ============================================
  transitions: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    timing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// Type exports for TypeScript support
export type DesignTokens = typeof designTokens;
export type ColorScale = typeof designTokens.colors.primary;
export type SpacingScale = typeof designTokens.spacing;
export type TypographyScale = typeof designTokens.typography;
