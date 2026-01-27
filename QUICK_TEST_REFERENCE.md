# Quick Testing Reference - Property Websites

## TL;DR - Start Testing in 3 Steps

### 1. Start Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 2. Create & Activate Website
1. Go to: `http://localhost:5173`
2. Login → Properties → [Your Property] → Website → Templates
3. Activate "Modern Luxe" template
4. Choose subdomain (e.g., "test-hotel")

### 3. View Your Website
```
http://test-hotel.localhost:5173
```

---

## Common Test URLs

### Main Application
```
http://localhost:5173              # Dashboard/Admin
```

### Property Website (Examples)
```
http://beach-resort.localhost:5173            # Home
http://beach-resort.localhost:5173/about      # About
http://beach-resort.localhost:5173/contact    # Contact
http://beach-resort.localhost:5173/accommodation   # Rooms
http://beach-resort.localhost:5173/blog       # Blog
```

---

## Quick Customization Tests

### Test Brand Colors
1. Main app: Settings → Branding → Primary Color → #FF0000
2. Save
3. Refresh: `http://test-hotel.localhost:5173`
4. **Expected**: Red buttons/links

### Test Add Room
1. Main app: Rooms → Add Room → Fill form → Save
2. Go to: `http://test-hotel.localhost:5173/accommodation`
3. **Expected**: Room appears automatically

### Test Social Links
1. Main app: Settings → Branding → Social Links → Add Facebook
2. Save
3. Refresh: `http://test-hotel.localhost:5173`
4. **Expected**: Facebook icon in footer

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Website Not Found" | Check website is activated & subdomain matches |
| Shows dashboard not website | Check you're using subdomain (e.g., `test.localhost:5173`) |
| Changes not showing | Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) |
| Rooms not displaying | Check room status is "Active" |

---

## Production URLs (After Deployment)

### Development
```
property-name.localhost:5173
```

### Production
```
property-name.yourdomain.com
```

**Same subdomain detection logic works for both!**

---

## API Endpoints Being Tested

When you access `http://test-hotel.localhost:5173`, the frontend calls:

```
GET /api/public/website/test-hotel                     # Website data
GET /api/public/website/test-hotel/rooms               # Room listing
GET /api/public/website/test-hotel/rooms/deluxe-suite  # Single room
GET /api/public/website/test-hotel/blog                # Blog posts
POST /api/public/website/test-hotel/contact            # Contact form
```

The `test-hotel` subdomain is extracted from the URL and passed to these APIs.

---

## Database Check

```sql
-- See all property websites
SELECT subdomain, is_active, property_id
FROM property_websites;

-- Check specific website
SELECT * FROM property_websites
WHERE subdomain = 'test-hotel';

-- Check pages for website
SELECT page_type, title, is_visible
FROM website_pages
WHERE property_website_id = 'website-id-here';
```

---

## Full Testing Guide

For comprehensive testing instructions, see:
- `TESTING_PROPERTY_WEBSITES.md` - Complete testing guide
- `PROPERTY_WEBSITE_GUIDE.md` - User documentation

---

**Ready to test? Go to `http://localhost:5173` and create your first property website!**
