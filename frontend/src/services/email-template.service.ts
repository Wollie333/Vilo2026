/**
 * Email Template Service (Frontend)
 *
 * API client for email template management.
 * All endpoints require super admin authentication.
 */

import { api } from './api.service';
import type {
  EmailTemplate,
  EmailTemplateCategory,
  GetTemplatesParams,
  GetTemplatesResponse,
  CreateTemplateInput,
  UpdateTemplateInput,
  PreviewTemplateInput,
  PreviewTemplateOutput,
  SyncToSupabaseResponse,
  EmailTemplateAnalytics,
  EmailTemplateChangelog,
  EmailSend,
} from '../types/email-template.types';

// ============================================================================
// Categories
// ============================================================================

export const getCategories = async (): Promise<EmailTemplateCategory[]> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Fetching categories');
  const response = await api.get<{ categories: EmailTemplateCategory[] }>('/admin/email/categories');

  if (!response.success || !response.data) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Failed to fetch categories:', response.error);
    throw new Error(response.error?.message || 'Failed to fetch categories');
  }

  return response.data.categories;
};

// ============================================================================
// Templates - CRUD
// ============================================================================

export const getTemplates = async (params?: GetTemplatesParams): Promise<GetTemplatesResponse> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Fetching templates:', params);
  const response = await api.get<GetTemplatesResponse>('/admin/email/templates', { params });

  if (!response.success || !response.data) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Failed to fetch templates:', response.error);
    throw new Error(response.error?.message || 'Failed to fetch templates');
  }

  return response.data;
};

export const getTemplate = async (id: string): Promise<EmailTemplate> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Fetching template:', id);
  const response = await api.get<{ template: EmailTemplate }>(`/admin/email/templates/${id}`);

  if (!response.success || !response.data) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Failed to fetch template:', response.error);
    throw new Error(response.error?.message || 'Failed to fetch template');
  }

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Operation failed');
  }
  return response.data.template;
};

export const createTemplate = async (input: CreateTemplateInput): Promise<EmailTemplate> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Creating template');
  const response = await api.post('/admin/email/templates', input);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Operation failed');
  }
  return response.data.template;
};

export const updateTemplate = async (
  id: string,
  input: UpdateTemplateInput
): Promise<EmailTemplate> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Updating template:', id);
  const response = await api.put(`/admin/email/templates/${id}`, input);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Operation failed');
  }
  return response.data.template;
};

export const toggleTemplate = async (
  id: string,
  isActive: boolean
): Promise<EmailTemplate> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Toggling template:', id, isActive);
  const response = await api.patch(`/admin/email/templates/${id}/toggle`, {
    is_active: isActive,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Operation failed');
  }
  return response.data.template;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Deleting template:', id);
  await api.delete(`/admin/email/templates/${id}`);
};

// ============================================================================
// Preview & Testing
// ============================================================================

export const previewTemplate = async (
  input: PreviewTemplateInput
): Promise<PreviewTemplateOutput> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Previewing template');
  const response = await api.post('/admin/email/templates/preview', input);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Preview failed');
  }
  return response.data.preview;
};

export const sendTestEmail = async (
  templateId: string,
  recipientEmail: string,
  testVariables: Record<string, any>
): Promise<EmailSend> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Sending test email');
  const response = await api.post(`/admin/email/templates/${templateId}/test`, {
    recipient_email: recipientEmail,
    test_variables: testVariables,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to send test email');
  }
  return response.data.emailSend;
};

// ============================================================================
// Supabase Integration
// ============================================================================

export const syncToSupabase = async (templateId: string): Promise<SyncToSupabaseResponse> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Syncing to Supabase:', templateId);
  const response = await api.post<SyncToSupabaseResponse>(`/admin/email/templates/${templateId}/sync-supabase`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Sync failed');
  }

  return response.data;
};

// ============================================================================
// Analytics
// ============================================================================

export const getTemplateAnalytics = async (templateId: string): Promise<EmailTemplateAnalytics> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Fetching analytics:', templateId);
  const response = await api.get<{ analytics: EmailTemplateAnalytics }>(`/admin/email/templates/${templateId}/analytics`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch analytics');
  }

  return response.data.analytics;
};

export const getTemplateChangelog = async (templateId: string): Promise<EmailTemplateChangelog[]> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Fetching changelog:', templateId);
  const response = await api.get<{ changelog: EmailTemplateChangelog[] }>(`/admin/email/templates/${templateId}/changelog`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch changelog');
  }

  return response.data.changelog;
};
