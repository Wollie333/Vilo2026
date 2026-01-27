import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { sendNotification } from './notifications.service';
import { refundPaystackTransaction, refundPayPalTransaction } from './payment.service';
import { logger } from '../utils/logger';
import {
  sendRefundRequestedEmailToAdmin,
  sendRefundApprovedEmailToGuest,
  sendRefundRejectedEmailToGuest,
  sendRefundCompletedEmailToGuest
} from './refund-emails.service';
import type {
  RefundRequest,
  RefundRequestWithDetails,
  RefundCalculation,
  CreateRefundRequestDTO,
  ApproveRefundDTO,
  RejectRefundDTO,
  ProcessRefundResult,
  MarkManualRefundCompleteDTO,
  RetryFailedRefundResult,
  RefundListParams,
  RefundListResponse,
  RefundStatusSummary,
  RefundEligibilityResult,
  RefundBreakdownItem,
  RefundComment,
  CreateRefundCommentRequest,
  RefundStatusHistory,
  RefundActivity,
  RefundDocument,
  UploadRefundDocumentDTO,
  RefundDocumentType,
} from '../types/refund.types';
import type { BookingWithDetails, BookingPayment, RefundStatus } from '../types/booking.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all admin user IDs for a property
 */
async function getPropertyAdminIds(propertyId: string): Promise<string[]> {
  const supabase = getAdminClient();

  const { data: admins } = await supabase
    .from('company_team_members')
    .select('user_id')
    .eq('property_id', propertyId)
    .in('role', ['admin', 'manager'])
    .eq('status', 'active');

  return admins?.map((a) => a.user_id) || [];
}

// ============================================================================
// REFUND REQUEST MANAGEMENT
// ============================================================================

/**
 * Calculate suggested refund amount based on cancellation policy
 */
export const calculateSuggestedRefund = async (
  bookingId: string
): Promise<RefundCalculation> => {
  const supabase = getAdminClient();

  try {
    // Call database function to calculate refund
    const { data, error } = await supabase.rpc('calculate_refund_amount', {
      p_booking_id: bookingId,
      p_requested_date: new Date().toISOString(),
    });

    if (error) {
      logger.error('Error calculating suggested refund:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to calculate refund amount');
    }

    if (!data || data.length === 0) {
      throw new AppError('NOT_FOUND', 'Booking not found or ineligible for refund');
    }

    return data[0] as RefundCalculation;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in calculateSuggestedRefund:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to calculate suggested refund');
  }
};

/**
 * Validate refund eligibility for a booking
 */
export const validateRefundEligibility = async (
  bookingId: string
): Promise<RefundEligibilityResult> => {
  const supabase = getAdminClient();

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, payment_status, amount_paid, total_refunded')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return { eligible: false, reason: 'Booking not found' };
  }

  // Check payment status
  if (booking.payment_status !== 'paid' && booking.payment_status !== 'partial') {
    return { eligible: false, reason: 'Booking must be paid or partially paid to request refund' };
  }

  // Check available amount for refund
  const availableForRefund = (booking.amount_paid || 0) - (booking.total_refunded || 0);
  if (availableForRefund <= 0) {
    return { eligible: false, reason: 'No amount available for refund' };
  }

  // Check for existing active refund requests
  const { data: activeRequests, error: activeError } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('booking_id', bookingId)
    .in('status', ['requested', 'under_review', 'approved', 'processing']);

  if (activeError) {
    logger.error('Error checking active refund requests:', { message: activeError.message, code: activeError.code });
    throw new AppError('INTERNAL_ERROR', 'Failed to validate refund eligibility');
  }

  if (activeRequests && activeRequests.length > 0) {
    return {
      eligible: false,
      reason: 'An active refund request already exists for this booking',
      existing_active_requests: activeRequests as RefundRequest[],
    };
  }

  return {
    eligible: true,
    available_for_refund: availableForRefund,
  };
};

/**
 * Create a new refund request
 */
