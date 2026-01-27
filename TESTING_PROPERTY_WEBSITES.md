# Testing Property Websites - Local Development Guide

## Overview

This guide explains how to test property websites on your local development environment using subdomain routing.

## How Subdomain Routing Works

### Development (Testing)
```
your-property.localhost:5173
```

### Production (Live)
```
your-property.yourdomain.com
```

The system automatically detects whether you're in development or production mode.

---

## Setting Up Local Testing

### Step 1: No hosts file needed!

Modern browsers automatically resolve `*.localhost` domains to `127.0.0.1`, so you don't need to edit your hosts file.

### Step 2: Start Your Dev Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

### Step 3: Access Different Sites

#### Main Application (No Subdomain)
```
http://localhost:5173
```
**Shows**: Dashboard, admin panels, login, signup

#### Property Website (With Subdomain)
```
http://test-property.localhost:5173
http://beach-resort.localhost:5173
http://mountain-lodge.localhost:5173
```
**Shows**: Public property website with Modern Luxe template

---

## Testing Workflow

### 1. Create a Test Property

1. Access main app: `http://localhost:5173`
2. Login to your account
3. Go to **Manage → Properties**
4. Create a new property (or use existing)
5. Note the property name (e.g., "Beach Resort")

### 2. Activate Website Template

1. Go to **Manage → Properties → [Your Property] → Website**
2. Click **Templates** tab
3. Select **Modern Luxe (Hotel)**
4. Click **Activate Template**
5. Choose subdomain (e.g., "beach-resort")
6. Click **Activate**

### 3. Test Public Website

**Access your property website:**
```
http://beach-resort.localhost:5173
```

You should see:
- ✅ Hero section with property name
- ✅ Features section
- ✅ Room preview (if you have rooms)
- ✅ Testimonials section
- ✅ Navigation (Home, About, Contact, Accommodation, Blog)
- ✅ Footer with social links

### 4. Test Navigation

Click through all pages:

**Home Page**
```
http://beach-resort.localhost:5173/
```

**About Page**
```
http://beach-resort.localhost:5173/about
```

**Contact Page**
```
http://beach-resort.localhost:5173/contact
```

**Accommodation (Rooms)**
```
http://beach-resort.localhost:5173/accommodation
```

**Single Room**
```
http://beach-resort.localhost:5173/accommodation/deluxe-suite
```
(Only works if you have a room with slug "deluxe-suite")

**Blog Archive**
```
http://beach-resort.localhost:5173/blog
```

**Blog Post**
```
http://beach-resort.localhost:5173/blog/my-post-slug
```
(Only works if you have a published blog post)

### 5. Test Customization

#### Change Brand Colors
1. Go back to main app: `http://localhost:5173`
2. Navigate to: **Properties → [Your Property] → Website → Settings → Branding**
3. Change **Primary Color** to `#FF6B6B` (red)
4. Click **Save Changes**
5. Refresh property website: `http://beach-resort.localhost:5173`
6. **Result**: Buttons, links, and accents should now be red

#### Add Social Links
1. In **Settings → Branding**, scroll to "Social Media Links"
2. Add:
   - Facebook: `https://facebook.com/testpage`
   - Instagram: `https://instagram.com/testprofile`
3. Click **Save Changes**
4. Refresh property website and check footer
5. **Result**: Social icons appear in footer

#### Add a Room
1. Go to: **Properties → [Your Property] → Rooms**
2. Click **Add Room**
3. Fill in:
   - Name: "Deluxe Ocean Suite"
   - Description: "Beautiful ocean views..."
   - Base Price: $199
   - Max Occupancy: 4
   - Status: Active
4. Click **Save**
5. Go to: `http://beach-resort.localhost:5173/accommodation`
6. **Result**: Room appears automatically in listing

#### Test Contact Form
1. Go to: `http://beach-resort.localhost:5173/contact`
2. Fill out the form:
   - Name: Test User
   - Email: test@example.com
   - Message: Testing contact form
3. Click **Send Message**
4. **Result**: Success message appears
5. **Check**: Backend logs should show form submission

---

## Testing Multiple Properties

You can test multiple property websites simultaneously:

**Property 1 - Beach Resort**
```
http://beach-resort.localhost:5173
```

**Property 2 - Mountain Lodge**
```
http://mountain-lodge.localhost:5173
```

**Property 3 - City Hotel**
```
http://city-hotel.localhost:5173
```

Each subdomain will load the corresponding property's website with its own:
- Brand colors
- Logo
- Pages
- Rooms
- Blog posts
- Social links

---

## Browser Compatibility

### ✅ Supported Browsers

**Chrome/Edge (Recommended)**
```bash
# Works perfectly with *.localhost
http://test.localhost:5173
```

**Firefox**
```bash
# Works perfectly with *.localhost
http://test.localhost:5173
```

**Safari**
```bash
# Works with *.localhost on macOS
http://test.localhost:5173
```

### ⚠️ Potential Issues

