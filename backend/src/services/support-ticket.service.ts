/**
 * Support Ticket Service
 * Handles support ticket management, SLA tracking, and customer context
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import type {
  SupportTicket,
  SupportTicketWithRelations,
  SupportTicketWithContext,
  SupportCannedResponse,
  SupportInternalNote,
  CreateTicketInput,
  UpdateTicketInput,
  AssignTicketInput,
  ResolveTicketInput,
  TicketListParams,
  TicketListResponse,
  CreateCannedResponseInput,
  UpdateCannedResponseInput,
  CannedResponseListParams,
  CreateInternalNoteInput,
  TicketStats,
  AgentStats,
  DEFAULT_SLA_CONFIG,
} from '../types/support.types';

/**
 * Create a support ticket with conversation
 */
export const createTicket = async (
  input: CreateTicketInput,
  requesterId: string
): Promise<SupportTicketWithRelations> => {
  const supabase = getAdminClient();

  try {
    console.log('[CREATE TICKET] Starting ticket creation for user:', requesterId);

    // Get requester details
    const { data: requester } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', requesterId)
      .single();

    const companyId = requester?.company_id || null;
    console.log('[CREATE TICKET] Requester company:', companyId);

    // Create conversation for the ticket
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .insert({
        type: 'support',
        title: input.subject,
        property_id: input.property_id || null,
        created_by: requesterId,
      })
      .select()
      .single();

    if (convError || !conversation) {
      console.error('[CREATE TICKET] Failed to create conversation:', convError);
      throw new AppError('INTERNAL_ERROR', 'Failed to create conversation');
    }

    console.log('[CREATE TICKET] Conversation created:', conversation.id);

    // Add requester as participant
    const { error: participantError } = await supabase.from('chat_participants').insert({
      conversation_id: conversation.id,
      user_id: requesterId,
      role: 'member',
    });

    if (participantError) {
      console.error('[CREATE TICKET] Failed to add participant:', participantError);
      throw new AppError('INTERNAL_ERROR', 'Failed to add participant to conversation');
    }

    console.log('[CREATE TICKET] Participant added:', requesterId);

    // Create initial message
    const { error: messageError } = await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      sender_id: requesterId,
      content: input.initial_message,
      message_type: 'text',
    });

    if (messageError) {
      console.error('[CREATE TICKET] Failed to create message:', messageError);
      throw new AppError('INTERNAL_ERROR', 'Failed to create initial message');
    }

    console.log('[CREATE TICKET] Initial message created');

    // Create ticket
    const ticketData = {
      conversation_id: conversation.id,
      subject: input.subject,
      priority: input.priority || 'normal',
      category: input.category || null,
      requester_id: requesterId,
      property_id: input.property_id || null,
      company_id: companyId,
      status: 'open',
    };

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select(`
        *,
        requester:users!requester_id(id, email, full_name),
        property:properties(id, name),
        company:companies(id, name)
      `)
      .single();

    if (ticketError || !ticket) {
      console.error('[CREATE TICKET] Failed to create ticket record:', ticketError);
      throw new AppError('INTERNAL_ERROR', 'Failed to create ticket');
    }

    console.log('[CREATE TICKET] SUCCESS! Ticket created:', {
      ticket_number: ticket.ticket_number,
      ticket_id: ticket.id,
      conversation_id: ticket.conversation_id,
      requester_id: requesterId,
    });

    return ticket as SupportTicketWithRelations;
  } catch (error) {
    console.error('[CREATE TICKET] ERROR:', error);
    throw error;
  }
};

/**
 * Get ticket by ID with relations
 */
export const getTicket = async (id: string): Promise<SupportTicketWithRelations> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        requester:users!requester_id(id, email, full_name),
        assigned_agent:users!assigned_to(id, email, full_name),
        property:properties(id, name),
        company:companies(id, name),
        conversation:chat_conversations(id)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Ticket not found');
    }

    return data as SupportTicketWithRelations;
  } catch (error) {
    console.error('Get ticket error:', error);
    throw error;
  }
};

/**
 * Get ticket with customer context
 */
export const getTicketWithContext = async (id: string): Promise<SupportTicketWithContext> => {
  const supabase = getAdminClient();

  try {
    // Get base ticket
    const ticket = await getTicket(id);

    // Get internal notes
    const { data: notes } = await supabase
      .from('support_internal_notes')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    // Build customer context
    const customerContext: any = {};

    if (ticket.company_id) {
      // Get company details
      const { data: company } = await supabase
        .from('companies')
        .select('id, name, subscription_plan, created_at')
        .eq('id', ticket.company_id)
        .single();

      customerContext.company = company;

      // Get properties
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name, property_type')
        .eq('company_id', ticket.company_id)
        .limit(10);

      customerContext.properties = properties;

      // Get recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_reference, check_in_date, check_out_date, total_amount, booking_status')
        .eq('company_id', ticket.company_id)
        .order('created_at', { ascending: false })
        .limit(5);

      customerContext.recent_bookings = bookings;

      // Calculate payment summary
      const { data: paymentSummary } = await supabase
        .from('bookings')
        .select('total_amount, amount_paid')
        .eq('company_id', ticket.company_id)
        .then((res) => {
          if (!res.data) return { data: null };

          const total_revenue = res.data.reduce((sum, b) => sum + (b.amount_paid || 0), 0);
          const outstanding_balance = res.data.reduce(
            (sum, b) => sum + ((b.total_amount || 0) - (b.amount_paid || 0)),
            0
          );

          return {
            data: {
              total_revenue,
              outstanding_balance,
              last_payment_date: null, // TODO: Get from payments table
            },
          };
        });

      customerContext.payment_summary = paymentSummary.data;
    }

    return {
      ...ticket,
      customer_context: customerContext,
      internal_notes: notes as SupportInternalNote[],
    };
  } catch (error) {
    console.error('Get ticket with context error:', error);
    throw error;
  }
};

