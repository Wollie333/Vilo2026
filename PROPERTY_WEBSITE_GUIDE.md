# Property Website System - Complete Guide

## Overview

The Vilo property website system allows you to create beautiful, professional websites for your vacation rental properties using the **Modern Luxe** template. Your website automatically displays your rooms, accepts contact form submissions, and is fully customizable with your brand colors and content.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Testing Your Website](#testing-your-website)
3. [Activating Your Website](#activating-your-website)
4. [Customizing Your Brand](#customizing-your-brand)
5. [Editing Page Content](#editing-page-content)
6. [Managing Rooms](#managing-rooms)
7. [Room Detail Pages](#room-detail-pages)
8. [Booking Flow](#booking-flow)
9. [Social Media Integration](#social-media-integration)
10. [Blog Management](#blog-management)
11. [Contact Page Features](#contact-page-features)
12. [SEO Best Practices](#seo-best-practices)
13. [Accessibility Features](#accessibility-features)
14. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What You Get

When you activate the Modern Luxe template, you automatically get:

- **Home Page** - Hero section with parallax scrolling, features, room preview, testimonials
- **About Page** - Your story with location map
- **Contact Page** - Full-width hero with glassmorphism overlay contact form
- **Accommodation Page** - Automatic room listings from your room management
- **Individual Room Pages** - Detailed room pages with:
  - Interactive image gallery with lightbox
  - Advanced booking widget with live pricing
  - Categorized amenities (9 categories)
  - Bed configuration display
  - Optional add-ons preview
- **Blog** - Featured post layout with read time calculation
- **Booking Checkout** - Template-branded checkout with your colors and logo

### Accessing Website Management

1. Navigate to your property: **Manage → Properties → [Your Property]**
2. Click the **Website** tab in the sidebar
3. You'll see the website management interface

---

## Testing Your Website

### Development/Testing Environment

When testing locally or in development, your website will be accessible at:

```
your-subdomain.localhost:5173
```

For example:
- `beach-resort.localhost:5173`
- `mountain-lodge.localhost:5173`
- `city-hotel.localhost:5173`

**How it works:**
- Modern browsers automatically resolve `*.localhost` to your local machine
- No hosts file editing needed
- Works on Chrome, Firefox, Safari, and Edge

### Production Environment

When deployed to production, your website will be at:

```
your-subdomain.yourdomain.com
```

For example:
- `beach-resort.vilo.com`
- `mountain-lodge.vilo.com`

**The same code and subdomain detection works for both environments!**

### Quick Test

1. Activate your website (see next section)
2. Note your subdomain (e.g., "beach-resort")
3. Access: `http://beach-resort.localhost:5173`
4. You should see your property website with the Modern Luxe template

**Note:** Always include the port (`:5173`) when testing locally.

**For detailed testing instructions, see:** `TESTING_PROPERTY_WEBSITES.md`

---

## Activating Your Website

### Step 1: Choose a Template

1. Go to **Website → Templates**
2. Select **Modern Luxe (Hotel)**
3. Review the template preview
4. Click **Activate Template**

### Step 2: Set Your Subdomain

- Your website will be available at: `your-property-name.vilo.com`
- The subdomain is auto-generated from your property name
- You can customize it during activation

### Step 3: Automatic Setup

The system automatically creates:
- 5 default pages (Home, About, Contact, Accommodation, Blog)
- Default theme colors (#047857 brand green)
- Navigation structure
- SEO meta tags

---

## Customizing Your Brand

### Brand Colors

1. Go to **Website → Settings → Branding**
2. Customize your colors:
   - **Primary Color**: Used for buttons, links, accents (default: #047857)
   - **Secondary Color**: Used for text and borders (default: #000000)
3. Use the color picker or enter hex codes
4. Preview changes in real-time
5. Click **Save Changes**

### Logo & Favicon

1. In **Settings → Branding**, scroll to "Logo & Favicon"
2. **Logo URL**: Enter the full URL to your logo image
   - Recommended: PNG format, transparent background
   - Ideal size: 200px wide × 60px tall
   - Displays in the header navigation
3. **Favicon URL**: Enter the full URL to your favicon
   - Recommended: ICO or PNG format
   - Size: 16×16 or 32×32 pixels
   - Displays in the browser tab
4. Click **Save Changes**

**Note**: Logos and favicons must be hosted online (e.g., uploaded to your image hosting service or property images).

---

## Editing Page Content

### Page Editor Overview

1. Go to **Website → Pages**
2. Select a page to edit (Home, About, Contact, Accommodation, Blog Archive)
3. Each page has:
   - **Title**: The page heading
   - **Content**: Custom HTML content (editable)
   - **Visibility**: Show/hide page in navigation
   - **SEO Settings**: Meta title, description, keywords

### Supported HTML Tags

You can use these HTML tags in your content:

```html
<h1>Main Heading</h1>
<h2>Subheading</h2>
<h3>Smaller Heading</h3>
<p>Paragraph text</p>
<strong>Bold text</strong>
<em>Italic text</em>
<ul>
  <li>Unordered list item</li>
</ul>
<ol>
  <li>Ordered list item</li>
</ol>
<a href="https://example.com">Link text</a>
<img src="https://example.com/image.jpg" alt="Description" />
<br /> <!-- Line break -->
<div>Container</div>
<span>Inline element</span>
```

### Page-Specific Notes

**Home Page**:
- Content appears between the hero section and features section
- Use for welcome message or special announcements

**About Page**:
- Tell your property's story
- Location map displays automatically at the bottom
- Use for history, team info, unique selling points

**Contact Page**:
- Content appears above the contact form
- Contact form and map display automatically
- Use for office hours, special instructions

**Accommodation Page**:
- **IMPORTANT**: Your room listings display automatically below your content
- You don't need to manually add rooms here
- Rooms are pulled from **Rooms → Room Management**
- Use custom content for intro text about accommodations
- Rooms update in real-time when you add/edit them

**Blog Archive**:
- Content appears above the blog post list
- Blog posts display automatically

### Saving Changes

1. Edit your content
2. Preview changes (if available)
3. Click **Save Changes** button
4. Changes are live immediately on your public website

---

## Managing Rooms

### How Rooms Work

Rooms are managed in **Rooms → Room Management**, NOT in the website editor.

**Key Points**:
- Add/edit rooms in the Rooms section
- Rooms **automatically** appear on your public website
- Each room gets its own detail page at `/accommodation/room-name`
- Room pages include:
  - Image gallery
  - Description and amenities
  - Bed configuration
  - Pricing
  - Booking button

### Adding a Room

1. Go to **Rooms → Add Room**
2. Fill in room details:
   - **Name** (e.g., "Deluxe Ocean View Suite")
   - **Description** (detailed text about the room)
   - **Base Price Per Night**
   - **Max Occupancy**
   - **Size** (in square meters)
   - **Featured Image** (main photo)
   - **Gallery Images** (additional photos)
   - **Amenities** (WiFi, TV, Air Conditioning, etc.)
   - **Bed Configuration** (1 King Bed, 2 Queen Beds, etc.)
3. Set **Status** to "Active"
4. Click **Save**

**Result**: The room immediately appears on:
- `/accommodation` (room listing page)
- `/accommodation/room-name` (individual room page)

### Editing a Room

1. Go to **Rooms → Room Management**
2. Click on the room you want to edit
3. Update any details
4. Click **Save**

**Result**: Changes are reflected immediately on the public website.

### Hiding a Room

To temporarily hide a room from your website:
1. Edit the room
2. Set **Status** to "Inactive" or "Paused"
3. Click **Save**

**Result**: The room is removed from the public website but remains in your dashboard.

---

## Room Detail Pages

### Enhanced Room Pages

Each room automatically gets a beautiful, feature-rich detail page at `/accommodation/room-slug`.

### Interactive Gallery

**Features**:
- Hero image with thumbnail navigation
- Lightbox view (click to enlarge)
- Swipe gestures on mobile
- Keyboard navigation (arrow keys)
- Zoom functionality

**Best Practices**:
- Upload high-quality images (1920×1080 minimum)
- Use horizontal (landscape) orientation
- Show different angles of the room
- Include bathroom, view, and unique features
- Aim for 5-10 images per room

### Categorized Amenities

Amenities are automatically organized into 9 categories:

1. **Bedroom** - Closet, Safe, Iron, etc.
2. **Bathroom** - Shower, Bathtub, Hairdryer, Toiletries
3. **Kitchen & Dining** - Refrigerator, Microwave, Coffee Maker
4. **Entertainment** - TV, WiFi, Streaming Services
5. **Comfort & Climate** - Air Conditioning, Heating, Fireplace
6. **Work & Study** - Desk, Ergonomic Chair, Printer
7. **Outdoor & Views** - Balcony, Terrace, Ocean View
8. **Services & Facilities** - Room Service, Daily Housekeeping
9. **Policies** - Pet Friendly, Smoking Allowed

**Icon System**:
- Each amenity displays a professional icon
- Icons match your theme colors
- Over 30 unique icons for common amenities

### Bed Configuration

Display your room's sleeping arrangements:
- Visual bed icons
- Quantity and type (King, Queen, Twin, Sofa Bed)
- Organized in a clean grid layout

**Example**: "2× Queen Bed, 1× Sofa Bed"

### Advanced Booking Widget

**Features**:
- **Date Selection**: Interactive date picker with check-in/check-out
- **Guest Selector**: Adults and children count with validation
- **Live Pricing**: Real-time price calculation as dates change
- **Minimum Nights**: Automatic validation of minimum stay requirements
- **Max Occupancy**: Prevents overbooking
- **Price Breakdown**: Shows base price, nights, and tax separately
- **Sticky Positioning**: Widget follows as user scrolls (desktop)

**How It Works**:
1. Guest selects check-in and check-out dates
2. System validates minimum nights and availability
3. Guest enters number of adults and children
4. Total price updates automatically
5. "Reserve Now" button becomes active when valid
6. Clicking Reserve launches template-branded checkout

**Requirements**:
- Room must have `base_price_per_night` set
- Room status must be "Active"
- Room must have available inventory for selected dates

---

## Booking Flow

### Template-Branded Checkout

When guests click "Reserve Now" on a room page, they're taken to a beautiful checkout experience that matches your website branding.

### Checkout Features

**Branding**:
- Your property logo in the header
- Your primary color throughout
- Your custom fonts (if configured)
- Minimal distractions (no main navigation during checkout)

**Progress Indicator**:
- Visual progress bar at top
- Current step highlighted
- Step numbers and labels

**Pre-filled Information**:
- Room already selected
- Check-in/check-out dates from widget
- Guest counts from widget

### Checkout Steps

**Step 1: Dates & Room**
- Review and confirm room selection
- Modify dates if needed
- See pricing summary

**Step 2: Add-ons** (if applicable)
- Property add-ons displayed (e.g., Breakfast, Airport Transfer)
- Quantity selection
- Prices update in real-time
- Skip button if guest doesn't want add-ons

**Step 3: Guest Details & Payment**
- Contact information form
- Payment method selection
- Special requests field
- Terms and conditions checkbox

**Step 4: Confirmation**
- Booking reference number
- Booking summary
- Email confirmation sent
- Return to website button

### Navigation

**Close Button**:
- Top-right X button returns to room page
- Confirmation prompt if guest has entered data

**Browser Back Button**:
- Works naturally to go back through steps
- Data preserved when going back

---

## Social Media Integration

### Adding Social Links

1. Go to **Website → Settings → Branding**
2. Scroll to "Social Media Links"
3. Enter full URLs for your social profiles:
   - **Facebook**: `https://facebook.com/your-page`
   - **Instagram**: `https://instagram.com/your-profile`
   - **Twitter**: `https://twitter.com/your-handle`
   - **LinkedIn**: `https://linkedin.com/company/your-company`
4. Leave blank any platforms you don't use
5. Click **Save Changes**

### Where Social Links Appear

- **Footer**: Circular icons with your brand color
- **Contact Page**: Social links in the contact information section

### Best Practices

- Use your business/property accounts, not personal
- Keep URLs current
- Link to active profiles with recent posts
- Icons only appear for platforms you've configured

---

## Blog Management

### Creating Blog Posts

1. Go to **Website → Blog → Posts**
2. Click **Create Post**
3. Fill in post details:
   - **Title**
   - **Content** (HTML supported)
   - **Featured Image**
   - **Category** (create categories first)
   - **Status** (Draft or Published)
   - **SEO Meta Tags**
4. Click **Save**

### Managing Categories

1. Go to **Website → Blog → Categories**
2. Click **Create Category**
3. Enter:
   - **Name** (e.g., "Travel Tips")
   - **Slug** (URL-friendly: "travel-tips")
   - **Description**
4. Click **Save**

### Blog Features

**Archive Page** (`/blog`):
- **Featured Post**: First post displays as large hero card (two-column layout)
- **Regular Posts**: Remaining posts in 3-column grid
- **Read Time**: Automatically calculated (200 words per minute)
- **Category Badges**: Visual category labels on each post
- **Hover Effects**: Smooth image zoom and card lift animations
- **Responsive**: Adapts to 1, 2, or 3 columns based on screen size

**Category Filtering** (`/blog/category/travel-tips`):
- Filter pills at top of archive page
- "All Posts" pill to clear filters
- Category pills use your theme primary color
- URL updates when filtering

**Individual Posts** (`/blog/post-slug`):
- Full-width featured image
- Author and published date
- Category link
- Formatted content with typography
- "Back to Blog" navigation
- **SEO Optimized**: Each post has its own meta tags

### Blog Best Practices

**Content**:
- Aim for 500-1500 words per post (3-8 min read time)
- Use subheadings (H2, H3) for scannability
- Include images throughout long posts
- Add meta description for each post

**Publishing Schedule**:
- Monthly minimum for SEO benefits
- Consistent schedule (e.g., first Monday of each month)
- Mix of content types (tips, news, behind-the-scenes)

**Categories**:
- Keep it simple: 3-5 categories maximum
- Examples: "Travel Tips", "Property News", "Local Attractions", "Guest Stories"

---

## Contact Page Features

### Full-Width Hero Design

Your contact page features a modern, impactful layout:

**Hero Section**:
- Full-width background image (uses property featured image)
- Dark gradient overlay for text readability
- Two-column layout: Contact Info + Contact Form

### Contact Information Cards

**Left Column** displays interactive cards:

**Phone Card**:
- Clickable `tel:` link (opens phone app on mobile)
- Icon with your theme primary color
- "Call us" label

**Email Card**:
- Clickable `mailto:` link (opens email client)
- Themed icon
- "Email us" label

**Address Card**:
- Full formatted address
- Map pin icon
- "Visit us" label

**Design**:
- Glassmorphism effect (frosted glass with backdrop blur)
- Hover animations
- Responsive on mobile

### Contact Form

**Right Column** - Overlay Form:

**Fields**:
- Name (required)
- Email (required, validated)
- Phone (optional)
- Message (required, 10 character minimum)

**Features**:
- Inline validation with error messages
- Loading state during submission
- Success message after submission
- Form clears after successful submission
- Glassmorphism card design

**What Happens**:
1. Guest fills out form
2. Click "Send Message"
3. Email sent to property email address
4. Success confirmation displayed
5. Form resets for next submission

### Customization Tips

**Background Image**:
- Set in property profile as "Featured Image"
- Use high-quality landscape image (1920×1080+)
- Property exterior, entrance, or scenic view works well
- Ensure good contrast with overlay

**Contact Info**:
- Set phone and email in Property → Settings
- Set address in Property → Settings
- All information auto-displays on contact page

---

## SEO Best Practices

### Page Meta Tags

For each page, optimize:

**Meta Title**:
- 50-60 characters optimal
- Include property name and page purpose
- Example: "Luxury Oceanfront Suites - Paradise Resort"

**Meta Description**:
- 120-160 characters optimal
- Compelling summary with call-to-action
- Example: "Book your dream vacation at Paradise Resort. Beachfront suites, world-class amenities, and unforgettable experiences await."

**Meta Keywords** (optional):
- Comma-separated
- Modern SEO relies less on keywords
- Focus on title and description instead

### Image Optimization

- Use descriptive file names: `ocean-view-suite.jpg` (not `IMG_1234.jpg`)
- Add alt text to all images
- Compress images for faster loading

### Content Best Practices

- Use heading tags (H1, H2, H3) for structure
- Write unique, valuable content for each page
- Include location and property name naturally
- Link to related pages on your site

---

## Accessibility Features

Your website is built to meet WCAG AA accessibility standards, ensuring all guests can access your content.

### Keyboard Navigation

**Fully Keyboard Accessible**:
- Tab through all interactive elements
- Enter/Space to activate buttons and links
- Escape to close lightbox and modals
- Arrow keys in gallery/carousel navigation

**Focus Indicators**:
- Visible focus rings on all interactive elements
- Focus rings use your theme primary color
- 2px minimum width for visibility

### Screen Reader Support

**Semantic HTML**:
- Proper heading hierarchy (H1 → H2 → H3)
- ARIA labels on icon buttons
- Descriptive link text (no "click here")
- Form labels properly associated with inputs

**Content Structure**:
- Landmarks for major page sections
- Alt text for all images
- Text alternatives for visual content

### Touch Targets (Mobile)

**Minimum Size**: All touchable elements meet 44×44px minimum:
- Buttons
- Links
- Form controls
- Navigation items

### Color Contrast

**WCAG AA Compliant**:
- Body text: 4.5:1 contrast ratio minimum
- Headings: 4.5:1 contrast ratio minimum
- Links and buttons: 4.5:1 contrast ratio minimum
- Maintained in both light and dark mode

### Dark Mode

**Automatic Theme Detection**:
- Respects user's system preference
- Manual toggle available (if configured)
- All content remains readable
- Contrast ratios maintained

**Dark Mode Features**:
- Inverted backgrounds (white → dark gray/black)
- Adjusted text colors
- Proper border visibility
- Form inputs remain readable
- Images and media adapt

### Best Practices for Accessibility

**Images**:
- Always add descriptive alt text
- Example: "Oceanfront suite with king bed and private balcony" (not "room.jpg")

**Links**:
- Use descriptive text: "View our accommodation" (not "click here")
- Avoid "read more" without context

**Forms**:
- Clear labels for all fields
- Error messages that explain how to fix issues
- Success messages that confirm submission

---

## Troubleshooting

### My changes aren't showing on the public website

**Solution**:
1. Verify you clicked **Save Changes**
2. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
3. Check that the page **Visibility** is set to "On"
4. Wait a few seconds and refresh

### Rooms aren't displaying on Accommodation page

**Solution**:
1. Check that rooms are set to **Status: Active** in Room Management
2. Verify you're viewing the correct property
3. Check that rooms have all required fields filled
4. Clear browser cache and refresh

### Social media icons don't appear

**Solution**:
1. Verify URLs are complete (include `https://`)
2. Ensure URLs are saved in **Settings → Branding**
3. Check that at least one social link is configured
4. Clear cache and refresh footer

### Logo or favicon not showing

**Solution**:
1. Verify URLs are complete and publicly accessible
2. Check image format (PNG for logo, ICO/PNG for favicon)
3. Test URL in a new browser tab - can you see the image?
4. Ensure images are hosted on a reliable server

### Contact form not working

**Solution**:
1. Verify email settings in your property profile
2. Check spam folder for form submissions
3. Test with a simple message
4. Contact support if issue persists

### Website not accessible at subdomain

**Solution**:
1. Verify website is **Active** in Settings → Branding
2. Check subdomain is correct (shown in Website → Overview)
3. Allow a few minutes for DNS propagation
4. Contact support if issue persists after 24 hours

---

## Tips & Tricks

### Mobile Optimization

Your website is automatically mobile-responsive:
- Navigation collapses to hamburger menu
- Images scale appropriately
- Text remains readable
- Forms are touch-friendly

Always preview on mobile devices to ensure content looks good.

### Brand Consistency

- Use the same primary color throughout (buttons, links, accents)
- Keep logo simple and clear at small sizes
- Use high-quality images (minimum 1200px wide for hero images)
- Maintain consistent tone in page content

### Content Updates

- Update your blog regularly (monthly minimum) for SEO benefits
- Refresh room photos seasonally
- Update About page with property improvements
- Add testimonials/reviews to build trust

### Performance

- Optimize image file sizes (under 500KB each)
- Use descriptive, clean URLs
- Keep page content focused and scannable
- Test website speed with Google PageSpeed Insights

---

## Support

### Getting Help

If you encounter issues:
1. Check this guide
2. Review the Troubleshooting section
3. Contact Vilo support: support@vilo.com
4. Include screenshots and error messages

### Feature Requests

Have ideas for improvements? Contact us at support@vilo.com.

---

## Changelog

### Version 2.0 (January 2026) - Website Template Refinement

**Enhanced Room Detail Pages**:
- ✅ Interactive gallery with lightbox and keyboard navigation
- ✅ Advanced booking widget with live pricing and date validation
- ✅ Categorized amenities (9 categories with 30+ professional icons)
- ✅ Visual bed configuration display
- ✅ Optional add-ons preview
- ✅ Sticky booking widget on desktop

**Template-Branded Booking Checkout**:
- ✅ Standalone checkout with property branding (logo, colors, fonts)
- ✅ 4-step checkout flow with progress indicator
- ✅ Pre-filled data from room booking widget
- ✅ Add-ons selection with real-time pricing
- ✅ Guest details and payment collection
- ✅ Booking confirmation with reference number

**Redesigned Contact Page**:
- ✅ Full-width hero with background image
- ✅ Glassmorphism overlay form design
- ✅ Interactive contact information cards
- ✅ Clickable phone (tel:) and email (mailto:) links
- ✅ Two-column layout (desktop) / stacked (mobile)
- ✅ Improved form validation and user feedback

**Modernized Blog System**:
- ✅ Featured post section (large hero card)
- ✅ 3-column grid for regular posts
- ✅ Automatic read time calculation (200 words/min)
- ✅ Category filter pills with theme colors
- ✅ Hover effects (image zoom, card lift)
- ✅ Responsive layout (1-3 columns)
- ✅ Author and published date display

**Unified Icon System**:
- ✅ Migrated to Lucide Icons library
- ✅ 30+ professional icons for amenities
- ✅ Consistent sizing and theming
- ✅ Icon backgrounds use theme primary color
- ✅ Replaced all emoji and mismatched icons

**Design System & Consistency**:
- ✅ Unified spacing across all pages
- ✅ Consistent typography hierarchy
- ✅ Standardized border radius and shadows
- ✅ Theme-aware color system
- ✅ Smooth transitions and hover effects

**Accessibility Improvements (WCAG AA)**:
- ✅ Keyboard navigation for all interactive elements
- ✅ Visible focus indicators (2px rings)
- ✅ Proper heading hierarchy (H1 → H2 → H3)
- ✅ ARIA labels on icon buttons
- ✅ Touch targets minimum 44×44px
- ✅ Color contrast ratios 4.5:1 minimum
- ✅ Screen reader support

**Dark Mode Support**:
- ✅ Automatic theme detection
- ✅ All pages adapted for dark mode
- ✅ Maintained contrast ratios
- ✅ Inverted backgrounds and adjusted colors
- ✅ Form inputs remain readable

**Responsive Design**:
- ✅ Mobile-first approach
- ✅ Tested on all breakpoints (320px - 1920px+)
- ✅ Touch-optimized for mobile
- ✅ Tablet-specific layouts
- ✅ Desktop multi-column grids

**Performance & SEO**:
- ✅ Lazy-loaded images
- ✅ Optimized transitions and animations
- ✅ Structured data (schema.org) for all pages
- ✅ Meta tags for social sharing
- ✅ Semantic HTML throughout

### Version 1.0 (January 2026)
- Initial release of Modern Luxe template
- Automatic room integration
- Social media links
- Blog system
- SEO optimization
- Mobile responsive design
- Brand customization
- Contact form with email integration

---

**© 2026 Vilo. All rights reserved.**
