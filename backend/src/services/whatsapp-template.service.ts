/**
 * WhatsApp Template Service
 * Handles template management, rendering, and placeholder replacement
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import type {
  WhatsAppMessageTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateListParams,
  TemplateType,
  TemplateData,
  RenderedTemplate,
  PlaceholderCategories,
  PlaceholderDefinition,
} from '../types/whatsapp.types';

/**
 * Available placeholders by category
 */
export const PLACEHOLDER_DEFINITIONS: PlaceholderCategories = {
  booking: [
    { key: 'booking_reference', description: 'Unique booking reference number', example: 'BK-2026-0123' },
    { key: 'check_in_date', description: 'Guest check-in date', example: '15 Jan 2026' },
    { key: 'check_out_date', description: 'Guest check-out date', example: '18 Jan 2026' },
    { key: 'guest_name', description: 'Guest full name', example: 'John Smith' },
    { key: 'num_guests', description: 'Number of guests', example: '2' },
    { key: 'room_names', description: 'Comma-separated room names', example: 'Deluxe Suite, Garden Room' },
    { key: 'total_nights', description: 'Total number of nights', example: '3' },
  ],
  property: [
    { key: 'property_name', description: 'Property name', example: 'Sunset Beach Villa' },
    { key: 'property_address', description: 'Property full address', example: '123 Beach Road, Cape Town' },
    { key: 'property_phone', description: 'Property contact phone', example: '+27821234567' },
    { key: 'property_email', description: 'Property contact email', example: 'info@sunsetvilla.com' },
    { key: 'check_in_time', description: 'Standard check-in time', example: '14:00' },
    { key: 'check_out_time', description: 'Standard check-out time', example: '10:00' },
  ],
  payment: [
    { key: 'total_amount', description: 'Total booking amount', example: 'R 4,500.00' },
    { key: 'amount_paid', description: 'Amount already paid', example: 'R 1,500.00' },
    { key: 'balance_due', description: 'Outstanding balance', example: 'R 3,000.00' },
    { key: 'currency', description: 'Currency code', example: 'ZAR' },
    { key: 'payment_method', description: 'Payment method used', example: 'Credit Card' },
    { key: 'payment_link', description: 'Link to make payment', example: 'https://pay.vilo.com/abc123' },
  ],
  links: [
    { key: 'booking_url', description: 'Link to view booking details', example: 'https://vilo.com/bookings/123' },
    { key: 'payment_url', description: 'Link to payment page', example: 'https://vilo.com/pay/123' },
    { key: 'invoice_url', description: 'Link to download invoice', example: 'https://vilo.com/invoices/123' },
    { key: 'review_url', description: 'Link to leave a review', example: 'https://vilo.com/review/123' },
    { key: 'cancellation_url', description: 'Link to cancel booking', example: 'https://vilo.com/cancel/123' },
  ],
};

/**
 * Get available placeholders for a template type
 */
export const getAvailablePlaceholders = (templateType?: TemplateType): PlaceholderCategories => {
  // Return all placeholders by default
  return PLACEHOLDER_DEFINITIONS;
};

/**
 * Replace {{placeholders}} in template text with actual values
 */
export const replacePlaceholders = (template: string, data: TemplateData): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      return String(value);
    }
    // Return placeholder as-is if no value provided (for preview/testing)
    return match;
  });
};

/**
 * Render a template with data
 */
export const renderTemplate = (
  template: WhatsAppMessageTemplate,
  data: TemplateData
): RenderedTemplate => {
  return {
    header: template.header_text ? replacePlaceholders(template.header_text, data) : undefined,
    body: replacePlaceholders(template.body_template, data),
    footer: template.footer_text ? replacePlaceholders(template.footer_text, data) : undefined,
    buttons: template.button_config ? (template.button_config as any).buttons : undefined,
  };
};

/**
 * Get template with fallback logic
 * Priority: property + language → global + language → property + en → global + en
 */
