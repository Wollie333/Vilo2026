import { api } from './api.service';
import type {
  WhatsAppMessageTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateListParams,
  TemplateListResponse,
  WhatsAppMessageMetadata,
  SendWhatsAppMessageRequest,
  SendWhatsAppMessageResponse,
  OptOutRecord,
  QueueStats,
  QueueItem,
  PlaceholderInfo,
  TemplateType,
} from '@/types/whatsapp.types';

// ============================================================================
// WhatsApp Service
// ============================================================================

class WhatsAppService {
  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  /**
   * List WhatsApp templates with optional filters
   */
  async listTemplates(params: TemplateListParams = {}): Promise<TemplateListResponse> {
    const queryParams = new URLSearchParams();

    if (params.property_id) queryParams.append('property_id', params.property_id);
    if (params.template_type) queryParams.append('template_type', params.template_type);
    if (params.language_code) queryParams.append('language_code', params.language_code);
    if (params.meta_status) queryParams.append('meta_status', params.meta_status);
    if (params.is_enabled !== undefined) queryParams.append('is_enabled', String(params.is_enabled));

    const queryString = queryParams.toString();
    const url = `/whatsapp/templates${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<TemplateListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch WhatsApp templates');
    }

    return response.data;
  }

  /**
   * Get a single WhatsApp template by ID
   */
  async getTemplate(id: string): Promise<WhatsAppMessageTemplate> {
    const response = await api.get<WhatsAppMessageTemplate>(`/whatsapp/templates/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch WhatsApp template');
    }

    return response.data;
  }

  /**
   * Create a new WhatsApp template
   */
  async createTemplate(data: CreateTemplateInput): Promise<WhatsAppMessageTemplate> {
    const response = await api.post<WhatsAppMessageTemplate>('/whatsapp/templates', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create WhatsApp template');
    }

    return response.data;
  }

  /**
   * Update an existing WhatsApp template
   */
  async updateTemplate(id: string, data: UpdateTemplateInput): Promise<WhatsAppMessageTemplate> {
    const response = await api.patch<WhatsAppMessageTemplate>(`/whatsapp/templates/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update WhatsApp template');
    }

    return response.data;
  }

  /**
   * Delete a WhatsApp template
   */
  async deleteTemplate(id: string): Promise<void> {
    const response = await api.delete(`/whatsapp/templates/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete WhatsApp template');
    }
  }

  /**
   * Submit a template to Meta for approval
   */
  async submitTemplateToMeta(id: string): Promise<WhatsAppMessageTemplate> {
    const response = await api.post<WhatsAppMessageTemplate>(
      `/whatsapp/templates/${id}/submit-to-meta`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to submit template to Meta');
    }

    return response.data;
  }

  /**
   * Get Meta approval status for a template
   */
  async getTemplateStatus(id: string): Promise<WhatsAppMessageTemplate> {
    const response = await api.get<WhatsAppMessageTemplate>(`/whatsapp/templates/${id}/status`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch template status');
    }

    return response.data;
  }

  /**
   * Get available placeholders for a template type
   */
  async getPlaceholders(templateType: TemplateType): Promise<PlaceholderInfo[]> {
    const response = await api.get<PlaceholderInfo[]>(
      `/whatsapp/templates/placeholders/${templateType}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch placeholders');
    }

    return response.data;
  }

  // ==========================================================================
  // MESSAGE MANAGEMENT
  // ==========================================================================

  /**
   * Get WhatsApp message delivery status
   */
  async getMessageStatus(chatMessageId: string): Promise<WhatsAppMessageMetadata> {
    const response = await api.get<WhatsAppMessageMetadata>(
      `/whatsapp/messages/${chatMessageId}/status`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch message status');
    }

    return response.data;
  }

  /**
   * Get WhatsApp message metadata
   */
  async getMessageMetadata(chatMessageId: string): Promise<WhatsAppMessageMetadata> {
    const response = await api.get<WhatsAppMessageMetadata>(
      `/whatsapp/messages/${chatMessageId}/metadata`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch message metadata');
    }

    return response.data;
  }

  /**
   * Manually send a WhatsApp message
   */
  async sendMessage(data: SendWhatsAppMessageRequest): Promise<SendWhatsAppMessageResponse> {
    const response = await api.post<SendWhatsAppMessageResponse>('/whatsapp/messages/send', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send WhatsApp message');
    }

    return response.data;
  }

  // ==========================================================================
  // OPT-OUT MANAGEMENT
  // ==========================================================================

  /**
   * List WhatsApp opt-outs
   */
  async listOptOuts(): Promise<OptOutRecord[]> {
    const response = await api.get<OptOutRecord[]>('/whatsapp/opt-outs');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch opt-outs');
    }

    return response.data;
  }

  /**
   * Add a phone number to opt-out list
   */
  async addOptOut(phone: string, reason?: string): Promise<OptOutRecord> {
    const response = await api.post<OptOutRecord>('/whatsapp/opt-outs', {
      phone_number: phone,
      opt_out_reason: reason,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add opt-out');
    }

    return response.data;
  }

  /**
   * Remove a phone number from opt-out list (re-opt-in)
   */
  async removeOptOut(phone: string): Promise<void> {
    const response = await api.delete(`/whatsapp/opt-outs/${encodeURIComponent(phone)}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove opt-out');
    }
  }

  /**
   * Check opt-out status for a phone number
   */
  async checkOptOutStatus(phone: string): Promise<{ opted_out: boolean; record?: OptOutRecord }> {
    const response = await api.get<{ opted_out: boolean; record?: OptOutRecord }>(
      `/whatsapp/opt-outs/${encodeURIComponent(phone)}/status`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check opt-out status');
    }

    return response.data;
  }

  // ==========================================================================
  // QUEUE MANAGEMENT (Admin only)
  // ==========================================================================

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const response = await api.get<QueueStats>('/whatsapp/queue');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch queue stats');
    }

    return response.data;
  }

  /**
   * List pending queue items
   */
  async listPendingItems(): Promise<QueueItem[]> {
    const response = await api.get<QueueItem[]>('/whatsapp/queue/pending');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch pending queue items');
    }

    return response.data;
  }

  /**
   * Manually retry a queue item
   */
  async retryQueueItem(id: string): Promise<void> {
    const response = await api.post(`/whatsapp/queue/${id}/retry`, {});

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to retry queue item');
    }
  }

  /**
   * Cancel a queued message
   */
  async cancelQueueItem(id: string): Promise<void> {
    const response = await api.delete(`/whatsapp/queue/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to cancel queue item');
    }
  }

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  /**
   * Get WhatsApp configuration status
   */
  async getConfigStatus(): Promise<{
    configured: boolean;
    phone_number_id?: string;
    environment?: 'test' | 'live';
  }> {
    const response = await api.get<{
      configured: boolean;
      phone_number_id?: string;
      environment?: 'test' | 'live';
    }>('/whatsapp/config');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch WhatsApp config status');
    }

    return response.data;
  }
}

export const whatsappService = new WhatsAppService();
