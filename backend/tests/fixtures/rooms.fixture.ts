/**
 * Room Test Fixtures
 * Reusable test data for room-related tests
 */

import { faker } from '@faker-js/faker';

export const mockRooms = {
  deluxeSuite: {
    name: 'Deluxe Suite',
    room_type: 'suite',
    description: 'Spacious suite with king bed, sitting area, and balcony with ocean view',
    base_price: 2500,
    max_occupancy: 2,
    number_of_beds: 1,
    is_active: true,
  },

  standardRoom: {
    name: 'Standard Room',
    room_type: 'standard',
    description: 'Comfortable standard room with queen bed',
    base_price: 1200,
    max_occupancy: 2,
    number_of_beds: 1,
    is_active: true,
  },

  familyRoom: {
    name: 'Family Room',
    room_type: 'family',
    description: 'Large family room with 2 queen beds',
    base_price: 2000,
    max_occupancy: 4,
    number_of_beds: 2,
    is_active: true,
  },

  dormBed: {
    name: 'Dorm Bed',
    room_type: 'dorm',
    description: 'Shared dormitory bed',
    base_price: 300,
    max_occupancy: 1,
    number_of_beds: 1,
    is_active: true,
  },

  inactiveRoom: {
    name: 'Inactive Room',
    room_type: 'standard',
    description: 'Room currently under maintenance',
    base_price: 1000,
    max_occupancy: 2,
    number_of_beds: 1,
    is_active: false,
  },
};

/**
 * Generate a random room with faker
 */
export function generateRandomRoom(propertyId: string, overrides?: Partial<any>) {
  const roomType = faker.helpers.arrayElement(['standard', 'deluxe', 'suite', 'family', 'dorm']);
  const maxOccupancy = roomType === 'dorm' ? 1 : faker.number.int({ min: 1, max: 6 });

  return {
    property_id: propertyId,
    name: faker.helpers.arrayElement(['Ocean View', 'Garden View', 'City View', 'Mountain View']) + ' ' +
          faker.helpers.arrayElement(['Room', 'Suite', 'Apartment']),
    room_type: roomType,
    description: faker.lorem.sentence(),
    base_price: faker.number.int({ min: 500, max: 5000 }),
    max_occupancy: maxOccupancy,
    number_of_beds: faker.number.int({ min: 1, max: 3 }),
    is_active: true,
    ...overrides,
  };
}

/**
 * Generate multiple random rooms
 */
export function generateRandomRooms(propertyId: string, count: number, overrides?: Partial<any>) {
  return Array.from({ length: count }, () => generateRandomRoom(propertyId, overrides));
}

/**
 * Mock bed configurations
 */
export const mockBeds = {
  singleBed: {
    bed_type: 'single',
    quantity: 1,
  },
  kingBed: {
    bed_type: 'king',
    quantity: 1,
  },
  queenBeds: {
    bed_type: 'queen',
    quantity: 2,
  },
};