/**
 * List tickets with filters and pagination
 */
export const listTickets = async (params: TicketListParams): Promise<TicketListResponse> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('support_tickets')
      .select(
        `
        *,
        requester:users!requester_id(id, email, full_name),
        assigned_agent:users!assigned_to(id, email, full_name),
        property:properties(id, name),
        company:companies(id, name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.priority) {
      query = query.eq('priority', params.priority);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to);
    }

    if (params.requester_id) {
      query = query.eq('requester_id', params.requester_id);
    }

    if (params.company_id) {
      query = query.eq('company_id', params.company_id);
    }

    if (params.sla_breached !== undefined) {
      query = query.eq('sla_breached', params.sla_breached);
    }

    // Apply sorting
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder === 'asc';
    query = query.order(sortBy, { ascending: sortOrder });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch tickets');
    }

    const tickets = (data || []) as SupportTicketWithRelations[];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      tickets,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error('List tickets error:', error);
    throw error;
  }
};

/**
 * Update ticket
 */
export const updateTicket = async (id: string, input: UpdateTicketInput): Promise<SupportTicket> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Ticket not found');
    }

    return data as SupportTicket;
  } catch (error) {
    console.error('Update ticket error:', error);
    throw error;
  }
};

/**
 * Assign ticket to agent
 */
export const assignTicket = async (
  id: string,
  input: AssignTicketInput,
  assignedBy?: string
): Promise<SupportTicket> => {
  const supabase = getAdminClient();

  try {
    // Get ticket
    const ticket = await getTicket(id);

    // Add agent as participant in conversation
    const { data: existingParticipant } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('conversation_id', ticket.conversation_id)
      .eq('user_id', input.assigned_to)
      .single();

    if (!existingParticipant) {
      await supabase.from('chat_participants').insert({
        conversation_id: ticket.conversation_id,
        user_id: input.assigned_to,
        role: 'admin',
      });
    }

    // Update ticket
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        assigned_to: input.assigned_to,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Ticket not found');
    }

    console.log(`Ticket ${ticket.ticket_number} assigned to agent ${input.assigned_to}`);

    return data as SupportTicket;
  } catch (error) {
    console.error('Assign ticket error:', error);
    throw error;
  }
};

/**
 * Resolve ticket
 */
export const resolveTicket = async (
  id: string,
  input: ResolveTicketInput,
  resolvedBy: string
): Promise<SupportTicket> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: input.resolution_notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Ticket not found');
    }

    return data as SupportTicket;
  } catch (error) {
    console.error('Resolve ticket error:', error);
    throw error;
  }
};

/**
 * Close a ticket
 */
export const closeTicket = async (
  id: string,
  closedBy: string
): Promise<SupportTicket> => {
  const supabase = getAdminClient();

  try {
    // Get the ticket first to check if it exists
    const { data: ticket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !ticket) {
      throw new AppError('NOT_FOUND', 'Ticket not found');
    }

    // Update ticket status to closed
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('INTERNAL_ERROR', 'Failed to close ticket');
    }

    return data as SupportTicket;
  } catch (error) {
    console.error('Close ticket error:', error);
    throw error;
  }
};

/**
 * Add internal note to ticket
 */
export const addInternalNote = async (
  ticketId: string,
  input: CreateInternalNoteInput,
  authorId: string
): Promise<SupportInternalNote> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('support_internal_notes')
      .insert({
        ticket_id: ticketId,
        author_id: authorId,
        content: input.content,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError('INTERNAL_ERROR', 'Failed to add internal note');
    }

    return data as SupportInternalNote;
  } catch (error) {
    console.error('Add internal note error:', error);
    throw error;
  }
};

/**
 * Get agent's ticket queue
 */
export const getAgentQueue = async (
  agentId: string,
  params?: { status?: string; limit?: number }
): Promise<SupportTicketWithRelations[]> => {
  const supabase = getAdminClient();
  const limit = params?.limit || 50;

  try {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        requester:users!requester_id(id, email, full_name),
        property:properties(id, name),
        company:companies(id, name)
      `)
      .eq('assigned_to', agentId);

    if (params?.status) {
      query = query.eq('status', params.status);
    } else {
      // Default: only active tickets
      query = query.in('status', ['open', 'assigned', 'in_progress', 'waiting_on_customer']);
    }

    query = query.order('priority', { ascending: true }).order('created_at', { ascending: true }).limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch agent queue');
    }

    return (data || []) as SupportTicketWithRelations[];
  } catch (error) {
    console.error('Get agent queue error:', error);
    throw error;
  }
};

