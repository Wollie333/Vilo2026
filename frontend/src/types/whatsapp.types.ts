/**
 * WhatsApp Types
 * Type definitions for WhatsApp Business API integration
 */

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export type TemplateType =
  | 'booking_confirmation'
  | 'payment_received'
  | 'payment_reminder'
  | 'pre_arrival'
  | 'booking_modified'
  | 'booking_cancelled';

export type MetaStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface WhatsAppMessageTemplate {
  id: string;
  property_id: string | null;
  template_type: TemplateType;
  template_name: string;
  language_code: string;

  // Template Content
  header_text: string | null;
  body_template: string;
  footer_text: string | null;
  button_config: Record<string, unknown> | null;

  // Meta WhatsApp API Status
  meta_template_id: string | null;
  meta_status: MetaStatus;
  meta_rejected_reason: string | null;
  submitted_to_meta_at: string | null;
  approved_at: string | null;

  // Timing Configuration
  is_enabled: boolean;
  send_timing_days_before: number | null;
  send_timing_hours_before: number | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  property_id?: string;
  template_type: TemplateType;
  template_name: string;
  language_code: string;
  header_text?: string;
  body_template: string;
  footer_text?: string;
  button_config?: Record<string, unknown>;
  send_timing_days_before?: number;
  send_timing_hours_before?: number;
  is_enabled?: boolean;
}

export interface UpdateTemplateInput {
  template_name?: string;
  body_template?: string;
  header_text?: string;
  footer_text?: string;
  button_config?: Record<string, unknown>;
  send_timing_days_before?: number;
  send_timing_hours_before?: number;
  is_enabled?: boolean;
}

export interface TemplateListParams {
  property_id?: string;
  template_type?: TemplateType;
  language_code?: string;
  meta_status?: MetaStatus;
  is_enabled?: boolean;
}

export interface TemplateListResponse {
  templates: WhatsAppMessageTemplate[];
  total_count: number;
}

// ============================================================================
// MESSAGE METADATA TYPES
// ============================================================================

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageDirection = 'outbound' | 'inbound';
export type MessageType = 'template' | 'text' | 'image' | 'document';

export interface WhatsAppMessageMetadata {
  id: string;
  chat_message_id: string;

  // WhatsApp API IDs
  whatsapp_message_id: string | null;
  whatsapp_conversation_id: string | null;

  // Delivery Tracking
  status: MessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;

  // Template Info
  template_id: string | null;
  template_variables: Record<string, unknown> | null;

  // Phone Numbers
  recipient_phone: string;
  sender_phone: string;

  // Meta
  direction: MessageDirection;
  message_type: MessageType;
  meta_response: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// SEND MESSAGE TYPES
// ============================================================================

export interface SendWhatsAppMessageRequest {
  booking_id: string;
  template_type?: TemplateType;
  message?: string;
}

export interface SendWhatsAppMessageResponse {
  success: boolean;
  message: string;
  chat_message_id?: string;
  whatsapp_message_id?: string;
}

// ============================================================================
// OPT-OUT TYPES
// ============================================================================

export type OptOutSource = 'user_request' | 'whatsapp_stop' | 'admin' | 'bounce';

export interface OptOutRecord {
  id: string;
  phone_number: string;
  guest_id: string | null;

  opted_out_at: string;
  opt_out_reason: string | null;
  opt_out_source: OptOutSource;

  opted_in_at: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// QUEUE TYPES
// ============================================================================

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface QueueItem {
  id: string;
  chat_message_id: string;
  whatsapp_metadata_id: string;

  status: QueueStatus;
  priority: number;
  retry_count: number;
  max_retries: number;

  next_retry_at: string | null;
  last_attempt_at: string | null;

  last_error: string | null;
  should_fallback_to_email: boolean;
  email_fallback_sent: boolean;
  email_fallback_sent_at: string | null;

  booking_id: string | null;
  trigger_type: string | null;

  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface QueueStats {
  total_count: number;
  pending_count: number;
  processing_count: number;
  failed_count: number;
  completed_count: number;
  avg_retry_count: number;
  email_fallback_count: number;
}

// ============================================================================
// PLACEHOLDER TYPES
// ============================================================================

export interface PlaceholderInfo {
  key: string;
  description: string;
  example: string;
  category: 'booking' | 'property' | 'payment' | 'links';
}

// ============================================================================
// TEMPLATE DATA (for rendering)
// ============================================================================

export interface TemplateData {
  // Booking placeholders
  booking_reference?: string;
  check_in_date?: string;
  check_out_date?: string;
  guest_name?: string;
  num_guests?: string;
  room_names?: string;
  total_nights?: string;

  // Property placeholders
  property_name?: string;
  property_address?: string;
  property_phone?: string;
  property_email?: string;
  check_in_time?: string;
  check_out_time?: string;

  // Payment placeholders
  total_amount?: string;
  amount_paid?: string;
  balance_due?: string;
  currency?: string;
  payment_method?: string;
  payment_link?: string;

  // Link placeholders
  booking_url?: string;
  payment_url?: string;
  invoice_url?: string;
  review_url?: string;
  cancellation_url?: string;
}
