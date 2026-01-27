# Feature Integration & Data Flow Guide

## Core Principle

**ALL FEATURES IN VILO ARE INTERCONNECTED**

Data should flow freely and seamlessly between features where logic and user experience demand it. No feature exists in isolation - users expect a unified, cohesive experience where information entered in one place is automatically available everywhere it's relevant.

---

## The Golden Rule

> **When a user enters data in one place, that data MUST be accessible and pre-filled in ALL other relevant places throughout the application.**

Users should NEVER have to:
- Re-enter the same information multiple times
- Copy-paste data between different sections
- Manually sync data across features

---

## Data Flow Principles

### 1. Single Source of Truth
- Each piece of data has ONE authoritative source (the database)
- All features read from and write to the same database tables
- No duplicate or redundant data storage

### 2. Automatic Pre-filling
- When a user navigates to any form or feature, ALL available data should be pre-filled
- Forms should load with existing data from the database
- Users should only need to ADD or UPDATE, never re-enter

### 3. Bi-directional Flow
- Changes in Feature A should immediately reflect in Feature B
- Updates propagate across all related features
- No manual sync required

### 4. Context Awareness
- Features should understand their relationship to other features
- Related data should be automatically linked and displayed
- Navigation between features should preserve context

---

## Feature Connection Map

### 🏢 Company → Properties → Rooms → Bookings

```
COMPANY
  ├─ name, contact, address, logo
  └─ flows to ↓

PROPERTY
  ├─ inherits company data
  ├─ has: name, description, address, location, images
  └─ flows to ↓

ROOMS
  ├─ belongs to property
  ├─ has: name, capacity, pricing, amenities
  └─ flows to ↓

BOOKINGS
  ├─ references room and property
  ├─ displays property address, contact info
  └─ links to company billing
```

### 🎯 Onboarding → Dashboard → Settings

```
ONBOARDING
  ├─ Profile: name, phone, bio, avatar
  ├─ Company: name, address, contact, logo
  └─ Property: name, type, address, location, images
      └─ ALL data flows to ↓

DASHBOARD
  ├─ Shows properties created in onboarding
  ├─ Pre-fills company details
  ├─ Displays user profile
  └─ ALL fields editable in ↓

SETTINGS
  ├─ Profile tab: pre-filled from onboarding
  ├─ Company tab: pre-filled from onboarding
  └─ Property pages: pre-filled from onboarding
```

### 📋 Property Details → Listing → Public View

```
PROPERTY DETAILS (Internal)
  ├─ Basic info: name, address, contact
  ├─ Description, images, logo
  └─ flows to ↓

LISTING DETAILS (Guest-Facing)
  ├─ Property type, location (hierarchical)
  ├─ Gallery, amenities, policies
  ├─ Description, highlights
  └─ flows to ↓

PUBLIC PROPERTY PAGE
  ├─ Displays all listing data
  ├─ Shows company branding
  └─ Links to booking system
```

### 💳 Subscription → Billing → Invoices → Payment

```
SUBSCRIPTION SELECTION
  ├─ User selects plan
  └─ flows to ↓

PAYMENT (Paystack)
  ├─ Completes payment
  └─ creates ↓

SUBSCRIPTION RECORD
  ├─ Active subscription
  ├─ Plan details, billing interval
  └─ generates ↓

INVOICES
  ├─ Automatic invoice creation
  ├─ Linked to subscription
  └─ Shows payment history
```

---

## Critical Data Flow Examples

### Example 1: Onboarding to Property Editing

**Scenario**: User completes onboarding and later edits their property.

**Data Flow**:
```
Onboarding PropertyStep
  ├─ name: "Beach Villa"
  ├─ description: "Beautiful beachfront property"
  ├─ property_type: "villa"
  ├─ address_street: "123 Beach Road"
  ├─ address_city: "Miami"
  ├─ country_id: 1 (USA)
  ├─ province_id: 10 (Florida)
  ├─ city_id: 150 (Miami)
  ├─ location_lat: 25.7617
  └─ location_lng: -80.1918
      ↓
      SAVED TO DATABASE (properties table)
      ↓
PropertyDetailPage loads
  ├─ fetchData() retrieves property
  ├─ setFormData() with ALL fields
  └─ ALL inputs pre-filled ✅

ListingDetailsTab loads
  ├─ property_type pre-filled: "villa" ✅
  ├─ LocationSelector pre-filled:
  │   ├─ country_id: 1
  │   ├─ province_id: 10
  │   ├─ city_id: 150
  │   ├─ lat: 25.7617
  │   └─ lng: -80.1918 ✅
  └─ User NEVER re-enters this data ✅
```

