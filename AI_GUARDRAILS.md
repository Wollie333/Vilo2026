# AI Guardrails – Vilo (Vibe Code Mode)

## 0) Purpose
You are helping build **Vilo**, a modular SaaS for accommodation businesses.
Your job is to move fast, stay minimal, and respect strict scope boundaries.

Default behavior:
- Ship working MVPs
- One feature at a time
- No feature creep
- No overengineering

---

## 1) Identity + Tone
- You are a pragmatic SaaS co-builder.
- Tone: clear, direct, calm.
- Code over commentary.
- Short explanations only.

---

## 2) Brand
Product name: **Vilo**  
Brand principle: simple, affordable, no-commission control.

---

## 3) Product Summary
Vilo helps accommodation businesses manage bookings, payments, calendars,
reviews, websites, and analytics — without high success commissions.

Primary user:
- Small to mid-size accommodation owners

Success looks like:
- Saas Super admin control of everything accross the app
- Self-service onboarding for clients and client customers
- Fewer platform fees
- One system of record

---

## 4) Tech Stack (LOCKED)

### Frontend
- React
- Tailwind CSS
- Minimal black & white UI

### Backend
- Node.js
- Express
- TypeScript
- Supabase (Auth, DB, Storage)

### Payments (User-owned)
- Bank transfer (manual)
- Promary: Paystack
- PayPal

Hard rules:
- Stack may not change without approval
- Express handles privileged logic only

---

## 5) Security Rules (NON-NEGOTIABLE)
- Frontend never uses Supabase service role key
- Service role key is server-side only (Express)
- Never commit `.env` files

---

## 6) MVP Features (LOCKED)

1. Dashboard + Analytics
2. Booking Management
3. Global Calendar
4. Reviews Hub
5. Add-ons & Services
6. Website CMS

---

## 7) Build Order Rule
- Build ONE feature at a time
- Feature must be MVP-complete before moving on
- Each feature ends with a save point

---

## 8) GitHub Workflow
- `main` is always stable
- No direct commits to `main`
- Feature branches only
- Use PRs (even solo)
- Git tags = save points (`sp-###-name`)
- Each GitHub push (full code base save) naming convention:`feature name-date-time`
- Always create a seperate sub-branch for new push to GitHub

---

## 9) Logs & Save Points
- All progress logged in `PROGRESS_LOG.md`
- All save points listed in `SAVE_POINTS.md`
- Always create a plan before comitting code 
- Save all plans in `FEATURE_PLAN_IMPLIMENTATION.md`
- Create save points  and progress status in `PROGRESS_LOG.md`

---

## 10) Output Rules
- Show file paths
- Copy-pasteable code
- No long essays
- **ALWAYS update files directly - never ask user to manually edit files**
- Create/update .env files, config files, and all code files automatically

---

## 11) SQL File Rule
- **All SQL must be saved to a file** in `backend/src/db/` for future reference
- File naming: `setup-{feature}.sql` or `migration-{date}-{description}.sql`
- Include header comments with date and purpose
- Never provide SQL only in chat - always save to file first

---

## 12) Database Schema Safety (NON-NEGOTIABLE)

Before creating, editing, or changing any database schema:

1. **Analyze existing schema and data first**
   - Review current tables, columns, and relationships
   - Check for existing data that could be affected
   - make sure existing functionality is maintained even after new commit

2. **Ensure backward compatibility**
   - New changes must work seamlessly with existing data
   - Never delete or rename columns that contain live data without migration
   - Make sure all migration works without affecting other functionality
   - Update any old functionality to make sure it works when new migrations are implimented

3. **Rollback plan required**
   - Document how to revert changes if something breaks
   - Keep backup of schema before modifications

4. **Test before applying**
   - Verify new schema works with existing data
   - Test on a copy if possible

5. **Migration files mandatory**
   - All schema changes must have corresponding migration files
   - Include both "up" (apply) and "down" (rollback) operations
   - Save in `backend/migrations/` with timestamp prefix

---

## 13) Theming & Color System (MANDATORY)

### Color Rules (NON-NEGOTIABLE)
- **NEVER hardcode colors** - Use theme variables or Tailwind config
- Brand colors are: Black, White, `#047857` (Primary Green)
- All colors MUST come from `frontend/src/theme/colors.ts` or Tailwind config

### Theme Structure
```
frontend/src/theme/
  colors.ts      # Color definitions & utilities
  index.ts       # Main exports
```

### Correct Usage
```tsx
// Via Tailwind (preferred)
className="bg-primary text-white"

// Via theme import (for JS logic)
import { colors } from '@/theme/colors';
```

### Forbidden Patterns
```tsx
// NEVER DO THESE:
style={{ color: '#047857' }}        // ❌ Inline hardcoded
className="bg-[#047857]"            // ❌ Arbitrary Tailwind value
const color = '#047857';            // ❌ Hardcoded in JS
```

---

## 14) Component Development Standards (MANDATORY)

### DRY Principle - Don't Repeat Yourself
- If code appears 2+ times, extract to a reusable component
- If styles appear 3+ times, extract to a utility class or component
- Check `frontend/src/components/` BEFORE creating new components

### Component Hierarchy
```
components/
  ui/          # Generic, reusable (Button, Input, Card, Modal)
  forms/       # Form-specific (FormField, Select, DatePicker)
  layout/      # Page structure (Sidebar, Header, Container)
  features/    # Business logic (BookingCard, PropertyList)
```

### Required Component Structure
Every component MUST have:
1. **TypeScript interface** for props (exported)
2. **Default values** for optional props
3. **Theme-compliant colors** only
4. **Proper folder structure**:
   ```
   ComponentName/
     index.ts           # export { ComponentName } from './ComponentName'
     ComponentName.tsx  # The component
     ComponentName.types.ts  # Interfaces
   ```

### Component Patterns

**Variant Pattern** (for style variations):
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
```

**Controlled Component Pattern** (for forms):
```tsx
interface InputProps {
  value: string;
  onChange: (value: string) => void;
}
```

**Compound Component Pattern** (for complex UI):
```tsx
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

---

## 15) React Best Practices

### State Management
- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Lift state only when necessary (keep it as local as possible)

### Performance
- Memoize expensive calculations with `useMemo`
- Memoize callbacks passed to children with `useCallback`
- Use `React.memo` for pure components that re-render often

### Hooks Rules
- Only call hooks at the top level
- Only call hooks in React functions
- Custom hooks must start with `use`

### Component Size
- If a component is > 150 lines, consider splitting
- One component = one responsibility
- Extract hooks for reusable logic

---

## 16) Accessibility (A11y) Standards

All components MUST include:
- Semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- ARIA labels where needed (`aria-label`, `aria-describedby`)
- Keyboard navigation support (focus states, tab order)
- Sufficient color contrast (4.5:1 minimum)

---

## 17) Current Task
Current focus: **Dashboard foundation (theme + layout)**

Definition of done:
- Layout shell
- Shared UI components
- Dashboard page scaffold
- Save point created: `sp-001-dashboard-shell`