export const createRefundRequest = async (
  bookingId: string,
  userId: string,
  input: CreateRefundRequestDTO
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  // Validate eligibility
  const eligibility = await validateRefundEligibility(bookingId);
  if (!eligibility.eligible) {
    throw new AppError('VALIDATION_ERROR', eligibility.reason || 'Not eligible for refund');
  }

  // Validate requested amount
  if (input.requested_amount <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Refund amount must be greater than zero');
  }

  if (
    eligibility.available_for_refund &&
    input.requested_amount > eligibility.available_for_refund
  ) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Refund amount cannot exceed available amount: ${eligibility.available_for_refund}`
    );
  }

  // Calculate suggested refund based on policy
  const calculation = await calculateSuggestedRefund(bookingId);

  // Get booking details with guest and property information
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      currency,
      property_id,
      guest_id,
      guest:users!bookings_guest_id_fkey(
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // Get property details
  const { data: property } = await supabase
    .from('properties')
    .select('id, name, cancellation_policy, owner_id')
    .eq('id', booking.property_id)
    .single();

  // Create refund request
  const { data: refundRequest, error: createError } = await supabase
    .from('refund_requests')
    .insert({
      booking_id: bookingId,
      requested_amount: input.requested_amount,
      refunded_amount: 0,
      currency: booking.currency,
      status: 'requested',
      reason: input.reason,
      requested_by: userId,
      requested_at: new Date().toISOString(),
      suggested_amount: calculation.suggested_amount,
      cancellation_policy: property?.cancellation_policy || 'moderate',
      calculated_policy_amount: calculation.policy_amount,
      refund_breakdown: [],
    })
    .select()
    .single();

  if (createError || !refundRequest) {
    logger.error('Error creating refund request:', { message: createError.message, code: createError.code });
    throw new AppError('INTERNAL_ERROR', 'Failed to create refund request');
  }

  // Create audit log
  await createAuditLog(
    'refund_request.created',
    'refund_requests',
    refundRequest.id,
    userId,
    null,
    refundRequest
  );

  // Send notification to property owner and admins
  if (property) {
    const adminIds = await getPropertyAdminIds(property.id);
    const recipientIds = [property.owner_id, ...adminIds].filter(Boolean);

    if (recipientIds.length > 0) {
      await sendNotification({
        template_key: 'refund_requested',
        recipient_ids: recipientIds,
        data: {
          refund_reference: refundRequest.id.slice(0, 8),
          booking_reference: (booking as any).booking_reference || bookingId.slice(0, 8),
          booking_id: bookingId,
          guest_name: `${(booking as any).guest?.first_name || ''} ${(booking as any).guest?.last_name || ''}`.trim() || 'Guest',
          guest_email: (booking as any).guest?.email || '',
          property_name: property.name,
          requested_amount: `${refundRequest.currency} ${refundRequest.requested_amount}`,
          reason: refundRequest.reason,
          dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:5173',
        },
        priority: 'high',
      }).catch((error) => {
        logger.error('Failed to send refund requested notification:', error);
        // Don't throw - notification failure shouldn't block refund creation
      });
    }

    // Send email to admin
    const { data: ownerUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', property.owner_id)
      .single();

    if (ownerUser?.email) {
      await sendRefundRequestedEmailToAdmin({
        adminEmail: ownerUser.email,
        guestName: `${(booking as any).guest?.first_name || ''} ${(booking as any).guest?.last_name || ''}`.trim() || 'Guest',
        bookingReference: (booking as any).booking_reference || bookingId.slice(0, 8),
        refundAmount: refundRequest.requested_amount,
        currency: refundRequest.currency,
        reason: refundRequest.reason,
        refundId: refundRequest.id,
      }).catch((error) => {
        logger.error('Failed to send refund requested email:', error);
      });
    }
  }

  logger.info(`Refund request created: ${refundRequest.id} for booking ${bookingId}`);

  return refundRequest as RefundRequest;
};

/**
 * Withdraw a refund request
 * Users can withdraw their own refund requests if the status allows it
 */
export const withdrawRefundRequest = async (
  refundId: string,
  userId: string
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  // Get existing refund request with booking and property details
  const { data: existingRefund, error: fetchError } = await supabase
    .from('refund_requests')
    .select(`
      *,
      booking:bookings(
        id,
        property_id,
        booking_reference,
        property:properties(id, name, owner_id)
      )
    `)
    .eq('id', refundId)
    .single();

  if (fetchError || !existingRefund) {
    throw new AppError('NOT_FOUND', 'Refund request not found');
  }

  // Verify user owns this refund request
  if (existingRefund.requested_by !== userId) {
    throw new AppError(
      'FORBIDDEN',
      'You can only withdraw your own refund requests'
    );
  }

  // Check if withdrawal is allowed based on current status
  const allowedStatuses: RefundStatus[] = ['requested', 'under_review', 'approved'];
  if (!allowedStatuses.includes(existingRefund.status)) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Cannot withdraw refund request with status: ${existingRefund.status}. Withdrawal is only allowed for requests that are: requested, under review, or approved (before processing).`
    );
  }

  // Update status to withdrawn
  const { data: updatedRefund, error: updateError } = await supabase
    .from('refund_requests')
    .update({
      status: 'withdrawn',
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundId)
    .select()
    .single();

  if (updateError || !updatedRefund) {
    logger.error('Error withdrawing refund request:', { message: updateError.message, code: updateError.code });
    throw new AppError('INTERNAL_ERROR', 'Failed to withdraw refund request');
  }

  // Create audit log
  await createAuditLog(
    'refund_request.withdrawn',
    'refund_requests',
    refundId,
    userId,
    { status: existingRefund.status },
    { status: 'withdrawn' }
  );

  // Send notification to property owner and admins about cancellation
  const booking = existingRefund.booking as any;
  const property = booking?.property;

  if (property) {
    const adminIds = await getPropertyAdminIds(booking.property_id);
    const recipientIds = [property.owner_id, ...adminIds, userId].filter(Boolean);

    if (recipientIds.length > 0) {
      await sendNotification({
        template_key: 'refund_cancelled',
        recipient_ids: recipientIds,
        data: {
          booking_reference: booking.booking_reference || booking.id.slice(0, 8),
          booking_id: booking.id,
          property_name: property.name,
          cancellation_reason: 'Refund request withdrawn by guest',
          portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
          dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:5173',
        },
        priority: 'normal',
      }).catch((error) => {
        logger.error('Failed to send refund cancelled notification:', error);
      });
    }
  }

  logger.info(`Refund request withdrawn: ${refundId} by user ${userId}`);

  return updatedRefund as RefundRequest;
};

/**
 * Get refund request by ID
 */
