/**
 * Customer Controller
 * HTTP request handlers for customer CRM endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import * as customerService from '../services/customer.service';
import type {
  CustomerListParams,
  CustomerStatus,
  CustomerSource,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../types/customer.types';

// ============================================================================
// CUSTOMER CRUD
// ============================================================================

/**
 * GET /api/customers
 * List all customers for the current user's company with filters
 */
export const listCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const params: CustomerListParams = {
      company_id: req.query.company_id as string | undefined,
      property_id: req.query.property_id as string | undefined,
      status: req.query.status as CustomerStatus | undefined,
      source: req.query.source as CustomerSource | undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as CustomerListParams['sortBy'],
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await customerService.listCustomers(params);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers/:id
 * Get a single customer by ID with company and property details
 */
export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    const customer = await customerService.getCustomer(id);
    sendSuccess(res, { customer });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customers
 * Create a new customer
 */
export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateCustomerInput = {
      email: req.body.email,
      full_name: req.body.full_name,
      phone: req.body.phone,
      company_id: req.body.company_id,
      first_property_id: req.body.first_property_id,
      source: req.body.source || 'manual',
      status: req.body.status,
      user_id: req.body.user_id,
      notes: req.body.notes,
      tags: req.body.tags,
      marketing_consent: req.body.marketing_consent,
    };

    // Validate required fields
    if (!input.email) {
      throw new AppError('VALIDATION_ERROR', 'Email is required');
    }
    if (!input.company_id) {
      throw new AppError('VALIDATION_ERROR', 'Company ID is required');
    }

    const customer = await customerService.createCustomer(input);
    sendSuccess(res, { customer }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/customers/:id
 * Update a customer with role-based access control
 *
 * Access Control:
 * - Guests can update their own contact fields (name, phone, marketing_consent) + property fields
 * - Property owners can only update property-owned fields (notes, tags, preferences)
 * - Property owners CANNOT update contact fields (rejected with 403)
 */
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== [CUSTOMER_CONTROLLER] Update customer request ===');
    const { id } = req.params;
    const userId = req.user!.id;

    if (!id) {
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    console.log('[CUSTOMER_CONTROLLER] Customer ID:', id);
    console.log('[CUSTOMER_CONTROLLER] User ID:', userId);
    console.log('[CUSTOMER_CONTROLLER] Request body:', JSON.stringify(req.body, null, 2));

    // Fetch customer to check ownership
    console.log('[CUSTOMER_CONTROLLER] Fetching customer to check ownership...');
    const customer = await customerService.getCustomer(id);
    console.log('[CUSTOMER_CONTROLLER] Customer user_id:', customer.user_id);

    // Check if user is the guest (owns this customer record)
    const isGuest = customer.user_id === userId;
    console.log('[CUSTOMER_CONTROLLER] Is guest?', isGuest);

    let input: UpdateCustomerInput;

    if (isGuest) {
      // Guest can update contact fields + property fields
      console.log('[CUSTOMER_CONTROLLER] Guest update - allowing contact fields');
      input = {
        full_name: req.body.full_name,
        phone: req.body.phone,
        marketing_consent: req.body.marketing_consent,
        notes: req.body.notes,
        tags: req.body.tags,
        preferred_room_types: req.body.preferred_room_types,
        special_requirements: req.body.special_requirements,
      };
    } else {
      // Property owner - check if trying to update contact fields
      const isUpdatingContactFields =
        req.body.full_name !== undefined ||
        req.body.phone !== undefined ||
        req.body.marketing_consent !== undefined;

      if (isUpdatingContactFields) {
        console.error('[CUSTOMER_CONTROLLER] Property owner attempted to update contact fields');
        console.error('[CUSTOMER_CONTROLLER] Attempted fields:', {
          full_name: req.body.full_name,
          phone: req.body.phone,
          marketing_consent: req.body.marketing_consent,
        });
        throw new AppError(
          'FORBIDDEN',
          'Contact details (name, phone, marketing consent) can only be updated by the guest. You can only update notes, tags, and preferences for this customer.'
        );
      }

      // Property owner can only update property-owned fields
      console.log('[CUSTOMER_CONTROLLER] Property owner update - restricted to property fields');
      input = {
        notes: req.body.notes,
        tags: req.body.tags,
        internal_notes: req.body.internal_notes,
        preferred_room_types: req.body.preferred_room_types,
        special_requirements: req.body.special_requirements,
        status: req.body.status,
        status_mode: req.body.status_mode,
        last_contact_date: req.body.last_contact_date,
      };
    }

    console.log('[CUSTOMER_CONTROLLER] Update input:', JSON.stringify(input, null, 2));
    const updatedCustomer = await customerService.updateCustomer(id, input);
    console.log('[CUSTOMER_CONTROLLER] Update successful:', updatedCustomer.id);

    sendSuccess(res, { customer: updatedCustomer });
  } catch (error) {
    console.error('[CUSTOMER_CONTROLLER] Update failed:', error);
    next(error);
  }
};

/**
 * DELETE /api/customers/:id
 * Soft delete a customer (set status to inactive)
 */
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    await customerService.deleteCustomer(id);
    sendSuccess(res, { message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/customers/:id/hard
 * Permanently delete a customer
 */
export const hardDeleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    await customerService.hardDeleteCustomer(id);
    sendSuccess(res, { message: 'Customer permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CUSTOMER ACTIONS
// ============================================================================

/**
 * GET /api/customers/:id/bookings
 * Get customer's booking history with pagination
 */
export const getCustomerBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!id) {
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    const result = await customerService.getCustomerBookings(id, page, limit);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customers/:id/sync-stats
 * Manually sync booking statistics for a customer
 */
export const syncCustomerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    const customer = await customerService.syncBookingStats(id);
    sendSuccess(res, { customer, message: 'Booking stats synced successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/customers/:id/conversations
 * Get customer's conversations scoped to their property
 *
 * Returns all conversations where:
 * - Customer is a participant (by user_id or email match)
 * - Conversation belongs to the customer's property (property isolation)
 * - Matches the archived filter (active vs archived)
 *
 * Query params:
 * - archived: boolean (default: false) - Filter active vs archived conversations
 */
export const getCustomerConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== [CUSTOMER_CONTROLLER] Get customer conversations request ===');
    const { id } = req.params;
    const archived = req.query.archived === 'true';

    console.log('[CUSTOMER_CONTROLLER] Customer ID:', id);
    console.log('[CUSTOMER_CONTROLLER] Archived filter:', archived);

    if (!id) {
      console.error('[CUSTOMER_CONTROLLER] Missing customer ID');
      throw new AppError('VALIDATION_ERROR', 'Customer ID is required');
    }

    console.log('[CUSTOMER_CONTROLLER] Calling service to fetch conversations...');
    const conversations = await customerService.getCustomerConversations(id, archived);
    console.log('[CUSTOMER_CONTROLLER] Conversations fetched:', conversations.length);

    sendSuccess(res, { conversations });
  } catch (error) {
    console.error('[CUSTOMER_CONTROLLER] Failed to get customer conversations:', error);
    next(error);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to parse array parameters from query string
 */
function parseArrayParam(param: any): string | string[] | undefined {
  if (!param) return undefined;
  if (Array.isArray(param)) return param;
  if (typeof param === 'string') {
    return param.includes(',') ? param.split(',').map((s) => s.trim()) : param;
  }
  return undefined;
}
