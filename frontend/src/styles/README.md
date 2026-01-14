# Custom Scrollbar Styles

This directory contains reusable CSS utilities for consistent scrollbar styling across the application.

## Usage

### Vertical Scrollbar

Add the `styled-scrollbar` class to any element with `overflow-y-auto`:

```tsx
<div className="overflow-y-auto styled-scrollbar max-h-64">
  {/* Your scrollable content */}
</div>
```

### Horizontal Scrollbar

Add the `styled-scrollbar-horizontal` class to any element with `overflow-x-auto`:

```tsx
<div className="overflow-x-auto styled-scrollbar-horizontal">
  {/* Your scrollable content */}
</div>
```

## Features

- ✅ Consistent design across light and dark modes
- ✅ Smooth, rounded scrollbar track and thumb
- ✅ Hover effects for better interactivity
- ✅ Thin, unobtrusive design
- ✅ Matches the design system

## Browser Support

- ✅ Chrome/Edge (Webkit)
- ✅ Firefox (scrollbar-width)
- ✅ Safari (Webkit)

## Examples

### Filter Sidebar
```tsx
<div className="space-y-2 max-h-64 overflow-y-auto styled-scrollbar">
  {categories.map(category => (
    <FilterItem key={category} />
  ))}
</div>
```

### Data Table
```tsx
<div className="overflow-x-auto styled-scrollbar-horizontal">
  <table>
    {/* table content */}
  </table>
</div>
```

## Customization

To modify the scrollbar appearance globally, edit `/frontend/src/styles/scrollbar.css`.
