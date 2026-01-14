# Icon Component Library

A comprehensive, reusable collection of SVG icon components for the Vilo application.

## Overview

This icon library provides 50+ professionally designed icons with:
- **Consistent sizing** (xs, sm, md, lg, xl)
- **Dark mode support** (inherits text color)
- **TypeScript typed** interfaces
- **Customizable** stroke width and styling
- **Organized** by category for easy discovery

## Usage

### Basic Usage

```tsx
import { CalendarIcon, CheckIcon, UserIcon } from '@/components/ui';

function MyComponent() {
  return (
    <div>
      <CalendarIcon />
      <CheckIcon />
      <UserIcon />
    </div>
  );
}
```

### With Size Props

```tsx
import { StarIcon, BellIcon } from '@/components/ui';

function MyComponent() {
  return (
    <div>
      <StarIcon size="xs" />  {/* 12px */}
      <StarIcon size="sm" />  {/* 16px */}
      <StarIcon size="md" />  {/* 20px - default */}
      <StarIcon size="lg" />  {/* 24px */}
      <StarIcon size="xl" />  {/* 32px */}
    </div>
  );
}
```

### With Custom Styling

```tsx
import { CheckCircleIcon } from '@/components/ui';

function MyComponent() {
  return (
    <div>
      {/* Custom color */}
      <CheckCircleIcon className="text-green-500" />

      {/* Custom stroke width */}
      <CheckCircleIcon strokeWidth={3} />

      {/* Combined */}
      <CheckCircleIcon
        size="lg"
        className="text-primary hover:text-primary-dark"
        strokeWidth={2.5}
      />
    </div>
  );
}
```

## Available Icons

### Header Action Icons
Perfect for page headers and action bars.

- `EyeOpenIcon` - Show/view content
- `EyeClosedIcon` - Hide content
- `FilterIcon` - Filter controls
- `AnalyticsIcon` - Charts and analytics
- `DollarIcon` - Payment and financial
- `PlusIcon` - Add/create actions

**Example:**
```tsx
<div className="flex items-center gap-3">
  <button onClick={toggleFilters}>
    <FilterIcon />
  </button>
  <button onClick={viewAnalytics}>
    <AnalyticsIcon />
  </button>
  <Button variant="primary">
    <PlusIcon size="sm" />
    Create New
  </Button>
</div>
```

### Booking & Calendar Icons
For dates, scheduling, and booking workflows.

- `CalendarIcon` - Dates and scheduling
- `CheckInIcon` - Check-in actions
- `CheckOutIcon` - Check-out actions
- `BookingIcon` - Reservations

**Example:**
```tsx
<div className="flex items-center gap-2">
  <CalendarIcon size="sm" />
  <span>{formatDate(booking.check_in_date)}</span>
</div>
```

### Alert & Status Icons
For notifications, confirmations, and status indicators.

- `AlertIcon` - Warnings and alerts
- `InfoIcon` - Informational messages
- `CheckIcon` - Success/completion
- `CheckCircleIcon` - Confirmed status
- `CloseIcon` - Close/dismiss actions

**Example:**
```tsx
{status === 'success' && (
  <div className="flex items-center gap-2 text-green-600">
    <CheckCircleIcon />
    <span>Booking confirmed</span>
  </div>
)}
```

### Navigation Icons
For menus, navigation, and directional actions.

- `SearchIcon` - Search functionality
- `MenuIcon` - Hamburger menu
- `ChevronLeftIcon` - Previous/back
- `ChevronRightIcon` - Next/forward
- `ChevronDownIcon` - Expand/dropdown
- `ChevronUpIcon` - Collapse
- `ArrowRightIcon` - Navigate forward
- `ArrowLeftIcon` - Navigate back

**Example:**
```tsx
<button onClick={goBack}>
  <ArrowLeftIcon />
  Back
</button>

<button onClick={goNext}>
  Next
  <ArrowRightIcon />
</button>
```

### Common Action Icons
Frequently used action icons.

- `EditIcon` - Edit content
- `DeleteIcon` - Delete/remove
- `SettingsIcon` - Settings and configuration
- `DownloadIcon` - Download files
- `UploadIcon` - Upload files

**Example:**
```tsx
<div className="flex gap-2">
  <button onClick={handleEdit}>
    <EditIcon size="sm" />
  </button>
  <button onClick={handleDelete} className="text-red-600">
    <DeleteIcon size="sm" />
  </button>
</div>
```

### Property & Room Icons
For properties, accommodations, and users.

- `HomeIcon` - Properties/homes
- `BuildingIcon` - Hotels/buildings
- `UserIcon` - Single user
- `UsersIcon` - Groups/teams

**Example:**
```tsx
<Card>
  <div className="flex items-center gap-3">
    <BuildingIcon size="lg" className="text-primary" />
    <div>
      <h3>{property.name}</h3>
      <p>{property.location}</p>
    </div>
  </div>
</Card>
```

### Business & Finance Icons
For payments, ratings, and analytics.

- `StarIcon` - Ratings and favorites
- `CreditCardIcon` - Payment methods
- `ChartBarIcon` - Statistics and analytics

