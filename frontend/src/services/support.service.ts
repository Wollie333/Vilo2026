import { api } from './api.service';
import type {
  SupportTicket,
  SupportTicketWithContext,
  SupportCannedResponse,
  SupportInternalNote,
  CreateTicketInput,
  UpdateTicketInput,
  AssignTicketInput,
  ResolveTicketInput,
  AddInternalNoteInput,
  CreateCannedResponseInput,
  UpdateCannedResponseInput,
  TicketListParams,
  CannedResponseListParams,
  TicketListResponse,
  TicketStatsResponse,
} from '@/types/support.types';

// ============================================================================
// Support Service
// ============================================================================

class SupportService {
  // ==========================================================================
  // TICKET MANAGEMENT
  // ==========================================================================

  /**
   * List support tickets with optional filters
   */
  async listTickets(params: TicketListParams = {}): Promise<TicketListResponse> {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.category) queryParams.append('category', params.category);
    if (params.assigned_to) queryParams.append('assigned_to', params.assigned_to);
    if (params.requester_id) queryParams.append('requester_id', params.requester_id);
    if (params.company_id) queryParams.append('company_id', params.company_id);
    if (params.sla_breached !== undefined)
      queryParams.append('sla_breached', String(params.sla_breached));
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/support/tickets${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<TicketListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch support tickets');
    }

    return response.data;
  }

  /**
   * Get a single support ticket by ID
   */
  async getTicket(id: string): Promise<SupportTicket> {
    const response = await api.get<SupportTicket>(`/support/tickets/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch support ticket');
    }

    return response.data;
  }

  /**
   * Get ticket with full customer context
   */
  async getTicketWithContext(id: string): Promise<SupportTicketWithContext> {
    const response = await api.get<SupportTicketWithContext>(`/support/tickets/${id}/context`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch ticket context');
    }

    return response.data;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketInput): Promise<SupportTicket> {
    const response = await api.post<SupportTicket>('/support/tickets', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create support ticket');
    }

    return response.data;
  }

  /**
   * Update a support ticket
   */
  async updateTicket(id: string, data: UpdateTicketInput): Promise<SupportTicket> {
    const response = await api.patch<SupportTicket>(`/support/tickets/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update support ticket');
    }

    return response.data;
  }

  /**
   * Assign ticket to an agent
   */
  async assignTicket(id: string, data: AssignTicketInput): Promise<SupportTicket> {
    const response = await api.post<SupportTicket>(`/support/tickets/${id}/assign`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to assign ticket');
    }

    return response.data;
  }

  /**
   * Resolve a ticket
   */
  async resolveTicket(id: string, data: ResolveTicketInput): Promise<SupportTicket> {
    const response = await api.post<SupportTicket>(`/support/tickets/${id}/resolve`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to resolve ticket');
    }

    return response.data;
  }

  /**
   * Close a ticket (optionally archive conversation)
   */
  async closeTicket(id: string, archiveConversation: boolean = false): Promise<SupportTicket> {
    const response = await api.post<SupportTicket>(`/support/tickets/${id}/close`, {
      archive_conversation: archiveConversation,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to close ticket');
    }

    return response.data;
  }

  /**
   * Add an internal note to a ticket
   */
  async addInternalNote(id: string, data: AddInternalNoteInput): Promise<SupportInternalNote> {
    const response = await api.post<SupportInternalNote>(`/support/tickets/${id}/notes`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add internal note');
    }

    return response.data;
  }

  /**
   * Get agent's ticket queue
   */
  async getMyQueue(params?: { status?: string; limit?: number }): Promise<SupportTicket[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const queryString = queryParams.toString();
    const url = `/support/tickets/my-queue${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<SupportTicket[]>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch ticket queue');
    }

    return response.data;
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(params?: {
    agent_id?: string;
    company_id?: string;
    date_from?: Date;
    date_to?: Date;
  }): Promise<TicketStatsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.agent_id) queryParams.append('agent_id', params.agent_id);
    if (params?.company_id) queryParams.append('company_id', params.company_id);
    if (params?.date_from) queryParams.append('date_from', params.date_from.toISOString());
    if (params?.date_to) queryParams.append('date_to', params.date_to.toISOString());

    const queryString = queryParams.toString();
    const url = `/support/tickets/stats${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<TicketStatsResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch ticket stats');
    }

    return response.data;
  }

  // ==========================================================================
  // CANNED RESPONSES
  // ==========================================================================

  /**
   * List canned responses
   */
  async listCannedResponses(
    params: CannedResponseListParams = {}
  ): Promise<SupportCannedResponse[]> {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = `/support/canned-responses${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<SupportCannedResponse[]>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch canned responses');
    }

    return response.data;
  }

  /**
   * Create a canned response
   */
  async createCannedResponse(data: CreateCannedResponseInput): Promise<SupportCannedResponse> {
    const response = await api.post<SupportCannedResponse>('/support/canned-responses', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create canned response');
    }

    return response.data;
  }

  /**
   * Update a canned response
   */
  async updateCannedResponse(
    id: string,
    data: UpdateCannedResponseInput
  ): Promise<SupportCannedResponse> {
    const response = await api.patch<SupportCannedResponse>(
      `/support/canned-responses/${id}`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update canned response');
    }

    return response.data;
  }

  /**
   * Use a canned response (increment usage count)
   */
  async useCannedResponse(id: string): Promise<void> {
    const response = await api.post(`/support/canned-responses/${id}/use`, {});

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to use canned response');
    }
  }
}

export const supportService = new SupportService();
