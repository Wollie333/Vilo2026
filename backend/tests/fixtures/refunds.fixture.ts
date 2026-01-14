/**
 * Refund Test Fixtures
 * Reusable test data for refund-related tests
 */

import { faker } from '@faker-js/faker';

export const mockRefunds = {
  pendingRefund: {
    refund_amount: 5000,
    refund_reason: 'Cancelled due to emergency',
    refund_status: 'pending',
  },

  approvedRefund: {
    refund_amount: 7500,
    refund_reason: 'Property not as described',
    refund_status: 'approved',
  },

  processedRefund: {
    refund_amount: 10500,
    refund_reason: 'Full refund per cancellation policy',
    refund_status: 'processed',
    refund_reference: 'REF-' + faker.string.alphanumeric(10).toUpperCase(),
  },

  rejectedRefund: {
    refund_amount: 5000,
    refund_reason: 'Late cancellation request',
    refund_status: 'rejected',
    rejection_reason: 'Cancellation policy does not allow refund within 48 hours of check-in',
  },

  partialRefund: {
    refund_amount: 2500, // 50% of booking
    refund_reason: 'Partial refund per policy',
    refund_status: 'processed',
    refund_reference: 'REF-' + faker.string.alphanumeric(10).toUpperCase(),
  },
};

/**
 * Generate a random refund with faker
 */
export function generateRandomRefund(bookingId: string, overrides?: Partial<any>) {
  return {
    booking_id: bookingId,
    refund_amount: faker.number.int({ min: 1000, max: 20000 }),
    refund_reason: faker.helpers.arrayElement([
      'Change of plans',
      'Emergency',
      'Property not as described',
      'Health reasons',
      'Travel restrictions',
    ]),
    refund_status: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'processed']),
    ...overrides,
  };
}

/**
 * Mock refund comments
 */
export const mockRefundComments = {
  guestComment: {
    comment_text: 'I understand the policy, but this is a genuine emergency. Any consideration would be appreciated.',
    is_internal: false,
  },

  ownerComment: {
    comment_text: 'Approving full refund due to emergency circumstances. Hope everything is okay.',
    is_internal: false,
  },

  internalNote: {
    comment_text: 'Guest has good booking history. Recommend approval for goodwill.',
    is_internal: true,
  },
};

/**
 * Mock refund documents
 */
export const mockRefundDocuments = {
  medicalCertificate: {
    document_type: 'medical_certificate',
    document_name: 'medical_certificate.pdf',
    file_size: 245678,
  },

  travelRestriction: {
    document_type: 'travel_document',
    document_name: 'travel_advisory.pdf',
    file_size: 156789,
  },

  receipt: {
    document_type: 'receipt',
    document_name: 'receipt.jpg',
    file_size: 89012,
  },
};

/**
 * Mock cancellation policies
 */
export const mockCancellationPolicies = {
  flexible: {
    name: 'Flexible',
    description: 'Full refund if cancelled 7+ days before check-in',
    rules: [
      { days_before: 7, refund_percentage: 100 },
      { days_before: 0, refund_percentage: 0 },
    ],
  },

  moderate: {
    name: 'Moderate',
    description: 'Full refund if cancelled 14+ days before, 50% if 7-13 days, no refund <7 days',
    rules: [
      { days_before: 14, refund_percentage: 100 },
      { days_before: 7, refund_percentage: 50 },
      { days_before: 0, refund_percentage: 0 },
    ],
  },

  strict: {
    name: 'Strict',
    description: 'Full refund if cancelled 30+ days before, 50% if 14-29 days, no refund <14 days',
    rules: [
      { days_before: 30, refund_percentage: 100 },
      { days_before: 14, refund_percentage: 50 },
      { days_before: 0, refund_percentage: 0 },
    ],
  },

  nonRefundable: {
    name: 'Non-Refundable',
    description: 'No refunds under any circumstances',
    rules: [
      { days_before: 0, refund_percentage: 0 },
    ],
  },
};
