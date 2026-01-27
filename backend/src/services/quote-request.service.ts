/**
 * Quote Request Service
 *
 * Business logic for managing custom quote requests from guests.
 * Integrates with customer CRM, chat system, and notification infrastructure.
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { findOrCreateCustomer } from './customer.service';
import { createConversation } from './chat.service';
import { sendNotification } from './notifications.service';
import type {
  QuoteRequest,
  QuoteRequestWithDetails,
  CreateQuoteRequestInput,
  UpdateQuoteRequestInput,
  RespondToQuoteRequest,
  QuoteRequestListParams,
  QuoteRequestListResponse,
  QuoteRequestStats,
  QuoteRequestStatus,
  QuoteGroupType,
} from '../types/quote-request.types';

// ============================================================================
// CREATE QUOTE REQUEST (Public - Guest Submission)
// ============================================================================

/**
 * Create a new quote request (public endpoint)
 * Auto-creates customer, chat conversation, and notifies property owner
 */
export const createQuoteRequest = async (
  input: CreateQuoteRequestInput
): Promise<QuoteRequestWithDetails> => {
  const supabase = getAdminClient();

  console.log('=== [QUOTE_REQUEST_SERVICE] createQuoteRequest called ===');
  console.log('[QUOTE_REQUEST_SERVICE] Input:', JSON.stringify(input, null, 2));

  // Step 1: Get property details (validate and get company_id, owner_id, currency)
  console.log('[QUOTE_REQUEST_SERVICE] Step 1: Fetching property details');
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, company_id, owner_id, name, currency')
    .eq('id', input.property_id)
    .single();

  if (propertyError || !property) {
    console.error('[QUOTE_REQUEST_SERVICE] Property not found:', propertyError);
    throw new AppError('NOT_FOUND', 'Property not found');
  }

  console.log('[QUOTE_REQUEST_SERVICE] Property found:', property.id, property.name);

  // Step 2: Find or create property-scoped customer
  console.log('[QUOTE_REQUEST_SERVICE] Step 2: Finding or creating customer');
  const customer = await findOrCreateCustomer({
    email: input.guest_email.toLowerCase(),
    full_name: input.guest_name,
    phone: input.guest_phone,
    property_id: property.id,
    company_id: property.company_id,
    source: 'quote_request',
  });

  console.log('[QUOTE_REQUEST_SERVICE] Customer ID:', customer.id);

  // Step 3: Check for existing pending quote (prevent duplicates)
  console.log('[QUOTE_REQUEST_SERVICE] Step 3: Checking for existing pending quote');
  const { data: existingQuote } = await supabase
    .from('quote_requests')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('property_id', property.id)
    .eq('status', 'pending')
    .single();

  if (existingQuote) {
    console.error('[QUOTE_REQUEST_SERVICE] Duplicate quote request detected');
    throw new AppError(
      'CONFLICT',
      'You already have a pending quote request for this property. Please wait for the owner to respond.'
    );
  }

  // Step 4: Calculate group size, priority, and expiration
  const groupSize = input.adults_count + (input.children_count || 0);
  const priority = calculatePriority(input, groupSize);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expire in 30 days

  console.log('[QUOTE_REQUEST_SERVICE] Step 4: Calculated group_size:', groupSize, 'priority:', priority);

  // Step 5: Create quote request record
  console.log('[QUOTE_REQUEST_SERVICE] Step 5: Inserting quote request');
  const quoteData = {
    property_id: property.id,
    company_id: property.company_id,
    customer_id: customer.id,
    user_id: customer.user_id || null,

    guest_name: input.guest_name,
    guest_email: input.guest_email.toLowerCase(),
    guest_phone: input.guest_phone || null,

    date_flexibility: input.date_flexibility,
    preferred_check_in: input.preferred_check_in || null,
    preferred_check_out: input.preferred_check_out || null,
    flexible_date_start: input.flexible_date_start || null,
    flexible_date_end: input.flexible_date_end || null,
    nights_count: input.nights_count || null,

    adults_count: input.adults_count,
    children_count: input.children_count || 0,
    group_size: groupSize,
    group_type: input.group_type,

    budget_min: input.budget_min || null,
    budget_max: input.budget_max || null,
    currency: property.currency,

    special_requirements: input.special_requirements || null,
    event_type: input.event_type || null,
    event_description: input.event_description || null,
    preferred_room_types: input.preferred_room_types || [],

    status: 'pending' as QuoteRequestStatus,
    priority,
    expires_at: expiresAt.toISOString(),
    source: input.source || 'website',
    user_agent: input.user_agent || null,
    referrer_url: input.referrer_url || null,
  };

  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .insert(quoteData)
    .select()
    .single();

  if (quoteError || !quoteRequest) {
    console.error('[QUOTE_REQUEST_SERVICE] Failed to create quote:', quoteError);
    throw new AppError('INTERNAL_ERROR', 'Failed to create quote request');
  }

  console.log('[QUOTE_REQUEST_SERVICE] Quote created:', quoteRequest.id);

  // Step 6: Create guest user account if needed (for chat participation)
  let guestUserId = customer.user_id;

  if (!guestUserId) {
    console.log('[QUOTE_REQUEST_SERVICE] Step 6: Creating guest user account');
    try {
      // Check if user already exists in auth system
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        u => u.email?.toLowerCase() === input.guest_email.toLowerCase()
      );

      if (existingUser) {
        console.log('[QUOTE_REQUEST_SERVICE] Guest user already exists:', existingUser.id);
        guestUserId = existingUser.id;

        // Update customer with user_id
        await supabase
          .from('customers')
          .update({ user_id: guestUserId })
          .eq('id', customer.id);

        // Update quote with user_id
        await supabase
          .from('quote_requests')
          .update({ user_id: guestUserId })
          .eq('id', quoteRequest.id);
      } else {
        // Create new user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: input.guest_email.toLowerCase(),
          email_confirm: true,
          user_metadata: {
            full_name: input.guest_name,
            user_type: 'guest',
          },
        });

        if (authError) {
          console.error('[QUOTE_REQUEST_SERVICE] Failed to create guest user:', authError);
          console.error('[QUOTE_REQUEST_SERVICE] Auth error details:', JSON.stringify(authError, null, 2));
          // Don't fail the entire quote creation if guest account fails
        } else if (authUser?.user) {
          guestUserId = authUser.user.id;
          console.log('[QUOTE_REQUEST_SERVICE] Guest user created:', guestUserId);

          // Update customer with user_id
          await supabase
            .from('customers')
            .update({ user_id: guestUserId })
            .eq('id', customer.id);

          // Update quote with user_id
          await supabase
            .from('quote_requests')
            .update({ user_id: guestUserId })
            .eq('id', quoteRequest.id);
        }
      }
    } catch (error) {
      console.error('[QUOTE_REQUEST_SERVICE] Error creating guest user:', error);
      console.error('[QUOTE_REQUEST_SERVICE] Error stack:', error instanceof Error ? error.stack : 'N/A');
      // Continue without failing - chat creation will be skipped
    }
  }

  // Step 7: Create chat conversation (guest_inquiry type)
  let conversationId: string | null = null;

  if (guestUserId && property.owner_id) {
    console.log('[QUOTE_REQUEST_SERVICE] Step 7: Creating chat conversation');
    try {
      const conversationTitle = `Quote Request: ${input.guest_name}`;
      const initialMessage = buildQuoteRequestMessage(input, groupSize);

      const { conversation } = await createConversation(
        {
          type: 'guest_inquiry',
          title: conversationTitle,
          property_id: property.id,
          participant_user_ids: [property.owner_id, guestUserId],
          initial_message: initialMessage,
        },
        guestUserId
      );

      conversationId = conversation.id;
      console.log('[QUOTE_REQUEST_SERVICE] Chat created:', conversationId);

      // Link conversation to quote
      await supabase
        .from('quote_requests')
        .update({ conversation_id: conversationId })
        .eq('id', quoteRequest.id);
    } catch (error) {
      console.error('[QUOTE_REQUEST_SERVICE] Error creating chat:', error);
      // Continue without failing - notification will still be sent
    }
  } else {
    console.log('[QUOTE_REQUEST_SERVICE] Skipping chat creation - missing guest_user_id or owner_id');
  }

  // Step 8: Notify property owner
  console.log('[QUOTE_REQUEST_SERVICE] Step 8: Notifying property owner');
  try {
    const dateInfo = formatDateInfo(input);

    await sendNotification({
      template_key: 'quote_request_received',
      recipient_ids: [property.owner_id],
      data: {
        guest_name: input.guest_name,
        guest_email: input.guest_email,
        property_name: property.name,
        dates: dateInfo,
        group_size: groupSize.toString(),
        group_type: input.group_type,
        quote_id: quoteRequest.id,
      },
      priority: priority > 0 ? 'high' : 'normal',
      send_email: true,
    });

    console.log('[QUOTE_REQUEST_SERVICE] Notification sent to property owner');
  } catch (error) {
    console.error('[QUOTE_REQUEST_SERVICE] Error sending notification:', error);
    // Don't fail the quote creation if notification fails
  }

  // Step 9: Fetch and return full quote with details
  console.log('[QUOTE_REQUEST_SERVICE] Step 9: Fetching full quote details');
  return getQuoteRequest(quoteRequest.id);
};

