/**
 * Quote Request Controller
 *
 * HTTP request handlers for quote request endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as quoteRequestService from '../services/quote-request.service';
import { sendSuccess } from '../utils/response';

// ============================================================================
// CREATE QUOTE REQUEST (Public)
// ============================================================================

/**
 * POST /quote-requests
 * Create a new quote request (public endpoint - no auth required)
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== [QUOTE_REQUEST_CONTROLLER] create ===');
    console.log('[QUOTE_REQUEST_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const quoteRequest = await quoteRequestService.createQuoteRequest(req.body);

    console.log('[QUOTE_REQUEST_CONTROLLER] Success:', quoteRequest.id);
    sendSuccess(
      res,
      quoteRequest,
      201,
      { message: 'Quote request submitted successfully. You will be notified when the property owner responds.' }
    );
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] Error:', error);
    next(error);
  }
};

// ============================================================================
// GET QUOTE REQUEST BY ID
// ============================================================================

/**
 * GET /quote-requests/:id
 * Get a single quote request by ID
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    console.log('[QUOTE_REQUEST_CONTROLLER] getById:', id);

    const quoteRequest = await quoteRequestService.getQuoteRequest(id);
    sendSuccess(res, quoteRequest);
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] getById error:', error);
    next(error);
  }
};

// ============================================================================
// LIST QUOTE REQUESTS
// ============================================================================

/**
 * GET /quote-requests
 * List quote requests with filters (property owner only)
 */
export const list = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    console.log('[QUOTE_REQUEST_CONTROLLER] list for user:', userId);

    const params = {
      property_id: req.query.property_id as string,
      company_id: req.query.company_id as string,
      status: req.query.status as any,
      group_type: req.query.group_type as any,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    console.log('[QUOTE_REQUEST_CONTROLLER] Params:', params);

    const result = await quoteRequestService.listQuoteRequests(userId, params);

    console.log('[QUOTE_REQUEST_CONTROLLER] Found', result.total, 'quotes');
    sendSuccess(res, result);
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] list error:', error);
    next(error);
  }
};

// ============================================================================
// RESPOND TO QUOTE REQUEST
// ============================================================================

/**
 * POST /quote-requests/:id/respond
 * Respond to a quote request (property owner only)
 */
export const respond = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    console.log('[QUOTE_REQUEST_CONTROLLER] respond:', id, 'by user:', userId);
    console.log('[QUOTE_REQUEST_CONTROLLER] Response:', req.body);

    const quoteRequest = await quoteRequestService.respondToQuoteRequest(
      id,
      req.body,
      userId
    );

    console.log('[QUOTE_REQUEST_CONTROLLER] Response sent successfully');
    sendSuccess(
      res,
      quoteRequest,
      200,
      { message: 'Response sent successfully. The guest has been notified.' }
    );
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] respond error:', error);
    next(error);
  }
};

// ============================================================================
// UPDATE QUOTE STATUS
// ============================================================================

/**
 * PATCH /quote-requests/:id/status
 * Update quote request status (property owner only)
 */
export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    console.log('[QUOTE_REQUEST_CONTROLLER] updateStatus:', id);
    console.log('[QUOTE_REQUEST_CONTROLLER] Updates:', req.body);

    const quoteRequest = await quoteRequestService.updateQuoteRequestStatus(
      id,
      req.body,
      userId
    );

    console.log('[QUOTE_REQUEST_CONTROLLER] Status updated successfully');
    sendSuccess(res, quoteRequest, 200, { message: 'Quote updated successfully' });
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] updateStatus error:', error);
    next(error);
  }
};

// ============================================================================
// GET STATISTICS
// ============================================================================

/**
 * GET /quote-requests/stats
 * Get quote request statistics (property owner only)
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const propertyId = req.query.property_id as string | undefined;

    console.log('[QUOTE_REQUEST_CONTROLLER] getStats for user:', userId, 'property:', propertyId);

    const stats = await quoteRequestService.getQuoteRequestStats(userId, propertyId);

    console.log('[QUOTE_REQUEST_CONTROLLER] Stats calculated:', stats);
    sendSuccess(res, stats);
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] getStats error:', error);
    next(error);
  }
};

// ============================================================================
// CONVERT TO BOOKING
// ============================================================================

/**
 * POST /quote-requests/:id/convert
 * Mark quote as converted to booking (property owner only)
 */
export const convertToBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { booking_id } = req.body;
    const userId = req.user!.id;

    console.log('[QUOTE_REQUEST_CONTROLLER] convertToBooking:', id, '→', booking_id);

    await quoteRequestService.convertQuoteToBooking(id, booking_id, userId);

    console.log('[QUOTE_REQUEST_CONTROLLER] Conversion successful');
    sendSuccess(res, { quote_id: id, booking_id }, 200, { message: 'Quote converted to booking successfully' });
  } catch (error) {
    console.error('[QUOTE_REQUEST_CONTROLLER] convertToBooking error:', error);
    next(error);
  }
};
