/**
 * Accommodation Categories Data
 * Categories and filters for property search
 */

export interface Category {
  name: string;
  slug: string;
  icon: string; // SVG path
  description: string;
}

export interface CategoryGroup {
  title: string;
  categories: Category[];
}

export const accommodationCategories: CategoryGroup[] = [
  {
    title: 'Property Types',
    categories: [
      {
        name: 'Villas',
        slug: 'villas',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        description: 'Luxury villas with private pools and stunning views',
      },
      {
        name: 'Apartments',
        slug: 'apartments',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        description: 'Modern apartments perfect for city stays',
      },
      {
        name: 'Houses',
        slug: 'houses',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
        description: 'Comfortable family homes with space to relax',
      },
      {
        name: 'Cottages',
        slug: 'cottages',
        icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
        description: 'Cozy cottages for a peaceful getaway',
      },
      {
        name: 'Guesthouses',
        slug: 'guesthouses',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        description: 'Warm hospitality in charming guesthouses',
      },
      {
        name: 'Lodges',
        slug: 'lodges',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        description: 'Safari lodges and nature retreats',
      },
    ],
  },
  {
    title: 'Popular Amenities',
    categories: [
      {
        name: 'Private Pool',
        slug: 'pool',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
        description: 'Properties with swimming pools',
      },
      {
        name: 'WiFi',
        slug: 'wifi',
        icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
        description: 'Fast and reliable internet connection',
      },
      {
        name: 'Pet Friendly',
        slug: 'pet-friendly',
        icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        description: 'Bring your furry friends along',
      },
      {
        name: 'Kitchen',
        slug: 'kitchen',
        icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
        description: 'Fully equipped kitchen facilities',
      },
      {
        name: 'Air Conditioning',
        slug: 'air-conditioning',
        icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
        description: 'Stay cool and comfortable',
      },
      {
        name: 'Parking',
        slug: 'parking',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
        description: 'Secure parking available',
      },
    ],
  },
  {
    title: 'Location Types',
    categories: [
      {
        name: 'Beachfront',
        slug: 'beachfront',
        icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        description: 'Direct beach access properties',
      },
      {
        name: 'Mountain View',
        slug: 'mountain',
        icon: 'M3 21l7.548-7.548m0 0L18 21m-7.452-7.548L8 10.452M18 21l-4.548-4.548M8 10.452L3 5.452m5 5L13.452 5m0 0L18 10.452M13.452 5L8 10.452',
        description: 'Scenic mountain retreats',
      },
      {
        name: 'City Center',
        slug: 'city-center',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        description: 'Heart of the city locations',
      },
      {
        name: 'Countryside',
        slug: 'countryside',
        icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064',
        description: 'Peaceful rural escapes',
      },
      {
        name: 'Lakefront',
        slug: 'lakefront',
        icon: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
        description: 'Waterfront properties with lake views',
      },
      {
        name: 'Wine Country',
        slug: 'wine-country',
        icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
        description: 'Stay among the vineyards',
      },
    ],
  },
  {
    title: 'Guest Capacity',
    categories: [
      {
        name: 'Couples',
        slug: 'couples',
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
        description: 'Romantic getaways for two',
      },
      {
        name: 'Small Families',
        slug: 'small-families',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        description: 'Perfect for families of 4-6',
      },
      {
        name: 'Large Groups',
        slug: 'large-groups',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        description: 'Spacious properties for 8+ guests',
      },
      {
        name: 'Business Travelers',
        slug: 'business',
        icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        description: 'Work-friendly with office space',
      },
    ],
  },
];