export const getRefundRequestById = async (
  id: string,
  userId?: string
): Promise<RefundRequestWithDetails> => {
  const supabase = getAdminClient();

  const { data: refundRequest, error } = await supabase
    .from('refund_requests')
    .select(
      `
      *,
      booking:bookings (
        id,
        booking_reference,
        property_id,
        guest_name,
        guest_email,
        check_in_date,
        check_out_date,
        total_amount,
        amount_paid,
        total_refunded,
        payment_status,
        booking_status
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !refundRequest) {
    throw new AppError('NOT_FOUND', 'Refund request not found');
  }

  // TODO: Add RLS check if userId provided

  return refundRequest as unknown as RefundRequestWithDetails;
};

/**
 * List refund requests with filters
 */
export const listRefundRequests = async (
  params: RefundListParams,
  userId?: string
): Promise<RefundListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  // If property_id or search is provided, we need to get booking IDs first
  let bookingIds: string[] | null = null;

  if (params.property_id || params.search) {
    let bookingQuery = supabase
      .from('bookings')
      .select('id');

    if (params.property_id) {
      bookingQuery = bookingQuery.eq('property_id', params.property_id);
    }

    if (params.search) {
      bookingQuery = bookingQuery.or(
        `booking_reference.ilike.%${params.search}%,` +
        `guest_name.ilike.%${params.search}%,` +
        `guest_email.ilike.%${params.search}%`
      );
    }

    const { data: bookings } = await bookingQuery;
    bookingIds = bookings?.map((b) => b.id) || [];

    // If no bookings match, return empty result
    if (bookingIds.length === 0) {
      return {
        refunds: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  let query = supabase
    .from('refund_requests')
    .select(
      `
      *,
      booking:bookings (
        id,
        booking_reference,
        property_id,
        guest_name,
        guest_email,
        check_in_date,
        check_out_date,
        total_amount,
        amount_paid,
        total_refunded,
        payment_status,
        booking_status,
        property:properties (
          id,
          name,
          featured_image_url
        ),
        booking_rooms (
          room:rooms (
            id,
            name,
            room_code,
            gallery_images
          )
        )
      )
    `,
      { count: 'exact' }
    );

  // Apply filters
  if (params.status) {
    if (Array.isArray(params.status)) {
      query = query.in('status', params.status);
    } else {
      query = query.eq('status', params.status);
    }
  }

  if (params.booking_id) {
    query = query.eq('booking_id', params.booking_id);
  }

  // Filter by booking IDs if we pre-filtered by property or search
  if (bookingIds !== null) {
    query = query.in('booking_id', bookingIds);
  }

  if (params.requested_by) {
    query = query.eq('requested_by', params.requested_by);
  }

  // If userId is provided and no explicit requested_by filter, filter by user
  // This ensures non-admin users only see their own refunds
  if (userId && !params.requested_by) {
    query = query.eq('requested_by', userId);
  }

  if (params.from_date) {
    query = query.gte('requested_at', params.from_date);
  }

  if (params.to_date) {
    query = query.lte('requested_at', params.to_date);
  }

  if (params.min_amount) {
    query = query.gte('requested_amount', params.min_amount);
  }

  if (params.max_amount) {
    query = query.lte('requested_amount', params.max_amount);
  }

  // Sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error('Error listing refund requests', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      userId,
      params: JSON.stringify(params)
    });
    throw new AppError('INTERNAL_ERROR', `Failed to list refund requests: ${error.message}`);
  }

  return {
    refunds: (data || []) as unknown as RefundRequestWithDetails[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

/**
 * Get all refund requests for a specific user
 * Used by super admin to view all user's refund requests
 */
export const getRefundsByUser = async (
  userId: string,
  params?: Omit<RefundListParams, 'requested_by'>
): Promise<RefundListResponse> => {
  // Call listRefundRequests with requested_by set to userId
  return listRefundRequests({
    ...params,
    requested_by: userId,
  });
};

// ============================================================================
// ADMIN APPROVAL WORKFLOW
// ============================================================================

/**
 * Approve a refund request
 * Handles separate internal and customer notes via comment system
 */
export const approveRefund = async (
  id: string,
  userId: string,
  input: ApproveRefundDTO
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  // Get refund request
  const refundRequest = await getRefundRequestById(id);

  if (refundRequest.status !== 'requested' && refundRequest.status !== 'under_review') {
    throw new AppError('VALIDATION_ERROR', 'Only requested or under_review refunds can be approved');
  }

  // Determine approved amount
  const approvedAmount = input.approved_amount || refundRequest.requested_amount;

  // Validate approved amount
  if (approvedAmount > refundRequest.requested_amount) {
    throw new AppError('VALIDATION_ERROR', 'Approved amount cannot exceed requested amount');
  }

  if (approvedAmount <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Approved amount must be greater than zero');
  }

  // Update refund request (status transition validated by database trigger)
  const { data: updated, error } = await supabase
    .from('refund_requests')
    .update({
      status: 'approved',
      approved_amount: approvedAmount,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    logger.error('Error approving refund:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to approve refund request');
  }

  // Add change_reason to status history (with deduplication)
  if (input.change_reason) {
    // Check if trigger already created entry (within last 5 seconds)
    const { data: existingHistory } = await supabase
      .from('refund_status_history')
      .select('id')
      .eq('refund_request_id', id)
      .eq('to_status', 'approved')
      .gte('changed_at', new Date(Date.now() - 5000).toISOString())
      .single();

    if (existingHistory) {
      // Update existing entry with reason
      await supabase
        .from('refund_status_history')
        .update({ change_reason: input.change_reason })
        .eq('id', existingHistory.id);
    } else {
      // Create new entry (fallback, shouldn't happen due to trigger)
      await supabase
        .from('refund_status_history')
        .insert({
          refund_request_id: id,
          from_status: refundRequest.status,
          to_status: 'approved',
          changed_by: userId,
          change_reason: input.change_reason,
        });
    }
  }

  // Add internal notes as internal comment (if provided)
  if (input.internal_notes && input.internal_notes.trim()) {
    await addRefundComment(id, userId, {
      comment_text: input.internal_notes,
      is_internal: true,
    });
  }

  // Add customer notes as public comment (if provided)
  if (input.customer_notes && input.customer_notes.trim()) {
    await addRefundComment(id, userId, {
      comment_text: input.customer_notes,
      is_internal: false,
    });
  }

  // Create audit log
  await createAuditLog(
    'refund_request.approved',
    'refund_requests',
    id,
    userId,
    refundRequest,
    updated
  );

  // Send notification to guest about approval
  // Fetch booking and property details for notification
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest:users!bookings_guest_id_fkey(
        id,
        email,
        first_name,
        last_name
      ),
      property:properties(id, name)
    `)
    .eq('id', refundRequest.booking_id)
    .single();

  if (booking) {
    await sendNotification({
      template_key: 'refund_approved',
      recipient_ids: [refundRequest.requested_by!],
      data: {
        booking_reference: (booking as any).booking_reference || booking.id.slice(0, 8),
        booking_id: booking.id,
        approved_amount: `${updated.currency} ${approvedAmount}`,
        property_name: (booking as any).property?.name || 'Property',
        admin_notes: input.customer_notes || '',
        portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
      },
      priority: 'high',
    }).catch((error) => {
      logger.error('Failed to send refund approved notification:', error);
    });

    // Send email to guest
    const guest = (booking as any).guest;
    if (guest?.email) {
      await sendRefundApprovedEmailToGuest({
        guestEmail: guest.email,
        guestName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || 'Guest',
        bookingReference: (booking as any).booking_reference || booking.id.slice(0, 8),
        approvedAmount: approvedAmount,
        currency: updated.currency,
        refundId: id,
      }).catch((error) => {
        logger.error('Failed to send refund approved email:', error);
      });
    }
  }

  logger.info(`Refund request ${id} approved by ${userId} (amount: ${approvedAmount})`);

  return updated as RefundRequest;
};

/**
 * Reject a refund request
 * Requires customer-facing notes to explain rejection
 */
