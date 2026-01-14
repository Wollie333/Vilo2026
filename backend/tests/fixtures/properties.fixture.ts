/**
 * Property Test Fixtures
 * Reusable test data for property-related tests
 */

import { faker } from '@faker-js/faker';

export const mockProperties = {
  villa: {
    name: 'Luxury Beachfront Villa',
    property_type: 'villa',
    description: 'Stunning 5-bedroom villa with ocean views, private pool, and direct beach access. Perfect for families and groups.',
    location_address: '123 Beach Road',
    location_city: 'Cape Town',
    location_province: 'Western Cape',
    location_country: 'South Africa',
    location_postal_code: '8001',
    is_published: true,
  },

  hotel: {
    name: 'Boutique City Hotel',
    property_type: 'hotel',
    description: 'Elegant boutique hotel in the heart of the city. Modern amenities with classic charm.',
    location_address: '456 Main Street',
    location_city: 'Johannesburg',
    location_province: 'Gauteng',
    location_country: 'South Africa',
    location_postal_code: '2000',
    is_published: true,
  },

  guesthouse: {
    name: 'Cozy Guesthouse',
    property_type: 'guesthouse',
    description: 'Charming guesthouse with personalized service. Breakfast included.',
    location_address: '789 Garden Lane',
    location_city: 'Stellenbosch',
    location_province: 'Western Cape',
    location_country: 'South Africa',
    location_postal_code: '7600',
    is_published: true,
  },

  apartment: {
    name: 'Modern City Apartment',
    property_type: 'apartment',
    description: 'Sleek 2-bedroom apartment with city views. Walking distance to restaurants and shops.',
    location_address: '321 Urban Avenue',
    location_city: 'Durban',
    location_province: 'KwaZulu-Natal',
    location_country: 'South Africa',
    location_postal_code: '4001',
    is_published: true,
  },

  unpublishedProperty: {
    name: 'Under Construction Property',
    property_type: 'villa',
    description: 'Property not yet ready for public viewing',
    location_city: 'Pretoria',
    location_province: 'Gauteng',
    location_country: 'South Africa',
    is_published: false,
  },
};

/**
 * Generate a random property with faker
 */
export function generateRandomProperty(userId: string, overrides?: Partial<any>) {
  return {
    user_id: userId,
    name: faker.company.name() + ' ' + faker.helpers.arrayElement(['Villa', 'Hotel', 'Guesthouse', 'Apartment']),
    property_type: faker.helpers.arrayElement(['villa', 'hotel', 'guesthouse', 'apartment', 'bnb']),
    description: faker.lorem.paragraph(),
    location_address: faker.location.streetAddress(),
    location_city: faker.helpers.arrayElement(['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth']),
    location_province: faker.helpers.arrayElement(['Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape']),
    location_country: 'South Africa',
    location_postal_code: faker.location.zipCode('####'),
    is_published: true,
    ...overrides,
  };
}

/**
 * Generate multiple random properties
 */
export function generateRandomProperties(userId: string, count: number, overrides?: Partial<any>) {
  return Array.from({ length: count }, () => generateRandomProperty(userId, overrides));
}
