# Design System Rules

## Core Principle

**Every UI element must inherit its design from the design system.** When we change something in the design system, it should automatically update across the entire application.

---

## Rules

### 1. Always Use Design System Components

Never use raw HTML elements when a design system component exists.

| Instead of... | Use... |
|---------------|--------|
| `<button>` | `Button` from `@/components/ui` |
| `<input>` | `Input` from `@/components/ui` |
| `<select>` | `Select` from `@/components/ui` |
| `<textarea>` | `Textarea` from `@/components/ui` |
| `<input type="checkbox">` | `Checkbox` from `@/components/ui` |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` | `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeader`, `TableCell` from `@/components/ui` |
| Raw modal/dialog | `Modal` from `@/components/ui` |
| Raw badge/tag | `Badge` or `StatusBadge` from `@/components/ui` |

### 2. If No Component Exists, Create One First

Before adding UI elements to a page, check if a component exists:
1. Look in `frontend/src/components/ui/`
2. Check `frontend/src/components/ui/index.ts` for exports

If no component exists for your use case:
1. **DO NOT** add raw HTML to the page
2. **CREATE** a new component in `frontend/src/components/ui/`
3. **EXPORT** it from `frontend/src/components/ui/index.ts`
4. **THEN** use it in your page

### 3. All Styles Must Use Design Tokens

Never hardcode colors, spacing, or typography.

```tsx
// BAD - Hardcoded values
<div className="bg-[#10B981] p-[20px] text-[14px]">

// GOOD - Design tokens via Tailwind config
<div className="bg-primary p-5 text-sm">
```

**Color tokens:**
- Use `primary`, `success`, `warning`, `error`, `info` for semantic colors
- Use `gray-*` scale for neutral colors
- Use `dark:` prefix for dark mode variants

### 4. Component Structure Standard

All new components must follow this structure:

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.types.ts  # TypeScript interfaces (optional if simple)
└── index.ts               # Barrel export
```

### 5. Props Interface Pattern

```tsx
// ComponentName.types.ts
export interface ComponentNameProps {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}
```

### 6. Dark Mode Support

All components must support dark mode using the `dark:` prefix:

```tsx
<div className="bg-white dark:bg-dark-card text-gray-900 dark:text-white">
```

---

## Available Components

Import from `@/components/ui`:

**Form Controls:**
- `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Radio`, `RadioGroup`
- `DateRangePicker`, `MultiSelect`, `SearchInput`, `FormField`

**Layout:**
- `Card` (with `Card.Header`, `Card.Body`, `Card.Footer`)
- `Modal` (with `Modal.Header`, `Modal.Body`, `Modal.Footer`)
- `PageHeader`, `FilterBar`, `BulkActionBar`

**Data Display:**
- `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeader`, `TableCell`, `TableFooter`
- `Badge`, `StatusBadge`, `Avatar`, `StatCard`
- `Progress`, `CircularProgress`, `ProgressBar`

**Navigation:**
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Breadcrumbs`, `Pagination`, `Dropdown`

**Feedback:**
- `Alert`, `Spinner`, `Tooltip`, `ConfirmDialog`, `SaveStatus`
- `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable`
- `EmptyState`, `EmptyStateNoData`, `EmptyStateNoResults`, `EmptyStateError`

**Branding:**
- `Logo`, `LogoIcon`, `ThemeToggle`

---

## Checklist Before Submitting Code

- [ ] No raw `<button>` elements (use `Button`)
- [ ] No raw `<input>` elements (use `Input`, `Checkbox`, `Switch`)
- [ ] No raw `<select>` elements (use `Select`)
- [ ] No raw `<table>` structures (use `Table` components)
- [ ] No hardcoded colors (use design tokens)
- [ ] Dark mode tested
- [ ] Component exists in design system (or was created first)

---

## Adding New Components

1. Create folder in `frontend/src/components/ui/ComponentName/`
2. Create `ComponentName.tsx` with the component
3. Create `index.ts` with barrel export
4. Add export to `frontend/src/components/ui/index.ts`
5. Document props in the design system showcase (optional)

---

## Questions?

Check the design system showcase at `/design-system` (admin only) for visual examples of all available components.
