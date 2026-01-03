# Decisions Log

## Why Express
- Full control
- Webhooks
- Admin tooling

## Why Supabase
- Fast setup
- Auth + DB in one
- Multi-tenant friendly

## One Feature at a Time
- Prevent half-built systems
- Faster MVP validation

## Brand Style & Colors (CRITICAL - NON-NEGOTIABLE)

### Core Brand Palette
| Name | Value | Usage |
|------|-------|-------|
| Primary (Emerald) | `#34D399` | CTAs, links, active states, brand accents |
| Black | `#101011` | Dark mode background, dark text |
| White | `#FFFFFF` | Light mode background, light text |
| Gray-50 | `#F9FAFB` | Light mode page backgrounds |
| Gray-100 | `#F3F4F6` | Light mode card backgrounds |
| Gray-200 | `#E5E7EB` | Dividers, disabled states |
| Gray-500 | `#6B7280` | Secondary text |
| Gray-700 | `#374151` | Dark mode borders |
| Gray-800 | `#1F2937` | Dark mode cards |
| Gray-900 | `#111827` | Primary text (light mode) |

### Dark Mode Surface Colors
| Name | Value | Usage |
|------|-------|-------|
| bg-page | `#101011` | Main dark background |
| bg-sidebar | `#1a1a1b` | Sidebar background |
| bg-card | `#1f1f20` | Card/panel background |
| bg-card-hover | `#2a2a2b` | Card hover state |
| border | `#2e2e30` | Dark mode borders |

### Semantic Colors (Status)
| Name | Value | Usage |
|------|-------|-------|
| Success | `#059669` | Confirmations, completed states |
| Warning | `#D97706` | Alerts, pending states |
| Error | `#DC2626` | Errors, destructive actions |
| Info | `#2563EB` | Information, links |

### Theme File Structure
```
frontend/src/theme/
  colors.ts       # All color definitions
  index.ts        # Main exports
frontend/src/context/
  ThemeContext.tsx  # Dark/light mode logic
```

### Dark/Light Mode Support
- **System Preference**: Auto-detect OS setting
- **Manual Override**: User can toggle between light/dark/system
- **Persistence**: Store preference in localStorage
- **Implementation**: Tailwind `darkMode: 'class'` strategy

### Tailwind Config Integration
All brand colors MUST be defined in `tailwind.config.js`:
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
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
        brand: {
          black: '#101011',
          white: '#FFFFFF',
        },
        dark: {
          bg: '#101011',
          sidebar: '#1a1a1b',
          card: '#1f1f20',
          'card-hover': '#2a2a2b',
          border: '#2e2e30',
        },
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB',
      },
    },
  },
}
```

### Usage Rules (MANDATORY)
1. **Tailwind classes first** - Use `bg-primary`, `text-gray-900`, etc.
2. **Theme imports for JS** - When logic requires colors
3. **NEVER hardcode hex values** in components
4. **NEVER use arbitrary values** like `bg-[#047857]`

### Quick Color Reference
```tsx
// Backgrounds
bg-white          // Main content
bg-gray-50        // Page background
bg-gray-100       // Cards, panels
bg-primary        // CTA buttons
bg-black          // Dark sections

// Text
text-gray-900     // Primary text
text-gray-500     // Secondary text
text-white        // On dark backgrounds
text-primary      // Links, accents

// Borders
border-gray-200   // Default borders
border-primary    // Active/focused states
```

## Component-Based Development (IMPORTANT)
- **Create reusable components** that fit the brand/theme design
- Components should be self-contained with clear TypeScript interfaces
- Use TypeScript interfaces for all component props (export as `ComponentNameProps`)
- Place shared components in `frontend/src/components/`
- Follow controlled component pattern (value + onChange)
- Support common variants via props (size, mode, variant)
- Components must comply with brand colors (black #101011, white #FFFFFF, primary emerald #34D399)

### Component Structure
```
frontend/src/components/
  ComponentName/
    index.ts          # Barrel export
    types.ts          # TypeScript interfaces
    ComponentName.tsx # Main component
```

### Component Guidelines
1. **Props Interface**: Always define and export a props interface
2. **Default Values**: Use sensible defaults for optional props
3. **Controlled Pattern**: Use `value` + `onChange` for form components
4. **Accessibility**: Include proper ARIA labels and keyboard support
5. **Responsive**: Design mobile-first, support all screen sizes
6. **Themeable**: Use CSS variables and brand colors

### Existing Reusable Components
- `Button` - Primary, secondary, outline variants
- `Card` - Dashboard metric cards
- `Toast` - Notifications with type variants
- `ConfirmModal` - Confirmation dialogs
- `StarRating` - Interactive rating component
- `GuestSelector` - Adults/children selection for bookings
