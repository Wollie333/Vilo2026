import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import type {
  Customer,
  CustomerWithCompany,
  CustomerListParams,
  CustomerListResponse,
  CreateCustomerInput,
  UpdateCustomerInput,
  FindOrCreateCustomerInput,
  CustomerRow,
} from '../types/customer.types';
import type {
  ConversationWithDetails,
  ChatParticipantWithUser,
  ChatMessageWithSender,
} from '../types/chat.types';

/**
 * List customers with pagination and filters
 */
export const listCustomers = async (
  params: CustomerListParams
): Promise<CustomerListResponse> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  // Build base query with company and property joins
  let query = supabase
    .from('customers')
    .select(`
      *,
      company:companies!inner(
        id,
        name
      ),
      property:properties!inner(
        id,
        name
      )
    `, { count: 'exact' });

  // Apply filters
  if (params.company_id) {
    query = query.eq('company_id', params.company_id);
  }

  if (params.property_id) {
    // Filter directly by property_id (customers are property-scoped now)
    query = query.eq('property_id', params.property_id);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  if (params.source) {
    query = query.eq('source', params.source);
  }

  if (params.search) {
    // Search in email and full_name (case-insensitive)
    query = query.or(
      `email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`
    );
  }

  // Apply sorting
  const sortBy = params.sortBy || 'created_at';
  const sortOrder = params.sortOrder === 'asc';
  query = query.order(sortBy, { ascending: sortOrder });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('listCustomers error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch customers');
  }

  const customers = (data || []) as unknown as CustomerWithCompany[];
  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    customers,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Get a single customer by ID with company and property details
 */
export const getCustomer = async (id: string): Promise<CustomerWithCompany> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      company:companies(
        id,
        name
      ),
      property:properties(
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Customer not found');
  }

  return data as unknown as CustomerWithCompany;
};

/**
 * Create a new customer
 */
export const createCustomer = async (
  input: CreateCustomerInput
): Promise<Customer> => {
  const supabase = getAdminClient();

  console.log('[CUSTOMER_SERVICE] createCustomer called');
  console.log('[CUSTOMER_SERVICE] Input:', JSON.stringify(input, null, 2));

  // Lowercase email for consistency
  const email = input.email.toLowerCase();

  // Prepare customer data
  const customerData: Partial<CustomerRow> = {
    email,
    full_name: input.full_name || null,
    phone: input.phone || null,
    property_id: input.property_id,
    company_id: input.company_id,
    source: input.source,
    status: input.status || 'lead',
    user_id: input.user_id || null,
    notes: input.notes || null,
    tags: input.tags || [],
    marketing_consent: input.marketing_consent || false,
  };

  console.log('[CUSTOMER_SERVICE] Inserting customer data:', customerData);

  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation (duplicate email in property)
    if (error.code === '23505') {
      console.error('[CUSTOMER_SERVICE] Duplicate customer:', email, input.property_id);
      throw new AppError(
        'VALIDATION_ERROR',
        'A customer with this email already exists for this property'
      );
    }
    console.error('[CUSTOMER_SERVICE] createCustomer error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to create customer');
  }

  console.log('[CUSTOMER_SERVICE] Customer created successfully:', data.id);
  return data as Customer;
};

/**
 * Update a customer
 */
export const updateCustomer = async (
  id: string,
  input: UpdateCustomerInput
): Promise<Customer> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('customers')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      throw new AppError(
        'VALIDATION_ERROR',
        'A customer with this email already exists'
      );
    }
    throw new AppError('NOT_FOUND', 'Customer not found');
  }

  return data as Customer;
};

/**
 * Delete a customer (soft delete by setting status to inactive)
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('customers')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete customer');
  }
};

/**
 * Hard delete a customer (permanent deletion)
 */
export const hardDeleteCustomer = async (id: string): Promise<void> => {
  const supabase = getAdminClient();

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to permanently delete customer');
  }
};

/**
 * Find customer by email and property, or create if doesn't exist
 * Used by booking integration to auto-create property-scoped customers
 */
