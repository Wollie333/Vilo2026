/**
 * Booking Test Fixtures
 * Reusable test data for booking-related tests
 */

import { faker } from '@faker-js/faker';

/**
 * Get date helpers for booking tests
 */
export function getBookingDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    nextWeek: nextWeek.toISOString().split('T')[0],
    nextMonth: nextMonth.toISOString().split('T')[0],
  };
}

export const mockBookings = {
  upcomingBooking: {
    check_in_date: '2026-03-01',
    check_out_date: '2026-03-07',
    num_guests: 2,
    status: 'confirmed',
    total_price: 10500, // 7 nights × 1500
    special_requests: 'Early check-in if possible',
  },

  pendingBooking: {
    check_in_date: '2026-04-15',
    check_out_date: '2026-04-20',
    num_guests: 2,
    status: 'pending',
    total_price: 7500, // 5 nights × 1500
  },

  pastBooking: {
    check_in_date: '2026-01-01',
    check_out_date: '2026-01-05',
    num_guests: 2,
    status: 'completed',
    total_price: 6000, // 4 nights × 1500
  },

  cancelledBooking: {
    check_in_date: '2026-05-01',
    check_out_date: '2026-05-10',
    num_guests: 4,
    status: 'cancelled',
    total_price: 13500, // 9 nights × 1500
    cancellation_reason: 'Change of plans',
  },

  longStayBooking: {
    check_in_date: '2026-06-01',
    check_out_date: '2026-06-30',
    num_guests: 2,
    status: 'confirmed',
    total_price: 43500, // 29 nights × 1500
  },

  sameDay: {
    check_in_date: '2026-02-15',
    check_out_date: '2026-02-15',
    num_guests: 1,
    status: 'pending',
    total_price: 1500,
  },
};

/**
 * Generate a random booking with faker
 */
export function generateRandomBooking(guestId: string, overrides?: Partial<any>) {
  const checkIn = faker.date.future();
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 14 }));

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const pricePerNight = faker.number.int({ min: 500, max: 5000 });

  return {
    guest_id: guestId,
    check_in_date: checkIn.toISOString().split('T')[0],
    check_out_date: checkOut.toISOString().split('T')[0],
    num_guests: faker.number.int({ min: 1, max: 6 }),
    status: faker.helpers.arrayElement(['pending', 'confirmed', 'checked_in', 'checked_out', 'completed']),
    total_price: nights * pricePerNight,
    special_requests: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    ...overrides,
  };
}

/**
 * Generate multiple random bookings
 */
export function generateRandomBookings(guestId: string, count: number, overrides?: Partial<any>) {
  return Array.from({ length: count }, () => generateRandomBooking(guestId, overrides));
}

/**
 * Mock add-ons for bookings
 */
export const mockAddons = {
  airportShuttle: {
    name: 'Airport Shuttle',
    description: 'One-way airport transfer',
    price: 300,
    addon_type: 'per_booking',
    max_quantity: 2,
  },

  breakfast: {
    name: 'Continental Breakfast',
    description: 'Daily breakfast buffet',
    price: 150,
    addon_type: 'per_person_per_night',
  },

  parking: {
    name: 'Parking',
    description: 'Secure parking space',
    price: 100,
    addon_type: 'per_night',
  },
};

/**
 * Mock payment data
 */
export const mockPayments = {
  fullPayment: {
    amount: 10500,
    payment_method: 'card',
    payment_status: 'completed',
    payment_reference: 'PAY-' + faker.string.alphanumeric(10).toUpperCase(),
  },

  depositPayment: {
    amount: 5250, // 50% deposit
    payment_method: 'card',
    payment_status: 'completed',
    payment_reference: 'PAY-' + faker.string.alphanumeric(10).toUpperCase(),
  },

  pendingPayment: {
    amount: 10500,
    payment_method: 'eft',
    payment_status: 'pending',
    payment_reference: 'PAY-' + faker.string.alphanumeric(10).toUpperCase(),
  },
};
