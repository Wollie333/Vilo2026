/**
 * Email Template Service
 *
 * Handles all operations related to email templates including:
 * - CRUD operations
 * - Template rendering
 * - Email sending via templates
 * - Supabase Auth template syncing
 * - Analytics and changelog
 */

import { supabase } from '../config/supabase';
import { sendNotificationEmail } from './email.service';
import type {
  EmailTemplate,
  EmailTemplateCategory,
  EmailSend,
  EmailTemplateChangelog,
  GetTemplatesParams,
  GetTemplatesResponse,
  CreateTemplateInput,
  UpdateTemplateInput,
  SendEmailFromTemplateOptions,
  PreviewTemplateInput,
  PreviewTemplateOutput,
  SendTestEmailInput,
  SyncToSupabaseInput,
  SyncToSupabaseResponse,
  EmailTemplateAnalytics,
} from '../types/email-template.types';

// ============================================================================
// Categories
// ============================================================================

export const getCategories = async (): Promise<EmailTemplateCategory[]> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] getCategories called ===');

  const { data, error } = await supabase
    .from('email_template_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error fetching categories:', error);
    throw error;
  }

  console.log('[EMAIL_TEMPLATE_SERVICE] Categories fetched:', data.length);
  return data as EmailTemplateCategory[];
};

// ============================================================================
// Templates - CRUD
// ============================================================================

/**
 * Get all templates with optional filtering
 */
