# Developer Onboarding - Modern Luxe Template V2.0

## Welcome! 👋

This guide helps new developers understand the Modern Luxe template codebase, make their first contribution, and follow our coding standards.

**Estimated Onboarding Time:** 2-4 hours
**Prerequisites:** TypeScript, React, Tailwind CSS knowledge

---

## 📚 Table of Contents

1. [Project Architecture](#project-architecture)
2. [Setup & Installation](#setup--installation)
3. [Code Structure](#code-structure)
4. [Design System](#design-system)
5. [Component Guidelines](#component-guidelines)
6. [Coding Standards](#coding-standards)
7. [Common Patterns](#common-patterns)
8. [Testing](#testing)
9. [Debugging](#debugging)
10. [First Contribution](#first-contribution)

---

## 🏗️ Project Architecture

### Tech Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- Vite for build tooling

**Backend:**
- Express.js with TypeScript
- Supabase for database
- RESTful API architecture

**Key Concepts:**
- Component-based architecture
- Design system for consistency
- CSS custom properties for theming
- Mobile-first responsive design
- WCAG AA accessibility

---

## 🚀 Setup & Installation

### 1. Clone Repository

```bash
git clone [repository-url]
cd ViloNew
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Environment Setup

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

**Backend** (`backend/.env`):
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 4. Start Development Servers

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Backend
cd backend
npm run dev
# Runs on http://localhost:3000
```

### 5. Access Template Website

```
http://[subdomain].localhost:5173
```

Example: `http://beach-resort.localhost:5173`

---

## 📁 Code Structure

### Frontend Structure

```
frontend/src/
├── components/
│   ├── ui/                          # Base UI components
│   │   ├── Button/
│   │   │   ├── index.ts            # Barrel export
│   │   │   ├── Button.tsx          # Component
│   │   │   └── Button.types.ts     # Types
│   │   ├── Input/
│   │   └── Modal/
│   │
│   ├── layout/                      # Layout components
│   │   ├── Header/
│   │   ├── Footer/
│   │   └── Sidebar/
│   │
│   ├── features/                    # Feature components
│   │   ├── Booking/
│   │   └── Chat/
│   │
│   └── public-website/              # ⭐ Template components
│       ├── design-system.ts         # ⭐ IMPORTANT: Design system
│       ├── WebsiteLayout.tsx        # Layout wrapper
│       ├── WebsiteSEO.tsx           # SEO component
│       └── sections/                # ⭐ Reusable sections
│           ├── BookingWidget.tsx
│           ├── RoomGallery.tsx
│           ├── RoomAmenities.tsx
│           └── index.ts             # Barrel export
│
├── pages/
│   ├── public-website/              # ⭐ Template pages
│   │   ├── PublicWebsiteHome.tsx
│   │   ├── PublicWebsiteRoom.tsx
│   │   ├── PublicWebsiteBlog.tsx
│   │   ├── PublicWebsiteContact.tsx
│   │   ├── PublicBookingCheckout.tsx
│   │   └── index.ts
│   │
│   └── [other pages]/
│
├── services/                        # API services
│   ├── api.service.ts              # Base API client
│   └── website-public.service.ts   # ⭐ Template API calls
│
├── types/                           # TypeScript types
│   └── property-website.types.ts   # ⭐ Template types
│
├── hooks/                           # Custom React hooks
├── context/                         # React context
├── utils/                           # Utility functions
└── App.tsx                          # Root component
```

### Backend Structure

```
backend/src/
├── controllers/
│   └── property-website.controller.ts  # Template endpoints
│
├── services/
│   └── property-website.service.ts     # Business logic
│
├── routes/
│   └── property-website.routes.ts      # Route definitions
│
├── types/
│   └── property-website.types.ts       # Backend types
│
├── middleware/
│   └── [auth, validation, etc.]
│
└── app.ts                               # Express app
```

---

## 🎨 Design System

### Core Concept

**All template components MUST use the design system.**

Location: `frontend/src/components/public-website/design-system.ts`

### Design System Structure

```typescript
export const designSystem = {
  typography: { /* ... */ },
  spacing: { /* ... */ },
  radius: { /* ... */ },
  shadows: { /* ... */ },
  colors: { /* ... */ },
  backgrounds: { /* ... */ },
  borders: { /* ... */ },
  transitions: { /* ... */ },
  hover: { /* ... */ },
  focus: { /* ... */ },
  accessibility: { /* ... */ },
  grids: { /* ... */ },
  decorative: { /* ... */ },
  icons: { /* ... */ },
};

export const cn = (...classes) => { /* ... */ };
```

### Usage Example

```typescript
import { designSystem as ds, cn } from '@/components/public-website/design-system';

// Typography
<h1 className={cn(ds.typography.pageTitle, ds.colors.heading)}>
  Title
</h1>

// Spacing
<section className={cn(ds.spacing.sectionY, ds.spacing.sectionX)}>
  Content
</section>

// Card
<div className={cn(
  ds.backgrounds.card,
  ds.radius.card,
  ds.shadows.card,
  ds.shadows.cardHover,
  ds.transitions.default
)}>
  Card content
</div>

// Button with theme color
<button
  className={cn(
    'px-6 py-3 text-white font-semibold',
    ds.radius.button,
    ds.transitions.default,
    ds.focus.default,
    'hover:opacity-90'
  )}
  style={{ backgroundColor: primaryColor }}
>
  Click Me
</button>
```

### Why Use Design System?

✅ **Consistency** - All pages look cohesive
✅ **Maintainability** - Change once, update everywhere
✅ **Dark Mode** - Built-in support
✅ **Accessibility** - WCAG AA compliant utilities
✅ **Speed** - Pre-defined classes

---

## 🧩 Component Guidelines

### Component Structure Template

```typescript
/**
 * ComponentName.types.ts
 */
export interface ComponentNameProps {
  // Required props
  title: string;
  content: string;

  // Optional props
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;

  // Callbacks
  onClick?: () => void;
  onSubmit?: (data: FormData) => void;
}
```

```typescript
/**
 * ComponentName.tsx
 */
import React from 'react';
import { designSystem as ds, cn } from '@/components/public-website/design-system';
import { ComponentNameProps } from './ComponentName.types';

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  content,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
}) => {
  // Hooks at top
  const [state, setState] = React.useState(false);

  // Event handlers
  const handleClick = () => {
    if (onClick) onClick();
  };

  // Render
  return (
    <div className={cn(
      ds.backgrounds.card,
      ds.radius.card,
      className
    )}>
      <h3 className={cn(ds.typography.cardTitle, ds.colors.heading)}>
        {title}
      </h3>
      <p className={ds.colors.body}>
        {content}
      </p>
      <button
        onClick={handleClick}
        className={cn(
          ds.radius.button,
          ds.transitions.default,
          ds.focus.default
        )}
      >
        Click Me
      </button>
    </div>
  );
};
```

```typescript
/**
 * index.ts
 */
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';
```

### Component Checklist

- [ ] TypeScript types defined in separate `.types.ts` file
- [ ] Props interface exported
- [ ] Default values for optional props
- [ ] Design system classes used (not hardcoded)
- [ ] Dark mode support (via design system)
- [ ] Accessibility attributes (ARIA labels, roles)
- [ ] Responsive design (mobile-first)
- [ ] Barrel export in `index.ts`
- [ ] JSDoc comments for complex logic

---

## 📝 Coding Standards

### TypeScript

**✅ DO:**
```typescript
// Use interface for props
export interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

// Export types alongside components
export type { ButtonProps };

// Use proper typing
const handleSubmit = (data: FormData): void => {
  // ...
};
```

**❌ DON'T:**
```typescript
// Don't use any
const data: any = fetchData();

// Don't skip type definitions
function handleClick(e) {  // Missing type
  // ...
}

// Don't use inline types for props
const Component = ({ title }: { title: string }) => {
  // Should use interface
};
```

### React

**✅ DO:**
```typescript
// Use functional components
export const Component: React.FC<Props> = ({ prop }) => {
  // ...
};

// Use hooks at top of component
const [state, setState] = useState(false);
const { data } = useContext(SomeContext);

// Destructure props
const Component: React.FC<Props> = ({
  title,
  content,
  variant = 'default',
}) => {
  // ...
};
```

**❌ DON'T:**
```typescript
// Don't use class components (unless legacy)
class Component extends React.Component {
  // Not our pattern
}

// Don't call hooks conditionally
if (condition) {
  const [state] = useState(false);  // ❌
}

// Don't use index as key
{items.map((item, index) => (
  <div key={index}>{item}</div>  // ❌
))}
```

### Styling

**✅ DO:**
```typescript
// Use design system
import { designSystem as ds, cn } from '@/components/public-website/design-system';

<div className={cn(
  ds.backgrounds.card,
  ds.radius.card,
  ds.spacing.cardPadding
)}>
  Content
</div>

// Use theme colors via inline styles
<button style={{ backgroundColor: primaryColor }}>
  Click
</button>
```

**❌ DON'T:**
```typescript
// Don't hardcode colors
<div className="bg-[#047857]">  // ❌

// Don't hardcode spacing
<div className="py-12 px-6">  // ❌ Use ds.spacing

// Don't skip dark mode
<div className="text-gray-900">  // ❌ Use ds.colors.heading
```

### Accessibility

**✅ DO:**
```typescript
// Add ARIA labels to icon buttons
<button aria-label="Close modal">
  <X className={ds.icons.sizeDefault} />
</button>

// Use semantic HTML
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>

// Add alt text to images
<img src={image} alt="Ocean view suite with king bed" />

// Use proper heading hierarchy
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Card Title</h3>
```

**❌ DON'T:**
```typescript
// Don't skip alt text
<img src={image} />  // ❌

// Don't use divs for buttons
<div onClick={handleClick}>Click</div>  // ❌ Use <button>

// Don't skip heading hierarchy
<h1>Title</h1>
<h3>Skip h2</h3>  // ❌
```

---

## 🔄 Common Patterns

### Page Component Pattern

```typescript
import React, { useState, useEffect } from 'react';
import { WebsiteLayout } from '@/components/public-website/WebsiteLayout';
import { WebsiteSEO } from '@/components/public-website/WebsiteSEO';
import { getWebsiteBySubdomain, extractSubdomain } from '@/services/website-public.service';
import { PropertyWebsite, WebsitePage } from '@/types/property-website.types';
import { designSystem as ds, cn } from '@/components/public-website/design-system';

export const PublicWebsiteExamplePage: React.FC = () => {
  const [website, setWebsite] = useState<PropertyWebsite | null>(null);
  const [property, setProperty] = useState<any>(null);
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWebsite();
  }, []);

  const loadWebsite = async () => {
    const subdomain = extractSubdomain(window.location.hostname);

    if (!subdomain) {
      setError('Invalid website URL');
      setIsLoading(false);
      return;
    }

    try {
      const data = await getWebsiteBySubdomain(subdomain);
      setWebsite(data.website);
      setProperty(data.property);
      setPages(data.pages);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Website not found');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--website-primary, #047857)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error || !website || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className={cn(ds.typography.sectionTitle, ds.colors.heading)}>
            Not Found
          </h1>
          <p className={ds.colors.body}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WebsiteSEO
        title={`Example Page - ${property.name}`}
        description="Example page description"
        url={window.location.href}
        type="website"
      />
      <WebsiteLayout website={website} propertyName={property.name} pages={pages}>
        <section className={cn(ds.spacing.containerMax, ds.spacing.sectionX, ds.spacing.sectionY)}>
          <h1 className={cn(ds.typography.pageTitle, ds.colors.heading)}>
            Page Title
          </h1>
          <p className={ds.colors.body}>
            Page content
          </p>
        </section>
      </WebsiteLayout>
    </>
  );
};
```

### API Call Pattern

```typescript
// services/website-public.service.ts

import { apiClient } from './api.service';
import { PropertyWebsite, PublicRoom } from '@/types/property-website.types';

export const getWebsiteBySubdomain = async (subdomain: string) => {
  const response = await apiClient.get(`/api/public/websites/${subdomain}`);
  return response.data;
};

export const getRoomBySlug = async (subdomain: string, slug: string): Promise<PublicRoom> => {
  const response = await apiClient.get(`/api/public/websites/${subdomain}/rooms/${slug}`);
  return response.data;
};
```

### Form Handling Pattern

```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
});
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));

  // Clear error for this field
  if (errors[name]) {
    setErrors(prev => ({ ...prev, [name]: '' }));
  }
};

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
    newErrors.name = 'Name is required';
  }

  if (!formData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Invalid email address';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsSubmitting(true);
  try {
    await submitForm(formData);
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 🧪 Testing

### Manual Testing Checklist

When making changes to a component, test:

- [ ] Desktop (1280px+)
- [ ] Tablet (768px, 1024px)
- [ ] Mobile (320px, 375px, 414px)
- [ ] Dark mode
- [ ] Keyboard navigation
- [ ] Screen reader (if possible)
- [ ] Different browsers (Chrome, Firefox, Safari)

### Testing Routes

```bash
# Test public website
http://test-property.localhost:5173/

# Test specific pages
http://test-property.localhost:5173/accommodation
http://test-property.localhost:5173/accommodation/ocean-suite
http://test-property.localhost:5173/blog
http://test-property.localhost:5173/contact
http://test-property.localhost:5173/reserve
```

### Browser DevTools Tips

**Check Responsive:**
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select different devices
4. Check layout at each size

**Check Accessibility:**
1. Open DevTools
2. Go to Lighthouse tab
3. Run accessibility audit
4. Fix issues with score < 90

**Check Dark Mode:**
```javascript
// In console, toggle dark mode
document.documentElement.classList.toggle('dark');
```

---

## 🐛 Debugging

### Common Issues

**Issue: Component not rendering**
```typescript
// Check:
1. Is component exported correctly?
2. Is import path correct?
3. Are props types matching?
4. Check browser console for errors
```

**Issue: Styles not applying**
```typescript
// Check:
1. Is design system imported?
2. Is cn() function used?
3. Are Tailwind classes spelled correctly?
4. Is dark mode prefix needed?
5. Clear browser cache (Ctrl+F5)
```

**Issue: API call failing**
```typescript
// Check:
1. Is backend running?
2. Is URL correct?
3. Check Network tab in DevTools
4. Check backend console for errors
5. Verify authentication if needed
```

### Debugging Tools

**React DevTools:**
- Install Chrome extension
- Inspect component props and state
- Check component hierarchy

**Console Logs:**
```typescript
// Temporary debugging (remove before commit)
console.log('State:', state);
console.log('Props:', props);
```

**Network Tab:**
- Check API calls
- Verify request/response
- Check status codes

---

## 🎯 First Contribution

### Easy First Tasks

**1. Add a New Amenity Icon** (30 mins)
- File: `frontend/src/components/public-website/sections/RoomAmenities.tsx`
- Add new icon mapping in `getAmenityIcon()`
- Import icon from `lucide-react`
- Test with a room that has that amenity

**2. Add a New Color to Design System** (15 mins)
- File: `frontend/src/components/public-website/design-system.ts`
- Add color to `colors` object
- Use in a component
- Test in both light and dark mode

**3. Fix a Typo** (5 mins)
- Find a typo in documentation or UI text
- Make the correction
- Test that it displays correctly

**4. Improve Documentation** (30 mins)
- Add missing JSDoc comments
- Clarify confusing documentation
- Add examples to existing docs

### Contribution Workflow

1. **Create Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
- Follow coding standards
- Use design system
- Add comments

3. **Test Changes**
- Manual testing
- Check responsive
- Check dark mode
- Check accessibility

4. **Commit**
```bash
git add .
git commit -m "feat: Add amenity icon for pool

- Added Waves icon from lucide-react
- Updated getAmenityIcon mapping
- Tested with sample property"
```

5. **Push & Create PR**
```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting (no code change)
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

**Example:**
```
feat: Add interactive room gallery

- Implemented lightbox with keyboard navigation
- Added swipe gestures for mobile
- Includes Lucide icons for controls
- Tested on iOS and Android

Closes #123
```

---

## 📚 Additional Resources

### Documentation
- `PROPERTY_WEBSITE_GUIDE.md` - User guide
- `WEBSITE_TEMPLATE_FEATURES.md` - Feature showcase
- `QUICK_REFERENCE.md` - Quick reference
- `PUBLIC_WEBSITE_TESTING_CHECKLIST.md` - Testing

### External Resources
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Team Communication
- Slack: #dev-template-team
- Email: dev@vilo.com
- Standup: Daily at 10am

---

## ✅ Onboarding Checklist

Complete these tasks to finish onboarding:

### Setup
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Frontend running locally
- [ ] Backend running locally
- [ ] Test property website accessible

### Knowledge
- [ ] Read this entire document
- [ ] Reviewed design system file
- [ ] Explored code structure
- [ ] Read coding standards
- [ ] Reviewed common patterns

### Hands-On
- [ ] Made a test component
- [ ] Used design system classes
- [ ] Tested responsive design
- [ ] Tested dark mode
- [ ] Ran accessibility audit

### First Contribution
- [ ] Found first task
- [ ] Created feature branch
- [ ] Made changes
- [ ] Tested changes
- [ ] Created pull request

---

## 🎓 Next Steps

After onboarding:

1. **Pick a Task**
   - Check issue tracker
   - Ask team for recommendations
   - Start with "good first issue" label

2. **Deep Dive**
   - Focus on one area (e.g., booking flow)
   - Read all related code
   - Understand data flow

3. **Contribute**
   - Make meaningful contributions
   - Review others' code
   - Share knowledge

4. **Level Up**
   - Propose new features
   - Improve architecture
   - Mentor new developers

---

## 🆘 Getting Help

### Quick Questions
- Slack: #dev-questions
- Response time: < 1 hour

### Code Review
- Create PR and tag reviewers
- Response time: < 24 hours

### Complex Issues
- Schedule pair programming session
- Book office hours with lead dev

### Emergency
- Contact on-call developer
- Email: urgent-dev@vilo.com

---

**Welcome to the team! 🎉**

We're excited to have you contributing to the Modern Luxe template. If you have any questions or need help, don't hesitate to reach out!

---

**© 2026 Vilo. All rights reserved.**

**Version:** 2.0 Developer Onboarding
**Last Updated:** January 18, 2026
