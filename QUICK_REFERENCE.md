# Modern Luxe Template - Quick Reference Card

**Version 2.0** | Last Updated: January 2026

---

## 🎯 Key Features at a Glance

| Feature | What It Does | Where to Find It |
|---------|-------------|------------------|
| **Interactive Gallery** | Lightbox with keyboard nav | Room detail pages |
| **Booking Widget** | Live pricing calculator | Right sidebar on room pages |
| **Categorized Amenities** | 9 organized groups | Room detail pages |
| **Branded Checkout** | 4-step booking flow | `/reserve` route |
| **Contact Hero** | Full-width form overlay | Contact page |
| **Featured Blog Post** | Large hero card | Blog archive page |
| **Read Time** | Auto-calculated | All blog posts |
| **Dark Mode** | Automatic detection | All pages |

---

## 📐 Design System

### Spacing

```typescript
Section Y:    py-16 md:py-20 lg:py-28
Section X:    px-4 sm:px-6 lg:px-8
Container:    max-w-7xl mx-auto
Card Padding: p-6 lg:p-8
```

### Typography

```typescript
Page Title:    text-4xl md:text-5xl font-bold
Section Title: text-3xl md:text-4xl lg:text-5xl font-bold
Card Title:    text-xl md:text-2xl font-semibold
Body:          text-base
```

### Colors

```typescript
Heading:  text-gray-900 dark:text-dark-text
Body:     text-gray-600 dark:text-dark-text-secondary
Muted:    text-gray-500 dark:text-dark-text-secondary
```

### Radius & Shadows

```typescript
Card:   rounded-lg shadow-sm hover:shadow-lg
Button: rounded-md shadow-sm
Input:  rounded-md
Badge:  rounded-full
```

---

## 🔧 Component Usage

### Design System Import

```typescript
import { designSystem as ds, cn } from '@/components/public-website/design-system';

// Usage
<h1 className={cn(ds.typography.pageTitle, ds.colors.heading)}>
  Title
</h1>

<div className={cn(ds.spacing.sectionY, ds.spacing.sectionX)}>
  Content
</div>

<div className={cn(ds.backgrounds.card, ds.radius.card, ds.shadows.card)}>
  Card
</div>
```

### Icons (Lucide)

```typescript
import { Wifi, Tv, Coffee, Users } from 'lucide-react';

<Wifi className={cn(ds.icons.sizeDefault, ds.icons.colorPrimary)} />
<Users className={ds.icons.sizeMedium} />
```

---

## 🎨 Theme Colors

### CSS Custom Properties

```css
--website-primary: #047857        /* Your primary color */
--website-primary-rgb: 4, 120, 87 /* RGB for opacity */
```

### Usage in Components

```typescript
// Inline styles
style={{
  backgroundColor: 'var(--website-primary, #047857)',
  color: primaryColor
}}

// With opacity
style={{
  backgroundColor: `rgba(var(--website-primary-rgb, 4, 120, 87), 0.1)`
}}
```

---

## 📱 Responsive Breakpoints

| Device | Width | Grid Columns |
|--------|-------|--------------|
| Mobile Small | 320px | 1 |
| Mobile | 375px | 1 |
| Mobile Large | 414px | 1 |
| Tablet | 768px | 2 |
| Tablet Large | 1024px | 3 |
| Desktop | 1280px+ | 3 |

### Responsive Grids

```typescript
ds.grids.cols2  // grid md:grid-cols-2
ds.grids.cols3  // grid md:grid-cols-2 lg:grid-cols-3
ds.grids.cols4  // grid md:grid-cols-2 lg:grid-cols-4
```

---

## ♿ Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Touch targets minimum 44×44px
- [ ] Images have descriptive alt text
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast ratio 4.5:1 minimum
- [ ] Forms have associated labels
- [ ] Dark mode maintains contrast

### Focus States

```typescript
ds.focus.default  // Standard focus ring
ds.focus.input    // Input focus (no offset)
ds.focus.visible  // Focus-visible for better UX
```

---

## 🗂️ File Structure

```
frontend/src/
├── components/
│   └── public-website/
│       ├── design-system.ts          ← Import this!
│       ├── WebsiteLayout.tsx
│       ├── WebsiteSEO.tsx
│       └── sections/
│           ├── BookingWidget.tsx     ← Advanced booking
│           ├── RoomGallery.tsx       ← Lightbox gallery
│           ├── RoomAmenities.tsx     ← 9 categories
│           └── index.ts
│
└── pages/
    └── public-website/
        ├── PublicWebsiteHome.tsx
        ├── PublicWebsiteRoom.tsx     ← Enhanced!
        ├── PublicWebsiteBlog.tsx     ← Featured post
        ├── PublicWebsiteContact.tsx  ← Hero form
        └── PublicBookingCheckout.tsx ← Branded checkout
```

---

## 🎯 Common Patterns

### Page Layout

```typescript
<WebsiteLayout website={website} propertyName={property.name} pages={pages}>
  <section className={cn(ds.spacing.containerMax, ds.spacing.sectionX, ds.spacing.sectionY)}>
    <h1 className={cn(ds.typography.pageTitle, ds.colors.heading)}>
      Page Title
    </h1>
    <p className={cn(ds.colors.body)}>
      Content
    </p>
  </section>
</WebsiteLayout>
```

### Card Component