export const getTemplate = async (params: {
  property_id?: string;
  template_type: TemplateType;
  language_code: string;
}): Promise<WhatsAppMessageTemplate | null> => {
  const supabase = getAdminClient();
  const { property_id, template_type, language_code } = params;

  try {
    // Try 1: Property-specific template in requested language
    if (property_id) {
      const { data } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('property_id', property_id)
        .eq('template_type', template_type)
        .eq('language_code', language_code)
        .eq('is_enabled', true)
        .eq('meta_status', 'approved')
        .single();

      if (data) {
        return data as WhatsAppMessageTemplate;
      }
    }

    // Try 2: Global template in requested language
    {
      const { data } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .is('property_id', null)
        .eq('template_type', template_type)
        .eq('language_code', language_code)
        .eq('is_enabled', true)
        .eq('meta_status', 'approved')
        .single();

      if (data) {
        return data as WhatsAppMessageTemplate;
      }
    }

    // Try 3: Property-specific template in English (fallback language)
    if (property_id && language_code !== 'en') {
      const { data } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('property_id', property_id)
        .eq('template_type', template_type)
        .eq('language_code', 'en')
        .eq('is_enabled', true)
        .eq('meta_status', 'approved')
        .single();

      if (data) {
        return data as WhatsAppMessageTemplate;
      }
    }

    // Try 4: Global template in English (last fallback)
    if (language_code !== 'en') {
      const { data } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .is('property_id', null)
        .eq('template_type', template_type)
        .eq('language_code', 'en')
        .eq('is_enabled', true)
        .eq('meta_status', 'approved')
        .single();

      if (data) {
        return data as WhatsAppMessageTemplate;
      }
    }

    // No template found
    return null;
  } catch (error) {
    console.error('Get template error:', error);
    return null;
  }
};

/**
 * List templates with filters and pagination
 */
export const listTemplates = async (params: TemplateListParams): Promise<{
  templates: WhatsAppMessageTemplate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const supabase = getAdminClient();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('whatsapp_message_templates')
      .select('*', { count: 'exact' });

    // Apply filters
    // Include both property-specific AND global templates when property_id is provided
    if (params.property_id !== undefined) {
      if (params.property_id) {
        // Get templates for this property OR global templates (property_id IS NULL)
        query = query.or(`property_id.eq.${params.property_id},property_id.is.null`);
      } else {
        // Only global templates
        query = query.is('property_id', null);
      }
    }

    if (params.template_type) {
      query = query.eq('template_type', params.template_type);
    }

    if (params.language_code) {
      query = query.eq('language_code', params.language_code);
    }

    if (params.meta_status) {
      query = query.eq('meta_status', params.meta_status);
    }

    if (params.is_enabled !== undefined) {
      query = query.eq('is_enabled', params.is_enabled);
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to fetch templates');
    }

    const templates = (data || []) as WhatsAppMessageTemplate[];
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      templates,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error('List templates error:', error);
    throw error;
  }
};

/**
 * Get single template by ID
 */
export const getTemplateById = async (id: string): Promise<WhatsAppMessageTemplate> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Template not found');
    }

    return data as WhatsAppMessageTemplate;
  } catch (error) {
    console.error('Get template by ID error:', error);
    throw error;
  }
};

/**
 * Create a new template
 */
export const createTemplate = async (
  input: CreateTemplateInput,
  userId: string
): Promise<WhatsAppMessageTemplate> => {
  const supabase = getAdminClient();

  try {
    const templateData = {
      ...input,
      created_by: userId,
      meta_status: 'draft',
    };

    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new AppError(
          'VALIDATION_ERROR',
          'A template with this type and language already exists for this property'
        );
      }
      throw new AppError('INTERNAL_ERROR', 'Failed to create template');
    }

    return data as WhatsAppMessageTemplate;
  } catch (error) {
    console.error('Create template error:', error);
    throw error;
  }
};

/**
 * Update a template
 */
