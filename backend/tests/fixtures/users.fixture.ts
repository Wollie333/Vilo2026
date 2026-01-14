/**
 * User Test Fixtures
 * Reusable test data for user-related tests
 */

import { faker } from '@faker-js/faker';

export const mockUsers = {
  guest: {
    email: 'guest@vilo-test.com',
    user_type: 'guest',
    role: 'guest',
    first_name: 'Test',
    last_name: 'Guest',
    phone: '+27123456789',
    is_active: true,
    email_verified: true,
  },

  host: {
    email: 'host@vilo-test.com',
    user_type: 'property_owner',
    role: 'property_owner',
    first_name: 'Test',
    last_name: 'Host',
    phone: '+27123456788',
    bio: 'Experienced property owner with 5+ years in hospitality',
    is_active: true,
    email_verified: true,
  },

  admin: {
    email: 'admin@vilo-test.com',
    user_type: 'saas_admin',
    role: 'admin',
    first_name: 'Test',
    last_name: 'Admin',
    phone: '+27123456787',
    is_active: true,
    email_verified: true,
  },

  superAdmin: {
    email: 'superadmin@vilo-test.com',
    user_type: 'saas_admin',
    role: 'super_admin',
    first_name: 'Test',
    last_name: 'SuperAdmin',
    phone: '+27123456786',
    is_active: true,
    email_verified: true,
  },

  inactiveUser: {
    email: 'inactive@vilo-test.com',
    user_type: 'guest',
    role: 'guest',
    first_name: 'Inactive',
    last_name: 'User',
    is_active: false,
    email_verified: true,
  },

  unverifiedUser: {
    email: 'unverified@vilo-test.com',
    user_type: 'guest',
    role: 'guest',
    first_name: 'Unverified',
    last_name: 'User',
    is_active: true,
    email_verified: false,
  },
};

/**
 * Generate a random user with faker
 */
export function generateRandomUser(overrides?: Partial<any>) {
  return {
    email: faker.internet.email(),
    user_type: 'guest',
    role: 'guest',
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone: faker.phone.number('+2771#######'),
    is_active: true,
    email_verified: true,
    ...overrides,
  };
}

/**
 * Generate multiple random users
 */
export function generateRandomUsers(count: number, overrides?: Partial<any>) {
  return Array.from({ length: count }, () => generateRandomUser(overrides));
}