export const findOrCreateCustomer = async (
  input: FindOrCreateCustomerInput
): Promise<Customer> => {
  const supabase = getAdminClient();
  const email = input.email.toLowerCase();

  console.log('[CUSTOMER_SERVICE] findOrCreateCustomer called');
  console.log('[CUSTOMER_SERVICE] Email:', email);
  console.log('[CUSTOMER_SERVICE] Property ID:', input.property_id);
  console.log('[CUSTOMER_SERVICE] Company ID:', input.company_id);

  // Try to find existing customer for THIS PROPERTY
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .eq('property_id', input.property_id)
    .single();

  if (existing) {
    console.log('[CUSTOMER_SERVICE] Found existing customer:', existing.id);

    // Update with any new information
    const updates: Partial<CustomerRow> = {};
    if (input.full_name && !existing.full_name) {
      updates.full_name = input.full_name;
    }
    if (input.phone && !existing.phone) {
      updates.phone = input.phone;
    }
    if (input.user_id && !existing.user_id) {
      updates.user_id = input.user_id;
    }

    // Only update if we have new data
    if (Object.keys(updates).length > 0) {
      console.log('[CUSTOMER_SERVICE] Updating customer with new data:', updates);
      const { data: updated } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
      return (updated || existing) as Customer;
    }

    return existing as Customer;
  }

  // Create new customer for THIS PROPERTY
  console.log('[CUSTOMER_SERVICE] Customer not found, creating new customer for property');

  const customerData: Partial<CustomerRow> = {
    email,
    full_name: input.full_name || null,
    phone: input.phone || null,
    property_id: input.property_id,
    company_id: input.company_id,
    source: input.source,
    status: 'lead',
    user_id: input.user_id || null,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) {
    // If it's a duplicate (race condition), fetch and return existing
    if (error.code === '23505') {
      console.log('[CUSTOMER_SERVICE] Race condition detected, fetching existing customer');
      const { data: existing } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .eq('property_id', input.property_id)
        .single();
      if (existing) {
        return existing as Customer;
      }
    }
    console.error('[CUSTOMER_SERVICE] findOrCreateCustomer error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to create customer');
  }

  console.log('[CUSTOMER_SERVICE] New customer created:', data.id);
  return data as Customer;
};

/**
 * Manually sync booking stats for a customer (property-scoped)
 * Normally handled by database triggers, but useful for manual fixes
 */
