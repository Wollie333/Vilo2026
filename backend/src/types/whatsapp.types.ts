/**
 * WhatsApp Business API Integration Types
 * Types for templates, messages, queue, opt-outs, and Meta API responses
 */

// ============================================================================
// ENUM TYPES
// ============================================================================

export type TemplateType =
  | 'booking_confirmation'
  | 'payment_received'
  | 'payment_reminder'
  | 'pre_arrival'
  | 'booking_modified'
  | 'booking_cancelled';

export type MetaTemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageDirection = 'outbound' | 'inbound';

export type MessageType = 'template' | 'text' | 'image' | 'document' | 'video' | 'audio';

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type TriggerType =
  | 'booking_created'
  | 'payment_received'
  | 'payment_reminder'
  | 'pre_arrival'
  | 'booking_modified'
  | 'booking_cancelled'
  | 'manual';

export type OptOutSource = 'user_request' | 'whatsapp_stop' | 'admin' | 'bounce';

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

export interface WhatsAppMessageTemplateRow {
  id: string;
  property_id: string | null;
  template_type: TemplateType;
  template_name: string;
  language_code: string;
  header_text: string | null;
  body_template: string;
  footer_text: string | null;
  button_config: Record<string, any> | null;
  meta_template_id: string | null;
  meta_status: MetaTemplateStatus;
  meta_rejected_reason: string | null;
  submitted_to_meta_at: Date | null;
  approved_at: Date | null;
  is_enabled: boolean;
  send_timing_days_before: number | null;
  send_timing_hours_before: number | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WhatsAppMessageMetadataRow {
  id: string;
  chat_message_id: string;
  whatsapp_message_id: string | null;
  whatsapp_conversation_id: string | null;
  status: MessageStatus;
  sent_at: Date | null;
  delivered_at: Date | null;
  read_at: Date | null;
  failed_at: Date | null;
  failure_reason: string | null;
  template_id: string | null;
  template_variables: Record<string, any> | null;
  recipient_phone: string | null;
  sender_phone: string | null;
  direction: MessageDirection;
  message_type: MessageType;
  meta_response: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface WhatsAppMessageQueueRow {
  id: string;
  chat_message_id: string | null;
  whatsapp_metadata_id: string | null;
  status: QueueStatus;
  priority: number;
  retry_count: number;
  max_retries: number;
  next_retry_at: Date | null;
  last_attempt_at: Date | null;
  last_error: string | null;
  should_fallback_to_email: boolean;
  email_fallback_sent: boolean;
  email_fallback_sent_at: Date | null;
  booking_id: string | null;
  trigger_type: TriggerType | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

export interface WhatsAppOptOutRow {
  id: string;
  phone_number: string;
  guest_id: string | null;
  opted_out_at: Date;
  opt_out_reason: string | null;
  opt_out_source: OptOutSource;
  opted_in_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateTemplateInput {
  property_id?: string;
  template_type: TemplateType;
  template_name: string;
  language_code: string;
  header_text?: string;
  body_template: string;
  footer_text?: string;
  button_config?: Record<string, any>;
  is_enabled?: boolean;
  send_timing_days_before?: number;
  send_timing_hours_before?: number;
}

export interface UpdateTemplateInput {
  template_name?: string;
  header_text?: string;
  body_template?: string;
  footer_text?: string;
  button_config?: Record<string, any>;
  is_enabled?: boolean;
  send_timing_days_before?: number;
  send_timing_hours_before?: number;
}

export interface TemplateListParams {
  property_id?: string;
  template_type?: TemplateType;
  language_code?: string;
  meta_status?: MetaTemplateStatus;
  is_enabled?: boolean;
  page?: number;
  limit?: number;
}

export interface SendWhatsAppMessageInput {
  recipient_phone: string;
  message_type: 'template' | 'text';
  template_id?: string;
  template_variables?: Record<string, any>;
  text_content?: string;
  booking_id?: string;
  conversation_id?: string;
}

export interface OptOutInput {
  phone_number: string;
  guest_id?: string;
  opt_out_reason?: string;
  opt_out_source: OptOutSource;
}

// ============================================================================
// TEMPLATE RENDERING TYPES
// ============================================================================

export interface TemplateData {
  // Booking placeholders
  booking_reference?: string;
  check_in_date?: string;
  check_out_date?: string;
  guest_name?: string;
  num_guests?: number;
  room_names?: string;
  total_nights?: number;

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

  // Additional custom placeholders
  [key: string]: string | number | undefined;
}

export interface RenderedTemplate {
  header?: string;
  body: string;
  footer?: string;
  buttons?: any[];
}

// ============================================================================
// META WHATSAPP API TYPES
// ============================================================================

export interface MetaSendTemplateRequest {
  messaging_product: 'whatsapp';
  to: string; // E.164 phone number
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'header' | 'body' | 'footer' | 'button';
      parameters?: Array<{
        type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
        text?: string;
        [key: string]: any;
      }>;
    }>;
  };
}

export interface MetaSendTextRequest {
  messaging_product: 'whatsapp';
  to: string; // E.164 phone number
  type: 'text';
  text: {
    body: string;
  };
}

export interface MetaSendResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string; // WhatsApp message ID
  }>;
}

export interface MetaWebhookMessage {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'image' | 'document' | 'audio' | 'video';
          text?: {
            body: string;
          };
          image?: {
            id: string;
            mime_type: string;
            sha256: string;
          };
          document?: {
            id: string;
            filename: string;
            mime_type: string;
            sha256: string;
          };
        }>;
        statuses?: Array<{
          id: string; // WhatsApp message ID
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface MetaTemplateSubmission {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
    text?: string;
    buttons?: Array<{
      type: 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface WhatsAppSendResult {
  success: boolean;
  whatsapp_message_id?: string;
  chat_message_id?: string;
  error?: string;
}

export interface QueueProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  retried: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PlaceholderDefinition {
  key: string;
  description: string;
  example: string;
}

export interface PlaceholderCategories {
  booking: PlaceholderDefinition[];
  property: PlaceholderDefinition[];
  payment: PlaceholderDefinition[];
  links: PlaceholderDefinition[];
}

// ============================================================================
// EXPORTS
// ============================================================================

export type WhatsAppMessageTemplate = WhatsAppMessageTemplateRow;
export type WhatsAppMessageMetadata = WhatsAppMessageMetadataRow;
export type WhatsAppMessageQueue = WhatsAppMessageQueueRow;
export type WhatsAppOptOut = WhatsAppOptOutRow;