export const rejectRefund = async (
  id: string,
  userId: string,
  input: RejectRefundDTO
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  // Validate that customer notes are provided (REQUIRED for rejection)
  if (!input.customer_notes || input.customer_notes.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Customer notes are required when rejecting a refund');
  }

  // Get refund request
  const refundRequest = await getRefundRequestById(id);

  if (refundRequest.status !== 'requested' && refundRequest.status !== 'under_review') {
    throw new AppError('VALIDATION_ERROR', 'Only requested or under_review refunds can be rejected');
  }

  // Update refund request (status transition validated by database trigger)
  const { data: updated, error } = await supabase
    .from('refund_requests')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !updated) {
    logger.error('Error rejecting refund:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to reject refund request');
  }

  // Add change_reason to status history (with deduplication)
  if (input.change_reason) {
    // Check if trigger already created entry (within last 5 seconds)
    const { data: existingHistory } = await supabase
      .from('refund_status_history')
      .select('id')
      .eq('refund_request_id', id)
      .eq('to_status', 'rejected')
      .gte('changed_at', new Date(Date.now() - 5000).toISOString())
      .single();

    if (existingHistory) {
      // Update existing entry with reason
      await supabase
        .from('refund_status_history')
        .update({ change_reason: input.change_reason })
        .eq('id', existingHistory.id);
    } else {
      // Create new entry (fallback, shouldn't happen due to trigger)
      await supabase
        .from('refund_status_history')
        .insert({
          refund_request_id: id,
          from_status: refundRequest.status,
          to_status: 'rejected',
          changed_by: userId,
          change_reason: input.change_reason,
        });
    }
  }

  // Add internal notes as internal comment (if provided)
  if (input.internal_notes && input.internal_notes.trim()) {
    await addRefundComment(id, userId, {
      comment_text: input.internal_notes,
      is_internal: true,
    });
  }

  // Add customer notes as public comment (REQUIRED - already validated above)
  await addRefundComment(id, userId, {
    comment_text: input.customer_notes,
    is_internal: false,
  });

  // Create audit log
  await createAuditLog(
    'refund_request.rejected',
    'refund_requests',
    id,
    userId,
    refundRequest,
    updated
  );

  // Send notification to guest about rejection
  // Fetch booking and property details for notification
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      guest:users!bookings_guest_id_fkey(
        id,
        email,
        first_name,
        last_name
      ),
      property:properties(id, name)
    `)
    .eq('id', refundRequest.booking_id)
    .single();

  if (booking) {
    await sendNotification({
      template_key: 'refund_rejected',
      recipient_ids: [refundRequest.requested_by!],
      data: {
        booking_reference: (booking as any).booking_reference || booking.id.slice(0, 8),
        booking_id: booking.id,
        property_name: (booking as any).property?.name || 'Property',
        rejection_reason: input.customer_notes,
        portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
      },
      priority: 'high',
    }).catch((error) => {
      logger.error('Failed to send refund rejected notification:', error);
    });

    // Send email to guest
    const guest = (booking as any).guest;
    if (guest?.email) {
      await sendRefundRejectedEmailToGuest({
        guestEmail: guest.email,
        guestName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || 'Guest',
        bookingReference: (booking as any).booking_reference || booking.id.slice(0, 8),
        rejectionReason: input.customer_notes,
        refundId: id,
      }).catch((error) => {
        logger.error('Failed to send refund rejected email:', error);
      });
    }
  }

  logger.info(`Refund request ${id} rejected by ${userId}`);

  return updated as RefundRequest;
};

// ============================================================================
// REFUND PROCESSING
// ============================================================================

/**
 * Calculate refund breakdown (proportional to payment methods)
 */
export const calculateRefundBreakdown = async (
  bookingId: string,
  approvedAmount: number
): Promise<RefundBreakdownItem[]> => {
  const supabase = getAdminClient();

  // Get all completed/verified payments for this booking
  const { data: payments, error } = await supabase
    .from('booking_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .in('status', ['completed', 'verified'])
    .order('paid_at', { ascending: true });

  if (error || !payments || payments.length === 0) {
    throw new AppError('NOT_FOUND', 'No completed payments found for this booking');
  }

  // Calculate total paid
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate breakdown proportionally
  const breakdown: RefundBreakdownItem[] = [];
  let remainingToRefund = approvedAmount;

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i] as BookingPayment;
    const isLast = i === payments.length - 1;

    // Calculate proportional amount (use remaining for last to avoid rounding issues)
    const proportionalAmount = isLast
      ? remainingToRefund
      : Math.round((payment.amount / totalPaid) * approvedAmount * 100) / 100;

    breakdown.push({
      payment_id: payment.id,
      method: payment.payment_method,
      amount: proportionalAmount,
      gateway_refund_id: null,
      status: payment.payment_method === 'paystack' || payment.payment_method === 'paypal'
        ? 'pending'
        : 'manual_pending',
      processed_at: null,
      error_message: null,
    });

    remainingToRefund -= proportionalAmount;
  }

  return breakdown;
};

/**
 * Process refund (automatic + manual)
 */
export const processRefund = async (
  refundRequestId: string,
  userId: string
): Promise<ProcessRefundResult> => {
  const supabase = getAdminClient();

  // Get refund request with booking details
  const refundRequest = await getRefundRequestById(refundRequestId);

  if (refundRequest.status !== 'approved') {
    throw new AppError('VALIDATION_ERROR', 'Only approved refunds can be processed');
  }

  if (!refundRequest.approved_amount) {
    throw new AppError('VALIDATION_ERROR', 'Approved amount not set');
  }

  // Calculate refund breakdown
  const breakdown = await calculateRefundBreakdown(
    refundRequest.booking_id,
    refundRequest.approved_amount
  );

  // Update status to processing
  await supabase
    .from('refund_requests')
    .update({
      status: 'processing',
      processed_by: userId,
      processed_at: new Date().toISOString(),
      refund_breakdown: breakdown,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundRequestId);

  // Get booking and property details for notification
  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      property:properties(name, owner_id)
    `)
    .eq('id', refundRequest.booking_id)
    .single();

  // Send processing started notification
  if (booking?.property) {
    const adminIds = await getPropertyAdminIds((booking.property as any)?.owner_id);
    const recipientIds = [
      refundRequest.requested_by,
      (booking.property as any)?.owner_id,
      ...adminIds,
    ].filter(Boolean);

    await sendNotification({
      template_key: 'refund_processing_started',
      recipient_ids: recipientIds,
      data: {
        refund_reference: refundRequest.id.slice(0, 8),
        booking_reference: booking.booking_reference || refundRequest.booking_id.slice(0, 8),
        booking_id: refundRequest.booking_id,
        refund_amount: `${refundRequest.currency} ${refundRequest.approved_amount || 0}`,
        property_name: (booking.property as any)?.name,
        dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:5173',
        portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
      },
      priority: 'normal',
    }).catch((error) => {
      logger.error('Failed to send refund processing started notification:', error);
    });
  }

  // Process each payment method
  const errors: Array<{ payment_id: string; error: string }> = [];
  let successCount = 0;

  for (const item of breakdown) {
    if (item.method === 'paystack' || item.method === 'paypal') {
      // Automatic processing via gateway
      try {
        // Fetch the payment record to get gateway reference
        const { data: payment, error: paymentError } = await supabase
          .from('booking_payments')
          .select('*')
          .eq('id', item.payment_id)
          .single();

        if (paymentError || !payment) {
          throw new Error('Payment record not found');
        }

        let result;

        if (item.method === 'paystack') {
          // Process Paystack refund
          if (!payment.gateway_reference) {
            throw new Error('Missing Paystack transaction reference');
          }

          result = await refundPaystackTransaction(
            payment.gateway_reference,
            item.amount,
            refundRequest.currency,
            refundRequest.reason || 'Customer refund request'
          );
        } else if (item.method === 'paypal') {
          // Process PayPal refund
          if (!payment.payment_reference) {
            throw new Error('Missing PayPal capture ID');
          }

          result = await refundPayPalTransaction(
            payment.payment_reference,
            item.amount,
            refundRequest.currency,
            refundRequest.reason || 'Customer refund request'
          );
        }

        // Update item based on result
        if (result && result.success) {
          item.status = 'processing';
          item.gateway_refund_id = result.refund_id || null;
          item.processed_at = new Date().toISOString();
          successCount++;
          logger.info(`Gateway refund initiated for ${item.payment_id}: ${result.refund_id || 'pending'}`);
        } else {
          item.status = 'failed';
          item.error_message = result?.error || 'Gateway refund failed';
          errors.push({ payment_id: item.payment_id, error: item.error_message });
          logger.error(`Gateway refund failed for ${item.payment_id}: ${result?.error}`);
        }
      } catch (error: any) {
        item.status = 'failed';
        item.error_message = error.message || 'Gateway refund failed';
        errors.push({ payment_id: item.payment_id, error: item.error_message });
        logger.error(`Gateway refund failed for ${item.payment_id}:`, error);
      }
    } else {
      // Manual processing required (EFT, cash, etc.)
      item.status = 'manual_pending';
      logger.info(`Manual refund required for ${item.payment_id} (${item.method})`);
    }
  }

  // Update refund breakdown
  await supabase
    .from('refund_requests')
    .update({
      refund_breakdown: breakdown,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundRequestId);

  // Determine final status
  const allCompleted = breakdown.every(item => item.status === 'completed');
  const anyFailed = breakdown.some(item => item.status === 'failed');
  const hasManualPending = breakdown.some(item => item.status === 'manual_pending');

  let finalStatus: string = 'processing';
  if (allCompleted) {
    finalStatus = 'completed';
    // TODO: Generate credit memo
    // TODO: Update booking refund status
  } else if (anyFailed && !hasManualPending) {
    finalStatus = 'failed';
  }

  // Update final status
  const { data: finalRefundRequest } = await supabase
    .from('refund_requests')
    .update({
      status: finalStatus,
      auto_process_failed: errors.length > 0,
      failure_reason: errors.length > 0 ? errors.map(e => e.error).join('; ') : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundRequestId)
    .select()
    .single();

  // Create audit log
  await createAuditLog(
    'refund_request.processed',
    'refund_requests',
    refundRequestId,
    userId,
    refundRequest,
    finalRefundRequest
  );

  // Send processing completed notification (only when successfully completed)
  if (finalStatus === 'completed' && booking?.property) {
    await sendNotification({
      template_key: 'refund_processing_completed',
      recipient_ids: [refundRequest.requested_by!],
      data: {
        refund_reference: refundRequest.id.slice(0, 8),
        booking_reference: booking.booking_reference || refundRequest.booking_id.slice(0, 8),
        booking_id: refundRequest.booking_id,
        refund_amount: `${refundRequest.currency} ${refundRequest.approved_amount || 0}`,
        property_name: (booking.property as any)?.name,
        portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
      },
      priority: 'high',
    }).catch((error) => {
      logger.error('Failed to send refund processing completed notification:', error);
    });
  }

  logger.info(`Refund ${refundRequestId} processing result: ${finalStatus}`);

  return {
    success: errors.length === 0,
    refund_request_id: refundRequestId,
    status: finalStatus as any,
    refund_breakdown: breakdown,
    errors: errors.length > 0 ? errors : undefined,
    message: allCompleted
      ? 'Refund processed successfully'
      : hasManualPending
      ? 'Refund requires manual completion'
      : 'Refund processing failed',
  };
};

/**
 * Mark manual refund as complete
 */
export const markManualRefundComplete = async (
  refundRequestId: string,
  userId: string,
  input: MarkManualRefundCompleteDTO
): Promise<RefundRequest> => {
  const supabase = getAdminClient();

  // Get refund request
  const { data: refundRequest, error: fetchError } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('id', refundRequestId)
    .single();

  if (fetchError || !refundRequest) {
    throw new AppError('NOT_FOUND', 'Refund request not found');
  }

  if (refundRequest.status !== 'processing') {
    throw new AppError('VALIDATION_ERROR', 'Only processing refunds can be marked as complete');
  }

  // Update manual_pending items to completed
  const breakdown = (refundRequest.refund_breakdown as RefundBreakdownItem[]) || [];
  const updatedBreakdown = breakdown.map(item => {
    if (item.status === 'manual_pending') {
      return {
        ...item,
        status: 'completed' as const,
        processed_at: new Date().toISOString(),
        gateway_refund_id: input.refund_reference,
      };
    }
    return item;
  });

  // Check if all items are now completed
  const allCompleted = updatedBreakdown.every(item => item.status === 'completed');

  // Update refund request
  const { data: updated, error: updateError } = await supabase
    .from('refund_requests')
    .update({
      status: allCompleted ? 'completed' : 'processing',
      refund_breakdown: updatedBreakdown,
      refunded_amount: allCompleted ? refundRequest.approved_amount : refundRequest.refunded_amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', refundRequestId)
    .select()
    .single();

  if (updateError || !updated) {
    logger.error('Error marking manual refund complete:', { message: updateError.message, code: updateError.code });
    throw new AppError('INTERNAL_ERROR', 'Failed to mark refund as complete');
  }

  if (allCompleted) {
    // TODO: Generate credit memo
    // TODO: Update booking refund status
    logger.info(`Refund ${refundRequestId} completed`);

    // Send completion email to guest
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        guest:users!bookings_guest_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', refundRequest.booking_id)
      .single();

    if (booking) {
      const guest = (booking as any).guest;
      if (guest?.email) {
        await sendRefundCompletedEmailToGuest({
          guestEmail: guest.email,
          guestName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || 'Guest',
          bookingReference: (booking as any).booking_reference || booking.id.slice(0, 8),
          refundedAmount: refundRequest.approved_amount,
          currency: refundRequest.currency,
          refundId: refundRequestId,
        }).catch((error) => {
          logger.error('Failed to send refund completed email:', error);
        });
      }
    }
  }

  // Create audit log
  await createAuditLog(
    'refund_request.manual_completed',
    'refund_requests',
    refundRequestId,
    userId,
    refundRequest,
    updated
  );

  return updated as RefundRequest;
};

/**
 * Get refund status summary for a booking
 */
export const getRefundStatus = async (bookingId: string): Promise<RefundStatusSummary> => {
  const supabase = getAdminClient();

  // Get booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('amount_paid, total_refunded, refund_status')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new AppError('NOT_FOUND', 'Booking not found');
  }

  // Get all refund requests
  const { data: refunds, error: refundsError } = await supabase
    .from('refund_requests')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (refundsError) {
    logger.error('Error fetching refunds:', { message: refundsError.message, code: refundsError.code });
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch refund status');
  }

  const allRefunds = (refunds || []) as RefundRequest[];
  const pendingRefunds = allRefunds.filter(r =>
    ['requested', 'under_review', 'approved', 'processing'].includes(r.status)
  );
  const completedRefunds = allRefunds.filter(r => r.status === 'completed');

  return {
    booking_id: bookingId,
    total_paid: booking.amount_paid || 0,
    total_refunded: booking.total_refunded || 0,
    available_for_refund: (booking.amount_paid || 0) - (booking.total_refunded || 0),
    refund_status: (booking.refund_status as 'none' | 'partial' | 'full') || 'none',
    active_refund_requests: pendingRefunds.length,
    pending_refund_requests: pendingRefunds,
    completed_refund_requests: completedRefunds,
  };
};

/**
 * Update booking refund status
 */
export const updateBookingRefundStatus = async (bookingId: string): Promise<void> => {
  const supabase = getAdminClient();

  // Get all completed refunds
  const { data: completedRefunds, error: refundsError } = await supabase
    .from('refund_requests')
    .select('refunded_amount')
    .eq('booking_id', bookingId)
    .eq('status', 'completed');

  if (refundsError) {
    logger.error('Error fetching completed refunds:', { message: refundsError.message, code: refundsError.code });
    return;
  }

  const totalRefunded = (completedRefunds || []).reduce(
    (sum, r) => sum + (r.refunded_amount || 0),
    0
  );

  // Get booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('amount_paid')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  // Determine refund status
  let refundStatus: 'none' | 'partial' | 'full' = 'none';
  if (totalRefunded > 0) {
    refundStatus = totalRefunded >= (booking.amount_paid || 0) ? 'full' : 'partial';
  }

  // Update booking
  await supabase
    .from('bookings')
    .update({
      total_refunded: totalRefunded,
      refund_status: refundStatus,
      payment_status: refundStatus === 'full' ? 'refunded' : booking.amount_paid,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  logger.info(`Updated booking ${bookingId} refund status: ${refundStatus}, total: ${totalRefunded}`);
};

// ============================================================================
// REFUND COMMENT SYSTEM (Migration 045)
// Two-way commenting between users and admins
// ============================================================================

/**
 * Add a comment to a refund request
 */
export const addRefundComment = async (
  refundId: string,
  userId: string,
  data: CreateRefundCommentRequest
): Promise<RefundComment> => {
  const supabase = getAdminClient();

  // 1. Verify refund exists and user has access
  const refund = await getRefundRequestById(refundId);

  // 2. Get user details to determine if comment should be internal
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  // 3. Determine if comment should be internal (only admins can create internal comments)
  const isInternal = data.is_internal && ['admin', 'super_admin'].includes(user.user_type);

  // 4. Insert comment
  const { data: comment, error } = await supabase
    .from('refund_comments')
    .insert({
      refund_request_id: refundId,
      user_id: userId,
      comment_text: data.comment_text,
      is_internal: isInternal,
    })
    .select(`
      *,
      user:users(id, first_name, last_name, user_type, profile_picture_url)
    `)
    .single();

  if (error) {
    logger.error('Error adding refund comment:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to add comment');
  }

  // 5. Comment count and last_comment_at are automatically updated by database trigger

  // 6. Send notification to relevant parties
  // Only send notifications for non-internal comments
  if (!isInternal) {
    // Fetch booking and property details for notifications
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        property_id,
        property:properties(id, name, owner_id)
      `)
      .eq('id', refund.booking_id)
      .single();

    const isAdmin = ['admin', 'super_admin', 'property_manager', 'saas_team_member'].includes(user.user_type);
    const isGuest = !isAdmin;

    if (booking) {
      const userName = `${(comment as any).user?.first_name || ''} ${(comment as any).user?.last_name || ''}`.trim() || 'User';

      if (isGuest) {
        // Guest added comment - notify admins
        const property = (booking as any).property;
        if (property) {
          const adminIds = await getPropertyAdminIds(property.id);
          const recipientIds = [property.owner_id, ...adminIds].filter(Boolean);

          if (recipientIds.length > 0) {
            await sendNotification({
              template_key: 'refund_comment_from_guest',
              recipient_ids: recipientIds,
              data: {
                refund_reference: refundId.slice(0, 8),
                booking_reference: (booking as any).booking_reference || booking.id.slice(0, 8),
                booking_id: booking.id,
                guest_name: userName,
                comment_text: data.comment_text,
                dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:5173',
              },
              priority: 'normal',
            }).catch((error) => {
              logger.error('Failed to send comment notification to admins:', error);
            });
          }
        }
      } else {
        // Admin added comment - notify guest (refund requester)
        await sendNotification({
          template_key: 'refund_comment_from_admin',
          recipient_ids: [refund.requested_by],
          data: {
            booking_reference: (booking as any).booking_reference || booking.id.slice(0, 8),
            booking_id: booking.id,
            comment_text: data.comment_text,
            portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
          },
          priority: 'normal',
        }).catch((error) => {
          logger.error('Failed to send comment notification to guest:', error);
        });
      }
    }
  }

  logger.info(`Comment added to refund ${refundId} by ${userId} (internal: ${isInternal})`);

  return comment as RefundComment;
};

/**
 * Get all comments for a refund request
 */
export const getRefundComments = async (
  refundId: string,
  userId: string
): Promise<RefundComment[]> => {
  const supabase = getAdminClient();

  // 1. Verify access (will throw if user doesn't have access to this refund)
  await getRefundRequestById(refundId);

  // 2. Get user role to filter internal comments
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const isAdmin = ['admin', 'super_admin'].includes(user.user_type);

  // 3. Build query with visibility filter
  let query = supabase
    .from('refund_comments')
    .select(`
      *,
      user:users(id, first_name, last_name, user_type, profile_picture_url)
    `)
    .eq('refund_request_id', refundId)
    .order('created_at', { ascending: true });

  // Hide internal comments from guests
  if (!isAdmin) {
    query = query.eq('is_internal', false);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching refund comments:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch comments');
  }

  return (data || []) as RefundComment[];
};

/**
 * Get activity feed (comments + status changes) for a refund
 */
export const getRefundActivityFeed = async (
  refundId: string,
  userId: string
): Promise<RefundActivity[]> => {
  const supabase = getAdminClient();

  // 1. Verify access
  await getRefundRequestById(refundId);

  // 2. Get user role for internal filtering
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('NOT_FOUND', 'User not found');
  }

  const isAdmin = ['admin', 'super_admin'].includes(user.user_type);

  // 3. Query activity feed view
  let query = supabase
    .from('refund_activity_feed')
    .select('*')
    .eq('refund_request_id', refundId)
    .order('activity_at', { ascending: false });

  // Filter internal activities for guests
  if (!isAdmin) {
    query = query.eq('is_internal', false);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching refund activity feed:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch activity feed');
  }

  return (data || []) as RefundActivity[];
};

/**
 * Get status history for a refund
 */
export const getRefundStatusHistory = async (
  refundId: string,
  userId: string
): Promise<RefundStatusHistory[]> => {
  const supabase = getAdminClient();

  // Verify access
  await getRefundRequestById(refundId);

  const { data, error } = await supabase
    .from('refund_status_history')
    .select(`
      *,
      user:users(id, first_name, last_name, user_type)
    `)
    .eq('refund_request_id', refundId)
    .order('changed_at', { ascending: true});

  if (error) {
    logger.error('Error fetching refund status history:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch status history');
  }

  return (data || []) as RefundStatusHistory[];
};

// ============================================================================
// REFUND DOCUMENT MANAGEMENT (Migration 046)
// ============================================================================

/**
 * Upload a document for a refund request
 */
export const uploadRefundDocument = async (
  refundId: string,
  userId: string,
  file: Express.Multer.File,
  data: UploadRefundDocumentDTO
): Promise<RefundDocument> => {
  const supabase = getAdminClient();

  try {
    // 1. Verify refund exists and user has access
    const refund = await getRefundRequestById(refundId);

    // Check access: user must be refund owner or admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        user_type:user_types(name)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('UNAUTHORIZED', 'User not found');
    }

    const userTypeName = (user.user_type as any)?.name;
    const isAdmin = userTypeName && ['super_admin', 'saas_team_member'].includes(userTypeName);
    const isOwner = refund.requested_by === userId;

    if (!isAdmin && !isOwner) {
      throw new AppError('FORBIDDEN', 'You do not have permission to upload documents for this refund');
    }

    // 2. Validate file
    if (!file) {
      throw new AppError('VALIDATION_ERROR', 'No file provided');
    }

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError('VALIDATION_ERROR', 'Invalid file type. Only PDF and image files are allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('VALIDATION_ERROR', 'File size exceeds 10MB limit');
    }

    // 3. Generate unique storage path
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `refunds/${refundId}/${timestamp}_${sanitizedFilename}`;

    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('refund-documents')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Error uploading file to storage:', { message: uploadError.message });
      throw new AppError('INTERNAL_ERROR', 'Failed to upload file');
    }

    // 5. Insert document record
    const { data: document, error: insertError } = await supabase
      .from('refund_documents')
      .insert({
        refund_request_id: refundId,
        uploaded_by: userId,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype,
        storage_path: storagePath,
        document_type: data.document_type,
        description: data.description || null,
      })
      .select(`
        *,
        user:users(
          id,
          first_name,
          last_name,
          user_type:user_types(name)
        )
      `)
      .single();

    if (insertError) {
      logger.error('Error inserting document record:', { message: insertError.message, code: insertError.code });
      // Clean up uploaded file
      await supabase.storage.from('refund-documents').remove([storagePath]);
      throw new AppError('INTERNAL_ERROR', 'Failed to save document metadata');
    }

    // 6. Create audit log
    await createAuditLog({
      table_name: 'refund_documents',
      record_id: document.id,
      action: 'CREATE',
      changed_by: userId,
      changes: {
        file_name: file.originalname,
        document_type: data.document_type,
      },
    });

    // 7. Send notification to admins about document upload
    const { data: refundData } = await supabase
      .from('refund_requests')
      .select(`
        id,
        booking_id,
        booking:bookings(
          id,
          booking_reference,
          property_id,
          property:properties(id, name, owner_id),
          guest:users!bookings_guest_id_fkey(id, first_name, last_name)
        )
      `)
      .eq('id', refundId)
      .single();

    if (refundData) {
      const booking = (refundData as any).booking;
      const property = booking?.property;

      if (property) {
        const adminIds = await getPropertyAdminIds(property.id);
        const recipientIds = [property.owner_id, ...adminIds].filter(Boolean);

        if (recipientIds.length > 0) {
          const guest = booking.guest;
          const guestName = `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() || 'Guest';

          await sendNotification({
            template_key: 'refund_document_uploaded',
            recipient_ids: recipientIds,
            data: {
              refund_reference: refundId.slice(0, 8),
              booking_reference: booking.booking_reference || booking.id.slice(0, 8),
              booking_id: booking.id,
              guest_name: guestName,
              file_name: file.originalname,
              dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:5173',
            },
            priority: 'normal',
          }).catch((error) => {
            logger.error('Failed to send document uploaded notification:', error);
          });
        }
      }
    }

    return document as RefundDocument;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in uploadRefundDocument:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to upload document');
  }
};

/**
 * Get documents for a refund request
 */
export const getRefundDocuments = async (
  refundId: string,
  userId: string
): Promise<RefundDocument[]> => {
  const supabase = getAdminClient();

  try {
    // 1. Verify access
    const refund = await getRefundRequestById(refundId);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        user_type:user_types(name)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('UNAUTHORIZED', 'User not found');
    }

    const userTypeName = (user.user_type as any)?.name;
    const isAdmin = userTypeName && ['super_admin', 'saas_team_member'].includes(userTypeName);
    const isOwner = refund.requested_by === userId;

    if (!isAdmin && !isOwner) {
      throw new AppError('FORBIDDEN', 'You do not have permission to view documents for this refund');
    }

    // 2. Fetch documents
    const { data, error } = await supabase
      .from('refund_documents')
      .select(`
        *,
        user:users(
          id,
          first_name,
          last_name,
          user_type:user_types(name)
        )
      `)
      .eq('refund_request_id', refundId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      logger.error('Error fetching refund documents:', error);
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch documents');
    }

    return (data || []) as RefundDocument[];
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in getRefundDocuments:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to get documents');
  }
};