**Example:**
```tsx
<div className="flex items-center gap-1">
  {[...Array(5)].map((_, i) => (
    <StarIcon
      key={i}
      size="sm"
      className={i < rating ? 'text-yellow-500' : 'text-gray-300'}
    />
  ))}
</div>
```

### Document & Security Icons
For files, documents, and security features.

- `DocumentIcon` - Files
- `DocumentTextIcon` - Text documents
- `ShieldIcon` - Security/protection
- `ShieldCheckIcon` - Verified/protected

**Example:**
```tsx
<div className="flex items-center gap-2">
  <ShieldCheckIcon className="text-green-600" />
  <span>Verified Property</span>
</div>
```

### Notification & Action Icons
For notifications and media controls.

- `BellIcon` - Notifications
- `LightningBoltIcon` - Premium/fast features
- `PlayIcon` - Video/media playback

**Example:**
```tsx
<button className="relative">
  <BellIcon />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {unreadCount}
    </span>
  )}
</button>
```

## Icon Props Interface

All icons accept the same props:

```typescript
interface IconProps {
  /**
   * Size of the icon
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Custom className for additional styling
   */
  className?: string;

  /**
   * Stroke width for outline icons
   * @default 2
   */
  strokeWidth?: number;
}
```

## Size Mapping

| Size | Tailwind Class | Pixels |
|------|---------------|--------|
| `xs` | `w-3 h-3`     | 12px   |
| `sm` | `w-4 h-4`     | 16px   |
| `md` | `w-5 h-5`     | 20px   |
| `lg` | `w-6 h-6`     | 24px   |
| `xl` | `w-8 h-8`     | 32px   |

## Best Practices

### 1. Use Appropriate Sizes

```tsx
// ✅ Good - Icon size matches text size
<button className="text-sm">
  <CheckIcon size="sm" /> Confirm
</button>

// ❌ Bad - Icon too large for text
<button className="text-sm">
  <CheckIcon size="xl" /> Confirm
</button>
```

### 2. Use Semantic Colors

```tsx
// ✅ Good - Colors convey meaning
<CheckCircleIcon className="text-green-600" />
<AlertIcon className="text-yellow-600" />
<DeleteIcon className="text-red-600" />

// ❌ Bad - Inconsistent color usage
<CheckCircleIcon className="text-pink-400" />
```

### 3. Match Icon to Action

```tsx
// ✅ Good - Icon matches action
<button onClick={handleDelete}>
  <DeleteIcon /> Delete
</button>

// ❌ Bad - Icon doesn't match action
<button onClick={handleDelete}>
  <CheckIcon /> Delete
</button>
```

### 4. Provide Accessibility

```tsx
// ✅ Good - Accessible button with label
<button aria-label="Close modal" onClick={handleClose}>
  <CloseIcon />
  <span className="sr-only">Close</span>
</button>

// ✅ Good - Icon with visible text
<button onClick={handleSave}>
  <CheckIcon /> Save
</button>
```

## Dark Mode Support

All icons automatically support dark mode by inheriting the current text color:

```tsx
// Light mode: gray-600, Dark mode: gray-400 (automatic)
<div className="text-gray-600 dark:text-gray-400">
  <UserIcon />
</div>
```

## Migration Guide

### Before (Inline SVG)

```tsx
const MyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

function MyComponent() {
  return <MyIcon />;
}
```

### After (Centralized Icon)

```tsx
import { CheckIcon } from '@/components/ui';

function MyComponent() {
  return <CheckIcon />;
}
```

## Refactored Pages

The following pages have been updated to use centralized icons:

1. **BookingManagementPage** - All 6 inline icons refactored
2. **NotificationsPage** - BellIcon refactored
3. **BillingTab** - 5 inline icons refactored (CreditCardIcon, CheckCircleIcon, CalendarIcon, ChartBarIcon, DocumentTextIcon)

## Adding New Icons

To add a new icon to the library:

1. Add the icon component to `Icons.tsx`:

```tsx
/**
 * MyNewIcon - Description of what it's used for
 */
export const MyNewIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="[SVG_PATH_HERE]"
    />
  </svg>
);
```

2. Export it in `index.ts`:

```typescript
export { MyNewIcon } from './Icons';
```

3. Add it to the barrel export in `components/ui/index.ts`:

```typescript
export {
  // ... other icons
  MyNewIcon,
} from './Icons';
```

## TypeScript Support

Full TypeScript support with type checking:

```tsx
import { CalendarIcon } from '@/components/ui';
import type { IconProps } from '@/components/ui';

// Type-safe icon wrapper
const CustomIcon: React.FC<IconProps> = (props) => {
  return <CalendarIcon {...props} />;
};
```

## Performance

- **Tree-shakeable**: Only import icons you use
- **No duplication**: Shared icon definitions across the app
- **Lightweight**: Pure SVG, no icon font overhead
- **Cacheable**: Icons are part of your bundle, cached by the browser

## Support

For questions or issues with the icon library, please check:
- This README for usage examples
- `Icons.tsx` for available icons
- `Icons.types.ts` for TypeScript interfaces