/**
 * Get ticket statistics
 */
export const getTicketStats = async (params?: {
  agent_id?: string;
  company_id?: string;
  date_from?: Date;
  date_to?: Date;
}): Promise<TicketStats> => {
  const supabase = getAdminClient();

  try {
    let query = supabase.from('support_tickets').select('*');

    if (params?.agent_id) {
      query = query.eq('assigned_to', params.agent_id);
    }

    if (params?.company_id) {
      query = query.eq('company_id', params.company_id);
    }

    if (params?.date_from) {
      query = query.gte('created_at', params.date_from.toISOString());
    }

    if (params?.date_to) {
      query = query.lte('created_at', params.date_to.toISOString());
    }

    const { data: tickets, error } = await query;

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch ticket stats');
    }

    const stats: TicketStats = {
      total: tickets?.length || 0,
      open: tickets?.filter((t) => t.status === 'open').length || 0,
      assigned: tickets?.filter((t) => t.status === 'assigned').length || 0,
      in_progress: tickets?.filter((t) => t.status === 'in_progress').length || 0,
      waiting_on_customer: tickets?.filter((t) => t.status === 'waiting_on_customer').length || 0,
      resolved: tickets?.filter((t) => t.status === 'resolved').length || 0,
      closed: tickets?.filter((t) => t.status === 'closed').length || 0,
      sla_breached: tickets?.filter((t) => t.sla_breached).length || 0,
      avg_resolution_time_hours: 0,
      avg_first_response_time_hours: 0,
    };

    // Calculate average resolution time
    const resolvedTickets = tickets?.filter((t) => t.resolved_at && t.created_at) || [];
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const resolved = new Date(t.resolved_at!).getTime();
        return sum + (resolved - created);
      }, 0);

      stats.avg_resolution_time_hours = Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60));
    }

    // Calculate average first response time
    const respondedTickets = tickets?.filter((t) => t.first_response_at && t.created_at) || [];
    if (respondedTickets.length > 0) {
      const totalResponseTime = respondedTickets.reduce((sum, t) => {
        const created = new Date(t.created_at).getTime();
        const responded = new Date(t.first_response_at!).getTime();
        return sum + (responded - created);
      }, 0);

      stats.avg_first_response_time_hours = Math.round(totalResponseTime / respondedTickets.length / (1000 * 60 * 60));
    }

    return stats;
  } catch (error) {
    console.error('Get ticket stats error:', error);
    throw error;
  }
};

// ============================================================================
// CANNED RESPONSES
// ============================================================================

/**
 * List canned responses
 */
export const listCannedResponses = async (params?: CannedResponseListParams): Promise<SupportCannedResponse[]> => {
  const supabase = getAdminClient();

  try {
    let query = supabase.from('support_canned_responses').select('*');

    if (params?.category) {
      query = query.eq('category', params.category);
    }

    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    if (params?.search) {
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }

    query = query.order('usage_count', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch canned responses');
    }

    return (data || []) as SupportCannedResponse[];
  } catch (error) {
    console.error('List canned responses error:', error);
    throw error;
  }
};

/**
 * Create canned response
 */
export const createCannedResponse = async (
  input: CreateCannedResponseInput,
  userId: string
): Promise<SupportCannedResponse> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('support_canned_responses')
      .insert({
        ...input,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError('INTERNAL_ERROR', 'Failed to create canned response');
    }

    return data as SupportCannedResponse;
  } catch (error) {
    console.error('Create canned response error:', error);
    throw error;
  }
};

/**
 * Update canned response
 */
export const updateCannedResponse = async (
  id: string,
  input: UpdateCannedResponseInput
): Promise<SupportCannedResponse> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('support_canned_responses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Canned response not found');
    }

    return data as SupportCannedResponse;
  } catch (error) {
    console.error('Update canned response error:', error);
    throw error;
  }
};

/**
 * Increment canned response usage count
 */
export const incrementCannedResponseUsage = async (id: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { error } = await supabase.rpc('increment', {
      table_name: 'support_canned_responses',
      row_id: id,
      column_name: 'usage_count',
    });

    // Fallback if RPC doesn't exist
    if (error) {
      const { data: response } = await supabase
        .from('support_canned_responses')
        .select('usage_count')
        .eq('id', id)
        .single();

      if (response) {
        await supabase
          .from('support_canned_responses')
          .update({ usage_count: (response.usage_count || 0) + 1 })
          .eq('id', id);
      }
    }
  } catch (error) {
    console.error('Increment canned response usage error:', error);
    // Don't throw - this is not critical
  }
};