export const syncBookingStats = async (customerId: string): Promise<Customer> => {
  const supabase = getAdminClient();

  console.log('[CUSTOMER_SERVICE] syncBookingStats called for customer:', customerId);

  // Get customer with property_id
  const { data: customer } = await supabase
    .from('customers')
    .select('email, company_id, property_id')
    .eq('id', customerId)
    .single();

  if (!customer) {
    throw new AppError('NOT_FOUND', 'Customer not found');
  }

  console.log('[CUSTOMER_SERVICE] Syncing stats for:', customer.email, 'property:', customer.property_id);

  // Calculate stats from bookings for THIS PROPERTY only (property-scoped)
  const { data: stats } = await supabase
    .from('bookings')
    .select('total_amount, payment_status, check_in_date, booking_status')
    .filter('guest_email', 'ilike', customer.email)
    .eq('property_id', customer.property_id)
    .neq('booking_status', 'cancelled')
    .neq('booking_status', 'no_show');

  if (!stats || stats.length === 0) {
    // No bookings, reset stats
    const { data: updated } = await supabase
      .from('customers')
      .update({
        total_bookings: 0,
        total_spent: 0,
        first_booking_date: null,
        last_booking_date: null,
      })
      .eq('id', customerId)
      .select()
      .single();
    return updated as Customer;
  }

  // Calculate aggregates
  const totalBookings = stats.length;
  const totalSpent = stats
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const checkInDates = stats
    .map((b) => b.check_in_date)
    .filter((d) => d)
    .sort();
  const firstBookingDate = checkInDates[0] || null;
  const lastBookingDate = checkInDates[checkInDates.length - 1] || null;

  // Determine status
  const hasActive = stats.some((b) =>
    ['confirmed', 'checked_in'].includes(b.booking_status)
  );
  const hasCompleted = stats.some((b) => b.booking_status === 'completed');
  const status = hasActive ? 'active' : hasCompleted ? 'past_guest' : 'lead';

  // Update customer
  const { data: updated, error } = await supabase
    .from('customers')
    .update({
      total_bookings: totalBookings,
      total_spent: totalSpent,
      first_booking_date: firstBookingDate,
      last_booking_date: lastBookingDate,
      status: status,
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error || !updated) {
    throw new AppError('INTERNAL_ERROR', 'Failed to sync booking stats');
  }

  return updated as Customer;
};

/**
 * Get customer's booking history with pagination (property-scoped)
 */
export const getCustomerBookings = async (
  customerId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  bookings: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const supabase = getAdminClient();
  const offset = (page - 1) * limit;

  console.log('[CUSTOMER_SERVICE] getCustomerBookings called for customer:', customerId);

  // Get customer email and property_id
  const { data: customer } = await supabase
    .from('customers')
    .select('email, property_id')
    .eq('id', customerId)
    .single();

  if (!customer) {
    throw new AppError('NOT_FOUND', 'Customer not found');
  }

  console.log('[CUSTOMER_SERVICE] Fetching bookings for:', customer.email, 'property:', customer.property_id);

  // Get bookings for this customer at THIS PROPERTY only (property-scoped)
  const { data, error, count } = await supabase
    .from('bookings')
    .select(`
      *,
      property:properties(
        id,
        name
      )
    `, { count: 'exact' })
    .filter('guest_email', 'ilike', customer.email)
    .eq('property_id', customer.property_id)
    .order('check_in_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[CUSTOMER_SERVICE] getCustomerBookings error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch customer bookings');
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  console.log('[CUSTOMER_SERVICE] Found', total, 'bookings for customer');

  return {
    bookings: data || [],
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Get customer's conversations scoped to their property
 *
 * This function retrieves all conversations where the customer is a participant
 * and the conversation belongs to the customer's property (property isolation).
 *
 * Handles edge cases:
 * - Customer with user_id: Matches by user_id directly
 * - Customer without user_id (guest before signup): Matches by email
 * - Multiple properties: Only returns conversations for THIS property
 * - Archived conversations: Separate query with archived filter
 */
export const getCustomerConversations = async (
  customerId: string,
  archived: boolean = false
): Promise<ConversationWithDetails[]> => {
  const supabase = getAdminClient();

  console.log('=== [CUSTOMER_SERVICE] getCustomerConversations called ===');
  console.log('[CUSTOMER_SERVICE] Customer ID:', customerId);
  console.log('[CUSTOMER_SERVICE] Archived:', archived);

  // Get customer with property_id, user_id, email
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('property_id, user_id, email')
    .eq('id', customerId)
    .single();

  if (customerError || !customer) {
    console.error('[CUSTOMER_SERVICE] Customer not found:', customerId);
    throw new AppError('NOT_FOUND', 'Customer not found');
  }

  console.log('[CUSTOMER_SERVICE] Customer property:', customer.property_id);
  console.log('[CUSTOMER_SERVICE] Customer user_id:', customer.user_id);
  console.log('[CUSTOMER_SERVICE] Customer email:', customer.email);

  // Get participant conversation IDs for this customer
  let participantQuery = supabase
    .from('chat_participants')
    .select('conversation_id, user_id');

  if (customer.user_id) {
    // Customer has user account: match directly by user_id
    console.log('[CUSTOMER_SERVICE] Matching by user_id:', customer.user_id);
    participantQuery = participantQuery.eq('user_id', customer.user_id);
  } else {
    // Customer has no account yet: find users with matching email
    console.log('[CUSTOMER_SERVICE] No user_id, matching by email:', customer.email);
    const { data: matchingUsers } = await supabase
      .from('users')
      .select('id')
      .ilike('email', customer.email);

    const userIds = matchingUsers?.map((u) => u.id) || [];
    console.log('[CUSTOMER_SERVICE] Matching user IDs:', userIds);

    if (userIds.length === 0) {
      console.log('[CUSTOMER_SERVICE] No matching users found');
      return []; // No users with this email
    }

    participantQuery = participantQuery.in('user_id', userIds);
  }

  const { data: participantData } = await participantQuery;
  const conversationIds = participantData?.map((p) => p.conversation_id) || [];

  console.log('[CUSTOMER_SERVICE] Participant in conversations:', conversationIds.length);

  if (conversationIds.length === 0) {
    console.log('[CUSTOMER_SERVICE] Customer is not in any conversations');
    return []; // Customer is not in any conversations
  }

  // Get conversations filtered by property_id and archived status
  const { data: conversations, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .in('id', conversationIds)
    .eq('property_id', customer.property_id) // CRITICAL: Property isolation
    .eq('is_archived', archived)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (convError) {
    console.error('[CUSTOMER_SERVICE] Error fetching conversations:', convError);
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch conversations');
  }

  console.log('[CUSTOMER_SERVICE] Found conversations:', conversations?.length || 0);

  if (!conversations || conversations.length === 0) {
    return [];
  }

  // Enrich conversations with details (participants, property, last message, unread count)
  const enrichedConversations: ConversationWithDetails[] = await Promise.all(
    conversations.map(async (conv) => {
      // Get participants
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('*, user:users(id, full_name, email, avatar_url)')
        .eq('conversation_id', conv.id);

      // Get property if exists
      let property = null;
      if (conv.property_id) {
        const { data: prop } = await supabase
          .from('properties')
          .select('id, name, featured_image_url')
          .eq('id', conv.property_id)
          .single();
        property = prop;
      }

      // Get last message
      const { data: lastMessageData } = await supabase
        .from('chat_messages')
        .select('*, sender:users(id, full_name, avatar_url)')
        .eq('conversation_id', conv.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get unread count (if customer has user_id)
      let unreadCount = 0;
      if (customer.user_id) {
        const { data: unreadData } = await supabase.rpc('get_chat_unread_count', {
          p_conversation_id: conv.id,
          p_user_id: customer.user_id,
        });
        unreadCount = unreadData || 0;
      }

      // Get support ticket metadata if support conversation
      let supportTicket = null;
      if (conv.type === 'support') {
        const { data: ticket } = await supabase
          .from('support_tickets')
          .select(
            'id, ticket_number, status, priority, category, sla_due_at, sla_breached'
          )
          .eq('conversation_id', conv.id)
          .single();
        supportTicket = ticket;
      }

      return {
        ...conv,
        property,
        participants: (participants || []) as ChatParticipantWithUser[],
        last_message: (lastMessageData as ChatMessageWithSender) || null,
        unread_count: unreadCount,
        support_ticket: supportTicket,
      };
    })
  );

  console.log('[CUSTOMER_SERVICE] Enriched conversations:', enrichedConversations.length);
  return enrichedConversations;
};
