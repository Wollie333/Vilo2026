/**
 * Email Template Types
 *
 * Type definitions for the email management system.
 * Used by email-template.service.ts and admin-email.controller.ts
 */

// ============================================================================
// Enum Types
// ============================================================================

export type EmailTemplateType = 'application' | 'supabase_auth';
export type EmailSendStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
export type EmailChangeType = 'created' | 'updated' | 'enabled' | 'disabled' | 'synced_to_supabase';
export type EmailVariableType = 'string' | 'number' | 'boolean' | 'date';

// ============================================================================
// Variable Metadata
// ============================================================================

export interface EmailTemplateVariable {
  name: string;
  type: EmailVariableType;
  description: string;
  required: boolean;
  example: string;
}

// ============================================================================
// Database Entities
// ============================================================================

export interface EmailTemplateCategory {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  parent_id?: string;
  icon?: string;
  sort_order: number;
  is_system_category: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  category_id: string;
  template_key: string;
  display_name: string;
  description?: string;
  template_type: EmailTemplateType;
  supabase_template_name?: string;
  subject_template: string;
  html_template: string;
  text_template?: string;
  variables: EmailTemplateVariable[];
  feature_tag?: string;
  stage_tag?: string;
  is_active: boolean;
  is_system_template: boolean;
  send_count: number;
  last_sent_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;

  // Relations (populated in queries)
  category?: EmailTemplateCategory;
}

export interface EmailSend {
  id: string;
  template_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  variables_used: Record<string, any>;
  status: EmailSendStatus;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  provider?: string;
  provider_message_id?: string;
  error_message?: string;
  context_type?: string;
  context_id?: string;
  created_at: string;
  created_by?: string;

  // Relations
  template?: EmailTemplate;
}

export interface EmailTemplateChangelog {
  id: string;
  template_id: string;
  changed_by?: string;
  change_type: EmailChangeType;
  changes: Record<string, any>;
  previous_state?: Record<string, any>;
  notes?: string;
  created_at: string;

  // Relations
  template?: EmailTemplate;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// ============================================================================
// Service Input/Output Types
// ============================================================================

// Get Templates
export interface GetTemplatesParams {
  category_id?: string;
  template_type?: EmailTemplateType;
  feature_tag?: string;
  is_active?: boolean;
  search?: string; // Search by display_name or template_key
}

export interface GetTemplatesResponse {
  templates: EmailTemplate[];
  total: number;
}

// Create Template
export interface CreateTemplateInput {
  category_id: string;
  template_key: string;
  display_name: string;
  description?: string;
  template_type: EmailTemplateType;
  supabase_template_name?: string;
  subject_template: string;
  html_template: string;
  text_template?: string;
  variables: EmailTemplateVariable[];
  feature_tag?: string;
  stage_tag?: string;
  is_active?: boolean;
}

// Update Template
export interface UpdateTemplateInput {
  category_id?: string;
  display_name?: string;
  description?: string;
  subject_template?: string;
  html_template?: string;
  text_template?: string;
  variables?: EmailTemplateVariable[];
  feature_tag?: string;
  stage_tag?: string;
  is_active?: boolean;
}

// Send Email from Template
export interface SendEmailFromTemplateOptions {
  template_key: string;
  recipient_email: string;
  recipient_name?: string;
  variables: Record<string, any>;
  context_type?: string;
  context_id?: string;
  send_immediately?: boolean; // If false, queue for later (default: true)
}

// Preview Template
export interface PreviewTemplateInput {
  subject_template: string;
  html_template: string;
  variables: Record<string, any>;
}

export interface PreviewTemplateOutput {
  subject: string;
  html: string;
  text?: string;
}

// Test Email
export interface SendTestEmailInput {
  template_id: string;
  recipient_email: string;
  test_variables: Record<string, any>;
}

// Supabase Sync
export interface SyncToSupabaseInput {
  template_id: string;
}

export interface SyncToSupabaseResponse {
  success: boolean;
  supabase_template_name: string;
  synced_at: string;
  error?: string;
}

// Analytics
export interface EmailTemplateAnalytics {
  total_sends: number;
  by_status: Record<EmailSendStatus, number>;
  recent_sends: EmailSend[];
}