**Port in URL**
- Always include `:5173` in development
- `http://test.localhost:5173` ✅
- `http://test.localhost` ❌ (won't work without port)

**HTTPS vs HTTP**
- Use `http://` in development
- Production will use `https://`

---

## Troubleshooting

### Issue: "Website Not Found" on subdomain

**Symptoms**:
```
http://test.localhost:5173
Shows: "Website Not Found" error
```

**Solutions**:

1. **Verify website is activated**
   - Go to: `http://localhost:5173`
   - Navigate to: Properties → [Your Property] → Website
   - Check that template is activated
   - Check **Settings → Branding**: Website Active = ON

2. **Check subdomain matches**
   - In Website → Overview, note the subdomain (e.g., "beach-resort")
   - Use exact subdomain: `http://beach-resort.localhost:5173`
   - Subdomain is case-insensitive

3. **Clear browser cache**
   - Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or use incognito/private window

4. **Check backend is running**
   - Backend must be running on port 3001
   - Check terminal: Should see "Server running on port 3001"

### Issue: Subdomain shows main app instead of property website

**Symptoms**:
```
http://test.localhost:5173
Shows: Dashboard/login instead of property website
```

**Solutions**:

1. **Subdomain detection issue**
   - The subdomain might not be detected correctly
   - Try different format: `test.localhost:5173` (no http://)
   - Check browser console for errors

2. **Website not created in database**
   - Verify in database that property_websites table has your website
   - Check subdomain column matches what you're using

3. **Frontend routing issue**
   - Check App.tsx: `isPropertyWebsite` should return true for subdomains
   - Restart frontend dev server

### Issue: Changes not appearing on property website

**Solutions**:

1. **Clear cache**: `Ctrl+Shift+R` (force refresh)
2. **Check you saved changes**: Click "Save Changes" button
3. **Wait a moment**: Some changes take 1-2 seconds
4. **Try incognito window**: Rules out caching issues

### Issue: Rooms not showing on Accommodation page

**Solutions**:

1. **Verify room status**: Must be "Active"
2. **Check property ID**: Room must belong to this property
3. **Check slug**: Room needs a slug (auto-generated from name)
4. **Backend logs**: Check for errors in backend terminal

### Issue: Contact form not submitting

**Solutions**:

1. **Check required fields**: Name, Email, Message all required
2. **Email validation**: Must be valid email format
3. **Backend running**: Check backend terminal for errors
4. **Network tab**: Open browser DevTools → Network, check for failed requests

---

## Database Verification

### Check Website in Database

```sql
-- Find your property website
SELECT
  pw.id,
  pw.subdomain,
  pw.is_active,
  pw.theme_config,
  p.name as property_name
FROM property_websites pw
JOIN properties p ON p.id = pw.property_id
WHERE pw.subdomain = 'beach-resort';
```

### Check Pages

```sql
-- Check pages for a website
SELECT
  page_type,
  title,
  slug,
  is_visible
FROM website_pages
WHERE property_website_id = 'your-website-id'
ORDER BY sort_order;
```

### Check Rooms

```sql
-- Check active rooms for a property
SELECT
  name,
  slug,
  base_price_per_night,
  max_occupancy,
  status
FROM rooms
WHERE property_id = 'your-property-id'
AND status = 'active';
```

---

## Production Deployment

### Environment Variables

**Frontend (.env)**
```bash
# Development
VITE_API_URL=http://localhost:3001/api

# Production
VITE_API_URL=https://api.yourdomain.com/api
```

**Backend (.env)**
```bash
# Allowed origins for CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://*.yourdomain.com
```

### DNS Configuration

For production, configure your DNS to point all subdomains to your server:

```
Type: A Record
Name: *
Value: Your.Server.IP.Address
TTL: 3600
```

Or use CNAME:
```
Type: CNAME
Name: *
Value: yourdomain.com
TTL: 3600
```

### SSL Certificates

Use wildcard SSL certificate:
```
*.yourdomain.com
```

This covers all subdomains:
- `property1.yourdomain.com`
- `property2.yourdomain.com`
- `property3.yourdomain.com`

---

## Testing Checklist

Before deploying to production, verify all features work locally:

### ✅ Basic Functionality
- [ ] Main app loads at `localhost:5173`
- [ ] Property website loads at `test.localhost:5173`
- [ ] Navigation works between pages
- [ ] Mobile menu works (responsive design)
- [ ] Footer links work

### ✅ Customization
- [ ] Brand color changes apply immediately
- [ ] Logo displays in header
- [ ] Favicon appears in browser tab
- [ ] Social links appear in footer

### ✅ Content Management
- [ ] Page edits save and display
- [ ] HTML content renders correctly
- [ ] SEO meta tags appear in page source
- [ ] Pages can be hidden/shown

### ✅ Rooms
- [ ] Rooms display on /accommodation
- [ ] Individual room pages work
- [ ] Room images load
- [ ] Amenities display correctly
- [ ] Booking button redirects

### ✅ Blog
- [ ] Blog posts display on /blog
- [ ] Individual post pages work
- [ ] Categories filter works
- [ ] Published/draft status works

### ✅ Forms
- [ ] Contact form submits successfully
- [ ] Form validation works
- [ ] Success message displays
- [ ] Backend receives submission

### ✅ SEO
- [ ] Meta tags in page source
- [ ] Schema.org markup present
- [ ] Open Graph tags work
- [ ] Sitemap accessible

---

## Next Steps

Once local testing is complete:

1. **Run build**: `npm run build` (frontend and backend)
2. **Test production build**: Test built version locally
3. **Deploy to staging**: Test on staging environment
4. **Configure DNS**: Set up wildcard subdomain
5. **Deploy to production**: Deploy to live servers
6. **Test live**: Verify all features work in production

---

## Support

If you encounter issues during testing:

1. Check this guide
2. Review console errors (F12 in browser)
3. Check backend terminal logs
4. Verify database state
5. Contact development team with:
   - Exact URL you're testing
   - Browser and version
   - Console errors (screenshot)
   - Steps to reproduce

---

**Happy Testing! 🚀**