**Implementation Checklist**:
- [x] Onboarding saves all location fields (country_id, province_id, city_id, lat, lng)
- [x] PropertyDetailPage fetches and sets all fields in formData
- [x] ListingDetailsTab uses formData.country_id, formData.province_id, etc.
- [x] LocationSelector receives selectedCountryId, selectedProvinceId props
- [x] All fields automatically pre-populated on page load

### Example 2: Company Creation to Property Association

**Scenario**: User creates a company, then creates properties.

**Data Flow**:
```
CompanyStep (Onboarding)
  ├─ name: "Sunset Rentals LLC"
  ├─ email: "info@sunsetrentals.com"
  ├─ phone: "+1-234-567-8900"
  ├─ address: "456 Business St, Miami, FL"
  └─ logo_url: "https://..."
      ↓
      SAVED TO DATABASE (companies table)
      company_id: "abc123"
      ↓
PropertyStep (Onboarding)
  ├─ Automatically links: company_id = "abc123"
  ├─ Property inherits company currency
  └─ Property can use company contact info
      ↓
PropertyDetailPage → Contact Tab
  ├─ Shows property contact OR
  └─ Falls back to company contact ✅

Booking Confirmation Email
  ├─ Uses property contact if set
  ├─ Falls back to company contact
  └─ Displays company logo ✅
```

### Example 3: Room Creation to Booking

**Scenario**: Property owner creates rooms, guest books a room.

**Data Flow**:
```
Room Creation
  ├─ property_id: linked
  ├─ name: "Ocean View Suite"
  ├─ base_price: 250.00
  ├─ capacity: 4
  ├─ amenities: ["WiFi", "AC", "Balcony"]
      ↓
Public Listing Page
  ├─ Shows all rooms
  ├─ Displays pricing
  └─ "Book Now" button
      ↓
Booking Wizard
  ├─ Pre-fills property name
  ├─ Pre-fills room details
  ├─ Shows correct pricing
  └─ Displays amenities ✅
      ↓
Booking Confirmation
  ├─ Shows property address (from property table)
  ├─ Shows company contact (from company table)
  ├─ Shows room amenities (from room table)
  └─ Includes check-in instructions ✅
```

---

## Implementation Patterns

### Pattern 1: Cascading Initialization

When loading a feature that depends on other features:

```typescript
// ❌ WRONG - Data not connected
const PropertyDetailPage = () => {
  const [property, setProperty] = useState({
    name: '',
    description: '',
    // Missing location fields!
  });
};

// ✅ CORRECT - All related data included
const PropertyDetailPage = () => {
  const fetchData = async () => {
    const propertyData = await propertyService.getProperty(id);

    const initialData = {
      // Basic fields
      name: propertyData.name,
      description: propertyData.description,

      // Address fields (for contact)
      address_street: propertyData.address_street || '',
      address_city: propertyData.address_city || '',

      // Location fields (for listing)
      country_id: propertyData.country_id ?? undefined,
      province_id: propertyData.province_id ?? undefined,
      city_id: propertyData.city_id ?? undefined,
      location_lat: propertyData.location_lat ?? undefined,
      location_lng: propertyData.location_lng ?? undefined,

      // Images
      logo_url: propertyData.logo_url,
      featured_image_url: propertyData.featured_image_url,

      // ALL relevant fields included
    };

    setFormData(initialData);
  };
};
```

### Pattern 2: Shared State Management

When multiple features need the same data:

```typescript
// ✅ GOOD - Centralized data source
// AuthContext provides user data to all components
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Header shows user name
const Header = () => {
  const { user } = useAuth();
  return <div>{user.full_name}</div>;
};

// Profile page edits same user
const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  // Edit user.full_name
  // Call refreshUser() to update everywhere
};
```

### Pattern 3: Hierarchical Data Loading

When child features depend on parent features:

```typescript
// ✅ GOOD - Parent passes context to children
const PropertyDetailPage = () => {
  const [property, setProperty] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    // Load property
    const propertyData = await propertyService.getProperty(id);
    setProperty(propertyData);

    // Load related company
    if (propertyData.company_id) {
      const companyData = await companyService.getCompany(propertyData.company_id);
      setCompany(companyData);
    }
  }, [id]);

  return (
    <div>
      <PropertyHeader property={property} company={company} />
      <PropertyDetails property={property} />
      <ContactInfo property={property} company={company} />
    </div>
  );
};
```