```typescript
<div className={cn(
  ds.backgrounds.card,
  ds.radius.card,
  ds.shadows.card,
  ds.shadows.cardHover,
  ds.transitions.default,
  'group'
)}>
  <h3 className={cn(ds.typography.cardTitle, ds.colors.heading)}>
    Card Title
  </h3>
  <p className={ds.colors.body}>
    Card content
  </p>
</div>
```

### Button with Theme Color

```typescript
<button
  className={cn(
    'px-6 py-3 text-white font-semibold',
    ds.radius.button,
    ds.transitions.default,
    ds.focus.default,
    ds.accessibility.touchTarget,
    'hover:opacity-90'
  )}
  style={{ backgroundColor: primaryColor }}
>
  Click Me
</button>
```

### Link with Theme Color

```typescript
<Link
  to="/page"
  className={cn(
    'font-medium hover:underline',
    ds.transitions.default,
    ds.focus.visible
  )}
  style={{ color: primaryColor }}
>
  Link Text
</Link>
```

---

## 🔍 SEO Optimization

### Page Meta Tags

```typescript
<WebsiteSEO
  title={`${page.title} - ${property.name}`}
  description={page.meta_description}
  imageUrl={page.featured_image_url}
  url={window.location.href}
  type="website"
  schema={schemaObject}
/>
```

### Schema Generation

```typescript
import { generateHotelSchema, generateProductSchema, generateArticleSchema } from '@/components/public-website/WebsiteSEO';

// Hotel (home page)
const schema = generateHotelSchema({
  name: property.name,
  description: property.description,
  url: window.location.href,
  telephone: property.phone,
  email: property.email,
  address: { /* ... */ }
});

// Room (product)
const schema = generateProductSchema({
  name: room.name,
  description: room.description,
  image: room.images,
  brand: property.name,
  offers: { price: room.price, priceCurrency: 'USD' }
});

// Blog post (article)
const schema = generateArticleSchema({
  headline: post.title,
  description: post.excerpt,
  image: post.featured_image_url,
  datePublished: post.published_at,
  author: { name: post.author.name }
});
```

---

## 🛠️ Testing Commands

### Run Tests

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev

# Access website
http://your-subdomain.localhost:5173
```

### Testing Checklist Location

```
PUBLIC_WEBSITE_TESTING_CHECKLIST.md
```

---

## 📊 Performance Tips

### Image Optimization

```typescript
// Lazy loading
<img loading="lazy" src={image} alt={description} />

// Aspect ratio (prevents layout shift)
<div className="aspect-[16/10]">
  <img className="w-full h-full object-cover" />
</div>
```

### Efficient Rendering

```typescript
// Conditional rendering
{items.length > 0 && (
  <RoomList rooms={items} />
)}

// Memoization (when needed)
const memoizedValue = useMemo(() =>
  expensiveCalculation(data),
  [data]
);
```

---

## 🚨 Common Issues & Fixes

### Theme Color Not Applying

**Problem:** Primary color not showing
**Fix:** Ensure CSS custom property is set
```typescript
// In component
const primaryColor = website.theme_config.primaryColor || '#047857';

// Set CSS variable
useEffect(() => {
  document.documentElement.style.setProperty('--website-primary', primaryColor);
  const rgb = hexToRgb(primaryColor);
  document.documentElement.style.setProperty('--website-primary-rgb', rgb);
}, [primaryColor]);
```

### Dark Mode Not Working

**Problem:** Colors not adapting
**Fix:** Use design system color classes
```typescript
// ❌ Wrong
className="text-gray-900"

// ✅ Correct
className={ds.colors.heading}
// or
className="text-gray-900 dark:text-dark-text"
```

### Icons Not Showing

**Problem:** Icons missing
**Fix:** Import from Lucide
```typescript
// ❌ Wrong
<svg>...</svg>

// ✅ Correct
import { IconName } from 'lucide-react';
<IconName className={ds.icons.sizeDefault} />
```

### Spacing Inconsistent

**Problem:** Margins/padding don't match
**Fix:** Use design system spacing
```typescript
// ❌ Wrong
className="py-12 px-6"

// ✅ Correct
className={cn(ds.spacing.sectionY, ds.spacing.sectionX)}
```

---

## 📞 Support

**Documentation:**
- `PROPERTY_WEBSITE_GUIDE.md` - User guide
- `WEBSITE_TEMPLATE_FEATURES.md` - Feature showcase
- `PUBLIC_WEBSITE_TESTING_CHECKLIST.md` - Testing

**Contact:**
- Email: support@vilo.com
- Include: Screenshots, error messages, expected vs actual behavior

---

## ✅ Pre-Launch Checklist

- [ ] All pages use design system classes
- [ ] Theme colors applied throughout
- [ ] Dark mode tested
- [ ] Mobile responsive (320px - 1920px)
- [ ] Accessibility tested (keyboard nav, screen reader)
- [ ] Images optimized (< 500KB each)
- [ ] SEO meta tags configured
- [ ] Contact form tested
- [ ] Booking flow tested end-to-end
- [ ] Blog posts published
- [ ] Social links configured
- [ ] Logo and favicon uploaded
- [ ] Browser testing (Chrome, Firefox, Safari)

---

**© 2026 Vilo. All rights reserved.**

**Version 2.0** | Modern Luxe Template | Property Website System
