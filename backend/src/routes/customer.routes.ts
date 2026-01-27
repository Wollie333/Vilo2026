/**
 * Customer Routes
 * Route definitions for customer CRM endpoints.
 */

import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import {
  authenticate,
  loadUserProfile,
} from '../middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// CUSTOMER CRUD ROUTES
// ============================================================================

/**
 * GET /api/customers
 * List all customers with filters and pagination
 * Query params:
 *  - company_id: Filter by company
 *  - property_id: Filter by property
 *  - status: Filter by status (lead, active, past_guest, inactive, blocked)
 *  - source: Filter by source (booking, chat, website_inquiry, manual, import, referral)
 *  - search: Search by name or email
 *  - sortBy: Sort field (full_name, email, created_at, total_bookings, total_spent, last_booking_date)
 *  - sortOrder: Sort direction (asc, desc)
 *  - page: Page number (default: 1)
 *  - limit: Items per page (default: 20)
 */
router.get('/', customerController.listCustomers);

/**
 * GET /api/customers/:id
 * Get a single customer by ID with company and property details
 */
router.get('/:id', customerController.getCustomer);

/**
 * POST /api/customers
 * Create a new customer
 * Body: CreateCustomerInput
 */
router.post('/', customerController.createCustomer);

/**
 * PATCH /api/customers/:id
 * Update a customer
 * Body: UpdateCustomerInput
 */
router.patch('/:id', customerController.updateCustomer);

/**
 * DELETE /api/customers/:id
 * Soft delete a customer (set status to inactive)
 */
router.delete('/:id', customerController.deleteCustomer);

/**
 * DELETE /api/customers/:id/hard
 * Permanently delete a customer
 * WARNING: This cannot be undone
 */
router.delete('/:id/hard', customerController.hardDeleteCustomer);

// ============================================================================
// CUSTOMER ACTION ROUTES
// ============================================================================

/**
 * GET /api/customers/:id/bookings
 * Get customer's booking history with pagination
 * Query params:
 *  - page: Page number (default: 1)
 *  - limit: Items per page (default: 10)
 */
router.get('/:id/bookings', customerController.getCustomerBookings);

/**
 * POST /api/customers/:id/sync-stats
 * Manually sync booking statistics for a customer
 * Normally handled by database triggers, but useful for manual fixes
 */
router.post('/:id/sync-stats', customerController.syncCustomerStats);

/**
 * GET /api/customers/:id/conversations
 * Get customer's conversations scoped to their property
 * Returns conversations where:
 *  - Customer is a participant (matched by user_id or email)
 *  - Conversation belongs to the customer's property (property isolation)
 *  - Matches the archived filter
 * Query params:
 *  - archived: boolean (default: false) - Filter active vs archived conversations
 */
router.get('/:id/conversations', customerController.getCustomerConversations);

export default router;