export const updateTemplate = async (
  id: string,
  input: UpdateTemplateInput
): Promise<WhatsAppMessageTemplate> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Template not found');
    }

    return data as WhatsAppMessageTemplate;
  } catch (error) {
    console.error('Update template error:', error);
    throw error;
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  const supabase = getAdminClient();

  try {
    const { error } = await supabase
      .from('whatsapp_message_templates')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to delete template');
    }
  } catch (error) {
    console.error('Delete template error:', error);
    throw error;
  }
};

/**
 * Submit template to Meta for approval
 * Note: This requires Meta Business Manager API credentials and additional setup
 */
export const submitTemplateToMeta = async (id: string): Promise<{
  success: boolean;
  meta_template_id?: string;
  error?: string;
}> => {
  const supabase = getAdminClient();

  try {
    // Get template
    const template = await getTemplateById(id);

    // TODO: Implement actual Meta API submission
    // This requires Meta Business Manager API credentials
    // For now, mark as pending
    const { error } = await supabase
      .from('whatsapp_message_templates')
      .update({
        meta_status: 'pending',
        submitted_to_meta_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new AppError('INTERNAL_ERROR', 'Failed to update template status');
    }

    console.log(`Template ${template.template_name} marked as pending Meta approval`);

    return {
      success: true,
      meta_template_id: undefined, // Will be set by webhook when approved
    };
  } catch (error: any) {
    console.error('Submit template to Meta error:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit template',
    };
  }
};

/**
 * Get Meta approval status for a template
 */
export const getTemplateStatus = async (id: string): Promise<{
  meta_status: string;
  meta_template_id: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  rejected_reason: string | null;
}> => {
  const supabase = getAdminClient();

  try {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .select('meta_status, meta_template_id, submitted_to_meta_at, approved_at, meta_rejected_reason')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new AppError('NOT_FOUND', 'Template not found');
    }

    return {
      meta_status: data.meta_status,
      meta_template_id: data.meta_template_id,
      submitted_at: data.submitted_to_meta_at,
      approved_at: data.approved_at,
      rejected_reason: data.meta_rejected_reason,
    };
  } catch (error) {
    console.error('Get template status error:', error);
    throw error;
  }
};

/**
 * Detect language from country code (from phone number)
 */
export const detectLanguageFromCountryCode = (countryCode: string): string => {
  const countryToLanguage: Record<string, string> = {
    'ZA': 'en', // South Africa
    'GB': 'en', // United Kingdom
    'US': 'en', // United States
    'DE': 'de', // Germany
    'FR': 'fr', // France
    'ES': 'es', // Spain
    'IT': 'it', // Italy
    'PT': 'pt', // Portugal
    'NL': 'nl', // Netherlands
    'PL': 'pl', // Poland
    'BR': 'pt', // Brazil
    'MX': 'es', // Mexico
    'AR': 'es', // Argentina
  };

  return countryToLanguage[countryCode] || 'en';
};

/**
 * Parse phone number and detect country code
 * Simple implementation - in production, use libphonenumber-js
 */
export const detectLanguageFromPhone = (phone: string): string => {
  // Remove + and get first 1-3 digits
  const cleaned = phone.replace(/^\+/, '');

  // Country code mapping (simplified)
  const countryCodeMap: Record<string, string> = {
    '27': 'ZA',  // South Africa
    '44': 'GB',  // UK
    '1': 'US',   // US/Canada
    '49': 'DE',  // Germany
    '33': 'FR',  // France
    '34': 'ES',  // Spain
    '39': 'IT',  // Italy
    '351': 'PT', // Portugal
    '31': 'NL',  // Netherlands
  };

  // Try 3-digit codes first, then 2-digit, then 1-digit
  for (let len = 3; len >= 1; len--) {
    const code = cleaned.substring(0, len);
    if (countryCodeMap[code]) {
      return detectLanguageFromCountryCode(countryCodeMap[code]);
    }
  }

  return 'en'; // Default to English
};