// ============================================================================
// GET QUOTE REQUEST BY ID
// ============================================================================

/**
 * Get quote request by ID with full details
 */
export const getQuoteRequest = async (
  id: string
): Promise<QuoteRequestWithDetails> => {
  const supabase = getAdminClient();

  console.log('[QUOTE_REQUEST_SERVICE] getQuoteRequest:', id);

  const { data, error } = await supabase
    .from('quote_requests')
    .select(`
      *,
      property:properties(
        id,
        name,
        slug,
        featured_image_url,
        address_city,
        address_state,
        address_country
      ),
      customer:customers(
        id,
        email,
        full_name,
        phone,
        status
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('[QUOTE_REQUEST_SERVICE] Quote not found:', error);
    throw new AppError('NOT_FOUND', 'Quote request not found');
  }

  // Get conversation details if exists
  let conversationDetails = null;
  if (data.conversation_id) {
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', data.conversation_id)
      .single();

    if (conv) {
      // TODO: Get unread count if needed
      conversationDetails = { id: conv.id, unread_count: 0 };
    }
  }

  return {
    ...data,
    conversation: conversationDetails,
  } as QuoteRequestWithDetails;
};

// ============================================================================
// LIST QUOTE REQUESTS
// ============================================================================

/**
 * List quote requests with filters and pagination
 */
export const listQuoteRequests = async (
  userId: string,
  params: QuoteRequestListParams
): Promise<QuoteRequestListResponse> => {
  const supabase = getAdminClient();

  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  console.log('=== [QUOTE_REQUEST_SERVICE] listQuoteRequests ===');
  console.log('[QUOTE_REQUEST_SERVICE] User ID:', userId);
  console.log('[QUOTE_REQUEST_SERVICE] Params:', params);

  // Build query with property ownership check
  let query = supabase
    .from('quote_requests')
    .select(
      `
      *,
      property:properties!inner(
        id,
        name,
        slug,
        featured_image_url,
        address_city,
        address_state,
        address_country,
        owner_id
      ),
      customer:customers(
        id,
        email,
        full_name,
        phone,
        status
      )
    `,
      { count: 'exact' }
    )
    .eq('properties.owner_id', userId);

  // Apply filters
  if (params.property_id) {
    query = query.eq('property_id', params.property_id);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.group_type) {
    query = query.eq('group_type', params.group_type);
  }

  if (params.search) {
    query = query.or(
      `guest_name.ilike.%${params.search}%,guest_email.ilike.%${params.search}%`
    );
  }

  // Sorting
  const sortBy = params.sortBy || 'created_at';
  const ascending = params.sortOrder === 'asc';
  query = query.order(sortBy, { ascending });

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[QUOTE_REQUEST_SERVICE] List error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch quote requests');
  }

  console.log('[QUOTE_REQUEST_SERVICE] Found', count, 'quote requests');

  // Get stats
  const stats = await getQuoteRequestStats(userId, params.property_id);

  return {
    quote_requests: (data || []) as QuoteRequestWithDetails[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    stats: {
      total: stats.total || 0,
      pending: stats.by_status?.pending || 0,
      responded: stats.by_status?.responded || 0,
      converted: stats.by_status?.converted || 0,
      conversion_rate: stats.conversion_rate || 0,
    },
  };
};

// ============================================================================
// RESPOND TO QUOTE REQUEST (Property Owner)
// ============================================================================

/**
 * Respond to a quote request
 */
export const respondToQuoteRequest = async (
  quoteId: string,
  response: RespondToQuoteRequest,
  userId: string
): Promise<QuoteRequestWithDetails> => {
  const supabase = getAdminClient();

  console.log('=== [QUOTE_REQUEST_SERVICE] respondToQuoteRequest ===');
  console.log('[QUOTE_REQUEST_SERVICE] Quote ID:', quoteId);
  console.log('[QUOTE_REQUEST_SERVICE] User ID:', userId);

  // Get quote with ownership check
  const { data: quote, error: quoteError } = await supabase
    .from('quote_requests')
    .select('*, property:properties!inner(owner_id, name)')
    .eq('id', quoteId)
    .single();

  if (quoteError || !quote) {
    throw new AppError('NOT_FOUND', 'Quote request not found');
  }

  // Verify ownership
  if (quote.property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'You do not have permission to respond to this quote');
  }

  console.log('[QUOTE_REQUEST_SERVICE] Updating quote status to responded');

  // Update quote status
  const { error: updateError } = await supabase
    .from('quote_requests')
    .update({
      status: 'responded' as QuoteRequestStatus,
      owner_response: response.response_message,
      responded_at: new Date().toISOString(),
      responded_by: userId,
    })
    .eq('id', quoteId);

  if (updateError) {
    console.error('[QUOTE_REQUEST_SERVICE] Failed to update quote:', updateError);
    throw new AppError('INTERNAL_ERROR', 'Failed to update quote request');
  }

  // Send message to conversation if exists
  if (quote.conversation_id) {
    console.log('[QUOTE_REQUEST_SERVICE] Sending message to chat conversation');
    try {
      await supabase.from('chat_messages').insert({
        conversation_id: quote.conversation_id,
        sender_id: userId,
        content: response.response_message,
        message_type: 'text',
      });
    } catch (error) {
      console.error('[QUOTE_REQUEST_SERVICE] Failed to send chat message:', error);
      // Continue without failing
    }
  }

  // Notify guest if they have a user account
  if (quote.user_id) {
    console.log('[QUOTE_REQUEST_SERVICE] Notifying guest');
    try {
      await sendNotification({
        template_key: 'quote_request_responded',
        recipient_ids: [quote.user_id],
        data: {
          guest_name: quote.guest_name,
          property_name: quote.property.name,
          quote_id: quoteId,
        },
        send_email: true,
      });
    } catch (error) {
      console.error('[QUOTE_REQUEST_SERVICE] Failed to send notification:', error);
      // Continue without failing
    }
  }

  console.log('[QUOTE_REQUEST_SERVICE] Response completed successfully');

  // Return updated quote with details
  return getQuoteRequest(quoteId);
};

// ============================================================================
// UPDATE QUOTE REQUEST STATUS (Property Owner)
// ============================================================================

/**
 * Update quote request status or other fields
 */
export const updateQuoteRequestStatus = async (
  quoteId: string,
  updates: UpdateQuoteRequestInput,
  userId: string
): Promise<QuoteRequestWithDetails> => {
  const supabase = getAdminClient();

  console.log('[QUOTE_REQUEST_SERVICE] updateQuoteRequestStatus:', quoteId);

  // Verify ownership
  const { data: quote } = await supabase
    .from('quote_requests')
    .select('property:properties!inner(owner_id)')
    .eq('id', quoteId)
    .single();

  if (!quote || quote.property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'Permission denied');
  }

  const { error } = await supabase
    .from('quote_requests')
    .update(updates)
    .eq('id', quoteId);

  if (error) {
    console.error('[QUOTE_REQUEST_SERVICE] Update failed:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to update quote request');
  }

  return getQuoteRequest(quoteId);
};

// ============================================================================
// CONVERT QUOTE TO BOOKING
// ============================================================================

/**
 * Link quote to booking when converted
 */
export const convertQuoteToBooking = async (
  quoteId: string,
  bookingId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  console.log('[QUOTE_REQUEST_SERVICE] convertQuoteToBooking:', quoteId, '→', bookingId);

  // Verify ownership
  const { data: quote } = await supabase
    .from('quote_requests')
    .select('property:properties!inner(owner_id)')
    .eq('id', quoteId)
    .single();

  if (!quote || quote.property.owner_id !== userId) {
    throw new AppError('FORBIDDEN', 'Permission denied');
  }

  await supabase
    .from('quote_requests')
    .update({
      status: 'converted' as QuoteRequestStatus,
      booking_id: bookingId,
    })
    .eq('id', quoteId);
};

// ============================================================================
// GET QUOTE REQUEST STATISTICS
// ============================================================================

/**
 * Get analytics and statistics for quote requests
 */
export const getQuoteRequestStats = async (
  userId: string,
  propertyId?: string
): Promise<QuoteRequestStats> => {
  const supabase = getAdminClient();

  console.log('[QUOTE_REQUEST_SERVICE] getQuoteRequestStats');

  // Base query with ownership check
  let query = supabase
    .from('quote_requests')
    .select('status, group_type, group_size, budget_max, created_at, responded_at, property:properties!inner(owner_id)')
    .eq('properties.owner_id', userId);

  if (propertyId) {
    query = query.eq('property_id', propertyId);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return {
      total: 0,
      by_status: {} as Record<QuoteRequestStatus, number>,
      by_group_type: {} as Record<QuoteGroupType, number>,
      average_group_size: 0,
      average_budget: 0,
      conversion_rate: 0,
      average_response_time_hours: 0,
    };
  }

  const byStatus: Partial<Record<QuoteRequestStatus, number>> = {};
  const byGroupType: Partial<Record<QuoteGroupType, number>> = {};
  let totalGroupSize = 0;
  let totalBudget = 0;
  let budgetCount = 0;
  let totalResponseTime = 0;
  let responseCount = 0;

  data.forEach((quote: any) => {
    // Status counts
    byStatus[quote.status as QuoteRequestStatus] =
      (byStatus[quote.status as QuoteRequestStatus] || 0) + 1;

    // Group type counts
    byGroupType[quote.group_type as QuoteGroupType] =
      (byGroupType[quote.group_type as QuoteGroupType] || 0) + 1;

    // Group size
    totalGroupSize += quote.group_size;

    // Budget
    if (quote.budget_max) {
      totalBudget += quote.budget_max;
      budgetCount++;
    }

    // Response time
    if (quote.responded_at) {
      const createdAt = new Date(quote.created_at).getTime();
      const respondedAt = new Date(quote.responded_at).getTime();
      totalResponseTime += (respondedAt - createdAt) / (1000 * 60 * 60); // hours
      responseCount++;
    }
  });

  const converted = byStatus.converted || 0;
  const total = data.length;

  return {
    total,
    by_status: byStatus as Record<QuoteRequestStatus, number>,
    by_group_type: byGroupType as Record<QuoteGroupType, number>,
    average_group_size: total > 0 ? totalGroupSize / total : 0,
    average_budget: budgetCount > 0 ? totalBudget / budgetCount : 0,
    conversion_rate: total > 0 ? (converted / total) * 100 : 0,
    average_response_time_hours: responseCount > 0 ? totalResponseTime / responseCount : 0,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate priority score based on quote characteristics
 * 0 = normal, 1-3 = high priority
 */
function calculatePriority(input: CreateQuoteRequestInput, groupSize: number): number {
  let priority = 0;

  // High group size (10+ people) = +1
  if (groupSize >= 10) {
    priority += 1;
  }

  // High budget (50,000+ in base currency) = +1
  if (input.budget_max && input.budget_max >= 50000) {
    priority += 1;
  }

  // Special event types = +1
  if (['wedding', 'corporate_event', 'conference'].includes(input.group_type)) {
    priority += 1;
  }

  return Math.min(priority, 3); // Cap at 3
}

/**
 * Format date info for display in notifications
 */
function formatDateInfo(input: CreateQuoteRequestInput): string {
  if (input.date_flexibility === 'exact' && input.preferred_check_in && input.preferred_check_out) {
    return `${input.preferred_check_in} to ${input.preferred_check_out}`;
  }
  if (input.date_flexibility === 'flexible' && input.flexible_date_start && input.flexible_date_end) {
    return `flexible between ${input.flexible_date_start} and ${input.flexible_date_end}`;
  }
  if (input.nights_count) {
    return `${input.nights_count} nights (flexible dates)`;
  }
  return 'flexible dates';
}

/**
 * Build initial chat message for quote request
 */
function buildQuoteRequestMessage(input: CreateQuoteRequestInput, groupSize: number): string {
  let message = `Hello! I'd like to request a quote for a stay at your property.\n\n`;

  message += `**Guest Details:**\n`;
  message += `- Name: ${input.guest_name}\n`;
  message += `- Email: ${input.guest_email}\n`;
  if (input.guest_phone) message += `- Phone: ${input.guest_phone}\n`;
  message += `- Group: ${input.adults_count} adults`;
  if (input.children_count) message += `, ${input.children_count} children`;
  message += `\n- Group Type: ${input.group_type}\n\n`;

  message += `**Date Requirements:**\n`;
  message += `- Flexibility: ${input.date_flexibility}\n`;
  if (input.preferred_check_in) message += `- Preferred Check-in: ${input.preferred_check_in}\n`;
  if (input.preferred_check_out) message += `- Preferred Check-out: ${input.preferred_check_out}\n`;
  if (input.flexible_date_start) message += `- Flexible Start: ${input.flexible_date_start}\n`;
  if (input.flexible_date_end) message += `- Flexible End: ${input.flexible_date_end}\n`;
  if (input.nights_count) message += `- Nights: ${input.nights_count}\n\n`;

  if (input.budget_min || input.budget_max) {
    message += `**Budget:**\n`;
    if (input.budget_min && input.budget_max) {
      message += `- Range: ${input.budget_min} - ${input.budget_max}\n\n`;
    } else if (input.budget_max) {
      message += `- Maximum: ${input.budget_max}\n\n`;
    }
  }

  if (input.special_requirements) {
    message += `**Special Requirements:**\n${input.special_requirements}\n\n`;
  }

  if (input.event_type || input.event_description) {
    message += `**Event Details:**\n`;
    if (input.event_type) message += `- Type: ${input.event_type}\n`;
    if (input.event_description) message += `- Description: ${input.event_description}\n\n`;
  }

  message += `Looking forward to hearing from you!`;

  return message;
}