---

## Data Consistency Checklist

When implementing ANY new feature, verify:

### ✅ Database Schema
- [ ] All necessary fields exist in database tables
- [ ] Foreign keys properly link related tables
- [ ] Indexes exist for frequently queried fields
- [ ] Constraints ensure data integrity

### ✅ Backend API
- [ ] API returns ALL relevant fields (don't filter unnecessarily)
- [ ] Related data is included in responses (joins or separate queries)
- [ ] Update endpoints save all provided fields
- [ ] Response types match frontend expectations

### ✅ Frontend Types
- [ ] TypeScript interfaces include all relevant fields
- [ ] Types are shared between features (don't duplicate)
- [ ] Optional fields marked with `?` where appropriate
- [ ] Enums used for consistent values

### ✅ State Management
- [ ] Initial state includes all fields with correct types
- [ ] State updates preserve unmodified fields
- [ ] Related state updated when dependencies change
- [ ] Context/hooks provide centralized data access

### ✅ Form Pre-filling
- [ ] All form inputs have `value` prop set from state
- [ ] Values come from fetched data, not hardcoded
- [ ] Optional fields default to empty string, not undefined
- [ ] Dropdowns/selects show correct initial selection

### ✅ Data Saving
- [ ] All form fields included in save payload
- [ ] Both text and structured data saved (e.g., address text + location IDs)
- [ ] Related records updated together (transactions where needed)
- [ ] Success responses return updated data

### ✅ Navigation & UX
- [ ] Users can move between related features seamlessly
- [ ] Breadcrumbs or back buttons preserve context
- [ ] No data loss when navigating away and back
- [ ] Loading states prevent showing empty forms

---

## Common Anti-Patterns (DON'T DO THIS)

### ❌ Anti-Pattern 1: Isolated Features
```typescript
// BAD - Property editing doesn't consider listing data
const PropertyPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    // Missing: location_lat, location_lng, country_id, etc.
  });

  // User enters location in PropertyPage
  // Later, ListingPage asks for location AGAIN!
};
```

### ❌ Anti-Pattern 2: Manual Data Sync
```typescript
// BAD - User has to manually "sync" data
const PropertySettings = () => {
  return (
    <div>
      <Button onClick={syncToListing}>
        Sync to Listing
      </Button>
      {/* No! Data should sync automatically */}
    </div>
  );
};
```

### ❌ Anti-Pattern 3: Data Duplication
```typescript
// BAD - Storing same data in multiple places
const onboarding = {
  property_address: '123 Beach Rd', // Stored here
};

const property = {
  address: '123 Beach Rd', // AND here (can get out of sync!)
};

// GOOD - Single source of truth
const property = {
  address_street: '123 Beach Rd', // Only here
};
```

### ❌ Anti-Pattern 4: Incomplete API Responses
```typescript
// BAD - API returns partial data
app.get('/properties/:id', async (req, res) => {
  const property = await db.query('SELECT name, description FROM properties WHERE id = ?');
  res.json(property); // Missing location fields, images, etc.!
});

// GOOD - API returns complete data
app.get('/properties/:id', async (req, res) => {
  const property = await db.query('SELECT * FROM properties WHERE id = ?');
  // Include ALL fields so frontend can use them everywhere
  res.json(property);
});
```

---

## Feature Connection Examples

### Example: Property Address Flow

| Feature | Uses Address For | Fields Used |
|---------|------------------|-------------|
| **Onboarding** | Initial property setup | address_street, address_city, address_state, address_postal_code, address_country |
| **Property Detail Page** | Contact address display | address_street, address_city, address_state, address_postal_code, address_country |
| **Listing Location Tab** | Guest-facing location | country_id, province_id, city_id, location_lat, location_lng |
| **Booking Confirmation** | Directions for guest | address_street, address_city, location_lat, location_lng |
| **Invoice PDF** | Property address on invoice | address_street, address_city, address_state, address_postal_code, address_country |
| **Public Listing** | Map display | location_lat, location_lng |
| **Email Notifications** | Check-in instructions | Full address + coordinates |

**Result**: Enter address ONCE in onboarding → Used in 7+ places automatically ✅

---

## Testing Data Flow

When testing a feature, verify the complete flow:

### Test Case Template
```
FEATURE: [Feature Name]
DEPENDS ON: [Parent Features]
USED BY: [Child Features]

TEST STEPS:
1. Enter data in [Parent Feature]
2. Save and navigate to [Current Feature]
3. Verify data is pre-filled
4. Edit data in [Current Feature]
5. Navigate to [Child Feature]
6. Verify changes propagated

EXPECTED:
✅ All fields pre-filled from parent
✅ No re-entry required
✅ Changes sync to children
✅ Data consistent everywhere
```

### Example Test Case
```
FEATURE: Property Listing Location
DEPENDS ON: Onboarding PropertyStep, Property Details
USED BY: Public Listing, Booking Wizard, Discovery Search

TEST STEPS:
1. Complete onboarding with location: Miami, Florida, USA (lat: 25.76, lng: -80.19)
2. Navigate to Property > Listing > Location tab
3. Verify LocationSelector shows: USA > Florida > Miami
4. Verify coordinates display: 25.76, -80.19
5. Change location to Orlando, Florida
6. Navigate to Public Listing page
7. Verify map shows Orlando location
8. Create a booking
9. Verify confirmation email shows Orlando address

EXPECTED:
✅ Location pre-filled from onboarding
✅ User can edit in one place
✅ Changes reflect everywhere
✅ No data loss or inconsistency
```

---

## Developer Workflow

### When Adding a New Feature

1. **Identify Data Dependencies**
   - What data does this feature need?
   - Where does that data come from?
   - What features will use this feature's data?

2. **Map the Data Flow**
   - Draw a diagram of data flow
   - Identify all tables involved
   - List all fields required

3. **Update Database Schema**
   - Add new tables/columns if needed
   - Create foreign keys for relationships
   - Add indexes for performance

4. **Update Backend**
   - Update types to include all fields
   - Ensure API returns complete data
   - Save all provided fields on updates

5. **Update Frontend**
   - Update types to match backend
   - Fetch and set all relevant data
   - Pre-fill all form inputs
   - Test navigation between features

6. **Verify Integration**
   - Test complete user journey
   - Verify data flows correctly
   - Check all related features
   - Test edge cases

### Before Committing Code

Run through this checklist:

- [ ] Can users enter data in one place and see it everywhere else?
- [ ] Are all form fields pre-filled with existing data?
- [ ] Does saving in one feature update all related features?
- [ ] Is there any data duplication or manual sync required?
- [ ] Have I tested the complete user journey across features?
- [ ] Are all database fields being saved and loaded?
- [ ] Do TypeScript types include all necessary fields?
- [ ] Is the data flow documented in this file?

---

## Conclusion

**Remember**: Vilo is ONE cohesive platform, not a collection of isolated features.

Users should feel like they're using a single, unified application where data flows naturally and intelligently between all parts of the system.

Every feature you build is part of a larger ecosystem. Always ask:
- "Where does this data come from?"
- "Where else will this data be used?"
- "Am I making users re-enter information unnecessarily?"

When in doubt, **connect the data flow**. It's always better to have too much integration than too little.

---

## Quick Reference

### Data Flow Golden Rules

1. ✅ **Single Entry**: Users enter data ONCE
2. ✅ **Auto Pre-fill**: Data automatically appears everywhere
3. ✅ **Bi-directional**: Changes sync across features
4. ✅ **Complete Data**: APIs return ALL fields, not subsets
5. ✅ **Consistent Types**: Shared TypeScript interfaces
6. ✅ **Proper Relations**: Foreign keys link data correctly
7. ✅ **Context Preservation**: Navigation maintains state
8. ✅ **No Duplication**: Single source of truth

### Quick Checks

**Is my feature well-integrated?**
- ✅ All fields saved to database
- ✅ All fields fetched when loading
- ✅ All form inputs pre-filled
- ✅ Related features can access this data
- ✅ This feature can access related data
- ✅ No manual sync required
- ✅ Data flows seamlessly

**Red flags that indicate poor integration:**
- ❌ User asked to re-enter information
- ❌ Empty form when data exists in database
- ❌ "Sync" or "Import" buttons needed
- ❌ Data duplicated across tables
- ❌ Inconsistent data in different features
- ❌ Manual copy-paste required
- ❌ Partial data returned by API

---

Last Updated: 2026-01-21