export const getTemplates = async (
  params: GetTemplatesParams = {}
): Promise<GetTemplatesResponse> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] getTemplates called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Params:', params);

  let query = supabase
    .from('email_templates')
    .select(`
      *,
      category:email_template_categories(*)
    `, { count: 'exact' });

  // Apply filters
  if (params.category_id) {
    query = query.eq('category_id', params.category_id);
  }
  if (params.template_type) {
    query = query.eq('template_type', params.template_type);
  }
  if (params.feature_tag) {
    query = query.eq('feature_tag', params.feature_tag);
  }
  if (params.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }
  if (params.search) {
    query = query.or(`display_name.ilike.%${params.search}%,template_key.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query.order('display_name', { ascending: true });

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error fetching templates:', error);
    throw error;
  }

  console.log('[EMAIL_TEMPLATE_SERVICE] Templates fetched:', data.length);
  return {
    templates: data as EmailTemplate[],
    total: count || 0,
  };
};

/**
 * Get template by ID
 */
export const getTemplateById = async (templateId: string): Promise<EmailTemplate> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] getTemplateById:', templateId);

  const { data, error } = await supabase
    .from('email_templates')
    .select(`
      *,
      category:email_template_categories(*)
    `)
    .eq('id', templateId)
    .single();

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error fetching template:', error);
    throw error;
  }

  if (!data) {
    throw new Error(`Template with ID ${templateId} not found`);
  }

  return data as EmailTemplate;
};

/**
 * Get template by key (used for sending emails)
 */
export const getTemplateByKey = async (templateKey: string): Promise<EmailTemplate> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] getTemplateByKey:', templateKey);

  const { data, error } = await supabase
    .from('email_templates')
    .select(`
      *,
      category:email_template_categories(*)
    `)
    .eq('template_key', templateKey)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Template not found:', templateKey, error);
    throw new Error(`Email template '${templateKey}' not found or inactive`);
  }

  return data as EmailTemplate;
};

/**
 * Create new template
 */
export const createTemplate = async (
  userId: string,
  input: CreateTemplateInput
): Promise<EmailTemplate> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] createTemplate called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] User:', userId);
  console.log('[EMAIL_TEMPLATE_SERVICE] Input:', JSON.stringify(input, null, 2));

  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      ...input,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error creating template:', error);
    throw error;
  }

  console.log('[EMAIL_TEMPLATE_SERVICE] Template created:', data.id);
  return data as EmailTemplate;
};

/**
 * Update existing template
 */
export const updateTemplate = async (
  templateId: string,
  userId: string,
  input: UpdateTemplateInput
): Promise<EmailTemplate> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] updateTemplate called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Template ID:', templateId);
  console.log('[EMAIL_TEMPLATE_SERVICE] User:', userId);
  console.log('[EMAIL_TEMPLATE_SERVICE] Input:', JSON.stringify(input, null, 2));

  const { data, error } = await supabase
    .from('email_templates')
    .update({
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error updating template:', error);
    throw error;
  }

  if (!data) {
    throw new Error(`Template with ID ${templateId} not found`);
  }

  console.log('[EMAIL_TEMPLATE_SERVICE] Template updated:', data.id);
  return data as EmailTemplate;
};

/**
 * Toggle template active status
 */
export const toggleTemplate = async (
  templateId: string,
  userId: string,
  isActive: boolean
): Promise<EmailTemplate> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] toggleTemplate called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Template ID:', templateId);
  console.log('[EMAIL_TEMPLATE_SERVICE] Set active:', isActive);

  return updateTemplate(templateId, userId, { is_active: isActive });
};

/**
 * Delete template (only if not system template)
 */
export const deleteTemplate = async (templateId: string): Promise<void> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] deleteTemplate called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Template ID:', templateId);

  // Check if system template
  const template = await getTemplateById(templateId);
  if (template.is_system_template) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Cannot delete system template');
    throw new Error('Cannot delete system templates');
  }

  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error deleting template:', error);
    throw error;
  }

  console.log('[EMAIL_TEMPLATE_SERVICE] Template deleted');
};

// ============================================================================
// Template Rendering & Sending
// ============================================================================

/**
 * Render template with variables
 * Replaces {{variable_name}} with values from variables object
 */
export const renderTemplate = (
  template: string,
  variables: Record<string, any>
): string => {
  console.log('[EMAIL_TEMPLATE_SERVICE] Rendering template with variables:', Object.keys(variables));

  let rendered = template;

  // Replace each variable in the template
  for (const [key, value] of Object.entries(variables)) {
    // Match {{key}} or {{ key }} (with optional spaces)
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value ?? ''));
  }

  return rendered;
};

/**
 * Send email using a template from database
 */
export const sendEmailFromTemplate = async (
  options: SendEmailFromTemplateOptions
): Promise<EmailSend> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] sendEmailFromTemplate called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Template key:', options.template_key);
  console.log('[EMAIL_TEMPLATE_SERVICE] Recipient:', options.recipient_email);

  // 1. Fetch template
  const template = await getTemplateByKey(options.template_key);
  console.log('[EMAIL_TEMPLATE_SERVICE] Template fetched:', template.display_name);

  // 2. Render subject and body
  const subject = renderTemplate(template.subject_template, options.variables);
  const htmlBody = renderTemplate(template.html_template, options.variables);
  const textBody = template.text_template
    ? renderTemplate(template.text_template, options.variables)
    : undefined;

  console.log('[EMAIL_TEMPLATE_SERVICE] Template rendered');
  console.log('[EMAIL_TEMPLATE_SERVICE] Subject:', subject);

  // 3. Create email_sends record
  const { data: emailSend, error: insertError } = await supabase
    .from('email_sends')
    .insert({
      template_id: template.id,
      recipient_email: options.recipient_email,
      recipient_name: options.recipient_name,
      subject,
      html_body: htmlBody,
      text_body: textBody,
      variables_used: options.variables,
      status: 'queued',
      context_type: options.context_type,
      context_id: options.context_id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error creating email_send record:', insertError);
    throw insertError;
  }

  console.log('[EMAIL_TEMPLATE_SERVICE] Email send record created:', emailSend.id);

  // 4. Send email (if immediate)
  if (options.send_immediately !== false) {
    try {
      console.log('[EMAIL_TEMPLATE_SERVICE] Sending email via provider...');
      await sendNotificationEmail({
        to: options.recipient_email,
        subject,
        html: htmlBody,
        text: textBody,
      });

      // Update status to sent
      await supabase
        .from('email_sends')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: 'resend', // Default provider
        })
        .eq('id', emailSend.id);

      console.log('[EMAIL_TEMPLATE_SERVICE] Email sent successfully');
    } catch (error) {
      console.error('[EMAIL_TEMPLATE_SERVICE] Error sending email:', error);

      // Update status to failed
      await supabase
        .from('email_sends')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', emailSend.id);

      throw error;
    }
  } else {
    console.log('[EMAIL_TEMPLATE_SERVICE] Email queued for later sending');
  }

  return emailSend as EmailSend;
};

// ============================================================================
// Preview & Testing
// ============================================================================

/**
 * Preview template rendering without sending
 */
export const previewTemplate = async (
  input: PreviewTemplateInput
): Promise<PreviewTemplateOutput> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] previewTemplate called ===');

  const subject = renderTemplate(input.subject_template, input.variables);
  const html = renderTemplate(input.html_template, input.variables);

  return {
    subject,
    html,
  };
};

/**
 * Send test email to specified recipient
 */
export const sendTestEmail = async (
  input: SendTestEmailInput,
  userId: string
): Promise<EmailSend> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] sendTestEmail called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Template ID:', input.template_id);
  console.log('[EMAIL_TEMPLATE_SERVICE] Test recipient:', input.recipient_email);

  const template = await getTemplateById(input.template_id);

  return sendEmailFromTemplate({
    template_key: template.template_key,
    recipient_email: input.recipient_email,
    variables: input.test_variables,
    context_type: 'test',
    send_immediately: true,
  });
};

// ============================================================================
// Supabase Auth Integration
// ============================================================================

/**
 * Sync template to Supabase Auth using Management API
 */
export const syncTemplateToSupabase = async (
  input: SyncToSupabaseInput,
  userId: string
): Promise<SyncToSupabaseResponse> => {
  console.log('=== [EMAIL_TEMPLATE_SERVICE] syncTemplateToSupabase called ===');
  console.log('[EMAIL_TEMPLATE_SERVICE] Template ID:', input.template_id);

  const template = await getTemplateById(input.template_id);

  // Validate template is Supabase Auth type
  if (template.template_type !== 'supabase_auth') {
    console.error('[EMAIL_TEMPLATE_SERVICE] Template is not a Supabase Auth template');
    throw new Error('Template is not a Supabase Auth template');
  }

  if (!template.supabase_template_name) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Template missing supabase_template_name');
    throw new Error('Template missing supabase_template_name');
  }

  // Get Supabase project ref and service key from env
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!projectRef || !serviceKey) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Missing Supabase credentials in environment');
    throw new Error('Missing Supabase credentials in environment (SUPABASE_PROJECT_REF or SUPABASE_SERVICE_KEY)');
  }

  try {
    console.log('[EMAIL_TEMPLATE_SERVICE] Syncing to Supabase Management API...');
    console.log('[EMAIL_TEMPLATE_SERVICE] Template name:', template.supabase_template_name);

    // Note: Supabase variables use Go template syntax: {{ .VariableName }}
    // Our templates use: {{variable_name}}
    // For Supabase auth templates, we keep their syntax in the template
    const response = await fetch(
      `https://${projectRef}.supabase.co/auth/v1/admin/email_templates/${template.supabase_template_name}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: template.subject_template,
          body: template.html_template,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error('[EMAIL_TEMPLATE_SERVICE] Supabase API error:', errorData);
      throw new Error(`Supabase API error: ${errorData.message || response.statusText}`);
    }

    console.log('[EMAIL_TEMPLATE_SERVICE] Successfully synced to Supabase');

    // Log sync in changelog
    await supabase.from('email_template_changelog').insert({
      template_id: template.id,
      changed_by: userId,
      change_type: 'synced_to_supabase',
      changes: {
        supabase_template_name: template.supabase_template_name,
        synced_at: new Date().toISOString(),
      },
    });

    return {
      success: true,
      supabase_template_name: template.supabase_template_name,
      synced_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error syncing to Supabase:', error);
    return {
      success: false,
      supabase_template_name: template.supabase_template_name,
      synced_at: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get analytics for a template
 */
export const getTemplateAnalytics = async (templateId: string): Promise<EmailTemplateAnalytics> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] getTemplateAnalytics:', templateId);

  const { data, error } = await supabase
    .from('email_sends')
    .select('id, status, sent_at, recipient_email, created_at')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error fetching analytics:', error);
    throw error;
  }

  // Group by status
  const statusCounts: Record<string, number> = {};
  for (const send of data) {
    statusCounts[send.status] = (statusCounts[send.status] || 0) + 1;
  }

  return {
    total_sends: data.length,
    by_status: statusCounts as any,
    recent_sends: data.slice(0, 10) as EmailSend[],
  };
};

/**
 * Get changelog for a template
 */
export const getTemplateChangelog = async (templateId: string): Promise<EmailTemplateChangelog[]> => {
  console.log('[EMAIL_TEMPLATE_SERVICE] getTemplateChangelog:', templateId);

  const { data, error } = await supabase
    .from('email_template_changelog')
    .select(`
      *,
      user:changed_by(id, full_name, email)
    `)
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[EMAIL_TEMPLATE_SERVICE] Error fetching changelog:', error);
    throw error;
  }

  return data as EmailTemplateChangelog[];
};