/**
 * Delete a document (only allowed for uploader if unverified)
 */
export const deleteRefundDocument = async (
  documentId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  try {
    // 1. Get document details
    const { data: document, error: docError } = await supabase
      .from('refund_documents')
      .select('*, refund_requests(user_id, status)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    // 2. Check permissions
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        user_type:user_types(name)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('UNAUTHORIZED', 'User not found');
    }

    const userTypeName = (user.user_type as any)?.name;
    const isAdmin = userTypeName && ['super_admin', 'saas_team_member'].includes(userTypeName);
    const isUploader = document.uploaded_by === userId;

    if (!isAdmin && !isUploader) {
      throw new AppError('FORBIDDEN', 'You do not have permission to delete this document');
    }

    // Only allow deletion if document is unverified (unless admin)
    if (document.is_verified && !isAdmin) {
      throw new AppError('FORBIDDEN', 'Cannot delete verified documents');
    }

    // Don't allow deletion if refund is in final states (unless admin)
    const finalStatuses = ['completed', 'rejected', 'withdrawn'];
    if (finalStatuses.includes(document.refund_requests?.status) && !isAdmin) {
      throw new AppError('FORBIDDEN', 'Cannot delete documents from finalized refunds');
    }

    // 3. Delete from storage
    const { error: storageError } = await supabase.storage
      .from('refund-documents')
      .remove([document.storage_path]);

    if (storageError) {
      logger.error('Error deleting file from storage:', { message: storageError.message, code: storageError.code });
      // Continue with database deletion even if storage delete fails
    }

    // 4. Delete from database
    const { error: deleteError } = await supabase
      .from('refund_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      logger.error('Error deleting document record:', { message: deleteError.message });
      throw new AppError('INTERNAL_ERROR', 'Failed to delete document');
    }

    // 5. Create audit log
    await createAuditLog({
      table_name: 'refund_documents',
      record_id: documentId,
      action: 'DELETE',
      changed_by: userId,
      changes: {
        file_name: document.file_name,
        deleted: true,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in deleteRefundDocument:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to delete document');
  }
};

/**
 * Verify a document (admin only)
 */
export const verifyRefundDocument = async (
  documentId: string,
  adminId: string
): Promise<RefundDocument> => {
  const supabase = getAdminClient();

  try {
    // 1. Verify admin permissions
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select(`
        id,
        user_type:user_types(name)
      `)
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      throw new AppError('UNAUTHORIZED', 'User not found');
    }

    const userTypeName = (admin.user_type as any)?.name;
    if (!userTypeName || !['super_admin', 'saas_team_member'].includes(userTypeName)) {
      throw new AppError('FORBIDDEN', 'Only admins can verify documents');
    }

    // 2. Update document
    const { data: document, error: updateError } = await supabase
      .from('refund_documents')
      .update({
        is_verified: true,
        verified_by: adminId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select(`
        *,
        user:users(
          id,
          first_name,
          last_name,
          user_type:user_types(name)
        )
      `)
      .single();

    if (updateError) {
      logger.error('Error verifying document:', { message: updateError.message, code: updateError.code });
      throw new AppError('INTERNAL_ERROR', 'Failed to verify document');
    }

    // 3. Create audit log
    await createAuditLog({
      table_name: 'refund_documents',
      record_id: documentId,
      action: 'UPDATE',
      changed_by: adminId,
      changes: {
        is_verified: true,
        verified_by: adminId,
      },
    });

    // 4. Send notification to uploader about verification
    const refundId = (document as any).refund_request_id;
    const uploadedBy = (document as any).uploaded_by;

    const { data: refund } = await supabase
      .from('refund_requests')
      .select(`
        id,
        booking:bookings(
          id,
          booking_reference
        )
      `)
      .eq('id', refundId)
      .single();

    if (refund && uploadedBy) {
      const booking = (refund as any).booking;

      await sendNotification({
        template_key: 'refund_document_verified',
        recipient_ids: [uploadedBy],
        data: {
          refund_reference: refundId.slice(0, 8),
          booking_id: booking?.id,
          verification_status: 'verified',
          file_name: (document as any).file_name || 'Document',
          verification_notes: '',
          portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
        },
        priority: 'low',
      }).catch((error) => {
        logger.error('Failed to send document verified notification:', error);
      });
    }

    return document as RefundDocument;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in verifyRefundDocument:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to verify document');
  }
};

/**
 * Get signed URL for document download
 */
export const getDocumentDownloadUrl = async (
  documentId: string,
  userId: string
): Promise<string> => {
  const supabase = getAdminClient();

  try {
    // 1. Get document and verify access
    const { data: document, error: docError } = await supabase
      .from('refund_documents')
      .select('*, refund_requests(requested_by)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new AppError('NOT_FOUND', 'Document not found');
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        user_type:user_types(name)
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new AppError('UNAUTHORIZED', 'User not found');
    }

    const userTypeName = (user.user_type as any)?.name;
    const isAdmin = userTypeName && ['super_admin', 'saas_team_member'].includes(userTypeName);
    const isOwner = document.refund_requests?.requested_by === userId;

    if (!isAdmin && !isOwner) {
      throw new AppError('FORBIDDEN', 'You do not have permission to download this document');
    }

    // 2. Generate signed URL (expires in 1 hour)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('refund-documents')
      .createSignedUrl(document.storage_path, 3600);

    if (urlError || !signedUrl) {
      logger.error('Error generating signed URL:', { message: urlError.message, code: urlError.code });
      throw new AppError('INTERNAL_ERROR', 'Failed to generate download URL');
    }

    return signedUrl.signedUrl;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in getDocumentDownloadUrl:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to get download URL');
  }
};

// ============================================================================
// WEBHOOK HELPER METHODS
// ============================================================================

/**
 * Find refund request by gateway refund ID
 * Used by webhooks to locate refund when payment gateway sends status update
 */
export const findRefundByGatewayId = async (
  gatewayRefundId: string
): Promise<RefundRequest | null> => {
  const supabase = getAdminClient();

  try {
    // Search in refund_breakdown JSONB field for gateway_refund_id
    const { data: refunds, error } = await supabase
      .from('refund_requests')
      .select('*')
      .not('refund_breakdown', 'is', null);

    if (error) {
      logger.error('Error finding refund by gateway ID:', error);
      return null;
    }

    if (!refunds || refunds.length === 0) {
      return null;
    }

    // Search through refund_breakdown to find matching gateway_refund_id
    for (const refund of refunds) {
      const breakdown = refund.refund_breakdown as RefundBreakdownItem[];
      if (breakdown && Array.isArray(breakdown)) {
        const hasMatch = breakdown.some(
          (item) => item.gateway_refund_id === gatewayRefundId
        );
        if (hasMatch) {
          return refund as RefundRequest;
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('Error in findRefundByGatewayId:', error);
    return null;
  }
};

/**
 * Mark refund as completed (called by payment gateway webhooks)
 */
export const markRefundAsCompleted = async (refundId: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    // Get current refund request
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select(`
        *,
        booking:bookings(
          id,
          booking_reference,
          guest:users!bookings_guest_id_fkey(
            id,
            email,
            first_name,
            last_name
          ),
          property:properties(id, name)
        )
      `)
      .eq('id', refundId)
      .single();

    if (fetchError || !refundRequest) {
      logger.error('Error fetching refund request:', { message: fetchError.message, code: fetchError.code });
      throw new AppError('NOT_FOUND', 'Refund request not found');
    }

    // Update refund status to completed
    const { data: updated, error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        refunded_amount: refundRequest.approved_amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (updateError || !updated) {
      logger.error('Error marking refund as completed:', { message: updateError.message, code: updateError.code });
      throw new AppError('INTERNAL_ERROR', 'Failed to mark refund as completed');
    }

    // Send completion notification to guest
    const booking = (refundRequest as any).booking;
    if (booking) {
      await sendNotification({
        template_key: 'refund_completed',
        recipient_ids: [refundRequest.requested_by!],
        data: {
          booking_reference: booking.booking_reference || booking.id.slice(0, 8),
          booking_id: booking.id,
          total_refunded: `${refundRequest.currency} ${refundRequest.approved_amount}`,
          property_name: booking.property?.name || 'Property',
          portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
        },
        priority: 'normal',
      }).catch((error) => {
        logger.error('Failed to send refund completed notification:', error);
      });

      // Send email to guest
      const guest = booking.guest;
      if (guest?.email) {
        await sendRefundCompletedEmailToGuest({
          guestEmail: guest.email,
          guestName: `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || 'Guest',
          bookingReference: booking.booking_reference || booking.id.slice(0, 8),
          refundedAmount: refundRequest.approved_amount,
          currency: refundRequest.currency,
          refundId: refundId,
        }).catch((error) => {
          logger.error('Failed to send refund completed email:', error);
        });
      }
    }

    // Create audit log
    await createAuditLog(
      'refund_request.completed',
      'refund_requests',
      refundId,
      'system',
      refundRequest,
      updated
    );

    logger.info(`Refund ${refundId} marked as completed`);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in markRefundAsCompleted:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to mark refund as completed');
  }
};

/**
 * Mark refund as failed (called by payment gateway webhooks or manual processing)
 */
export const markRefundAsFailed = async (
  refundId: string,
  reason: string
): Promise<void> => {
  const supabase = getAdminClient();

  try {
    // Get current refund request
    const { data: refundRequest, error: fetchError } = await supabase
      .from('refund_requests')
      .select('*, booking:bookings(id, booking_reference, property:properties(id, name, owner_id))')
      .eq('id', refundId)
      .single();

    if (fetchError || !refundRequest) {
      logger.error('Error fetching refund request:', { message: fetchError.message, code: fetchError.code });
      throw new AppError('NOT_FOUND', 'Refund request not found');
    }

    // Update refund status to failed
    const { data: updated, error: updateError } = await supabase
      .from('refund_requests')
      .update({
        status: 'failed',
        failure_reason: reason,
        auto_process_failed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (updateError || !updated) {
      logger.error('Error marking refund as failed:', { message: updateError.message, code: updateError.code });
      throw new AppError('INTERNAL_ERROR', 'Failed to mark refund as failed');
    }

    // Send failure notification to guest and admins
    const booking = (refundRequest as any).booking;
    if (booking) {
      const property = booking.property;
      const adminIds = property ? await getPropertyAdminIds(property.id) : [];
      const recipientIds = [
        refundRequest.requested_by,
        property?.owner_id,
        ...adminIds,
      ].filter(Boolean);

      if (recipientIds.length > 0) {
        await sendNotification({
          template_key: 'refund_processing_failed',
          recipient_ids: recipientIds,
          data: {
            booking_reference: booking.booking_reference || booking.id.slice(0, 8),
            booking_id: booking.id,
            property_name: property?.name || 'Property',
            error_message: reason,
            portal_url: process.env.PORTAL_URL || 'http://localhost:5173',
            dashboard_url: process.env.DASHBOARD_URL || 'http://localhost:5173',
          },
          priority: 'high',
        }).catch((error) => {
          logger.error('Failed to send refund failed notification:', error);
        });
      }
    }

    // Create audit log
    await createAuditLog(
      'refund_request.failed',
      'refund_requests',
      refundId,
      'system',
      refundRequest,
      updated
    );

    logger.info(`Refund ${refundId} marked as failed: ${reason}`);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error in markRefundAsFailed:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to mark refund as failed');
  }
};
