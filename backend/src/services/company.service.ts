import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';
import { createAuditLog } from './audit.service';
import { logger } from '../utils/logger';
import { getUserSubscription } from './billing.service';
import {
  Company,
  CompanyWithPropertyCount,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyListParams,
  CompanyListResponse,
  CompanyLimitInfo,
} from '../types/company.types';
import {
  InvoiceSettings,
  CompanyInvoiceSettingsResponse,
  UpdateInvoiceSettingsDTO,
} from '../types/invoice.types';

// ============================================================================
// COMPANY CRUD OPERATIONS
// ============================================================================

/**
 * List all companies for a user
 */
export const listUserCompanies = async (
  userId: string,
  params?: CompanyListParams
): Promise<CompanyListResponse> => {
  const supabase = getAdminClient();

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Filters
  if (params?.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,display_name.ilike.%${params.search}%`);
  }

  // Sorting
  const sortBy = params?.sortBy || 'created_at';
  const sortOrder = params?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch companies');
  }

  const total = count || 0;

  // Get property count for each company
  const companiesWithCount: CompanyWithPropertyCount[] = await Promise.all(
    (data || []).map(async (company: Company) => {
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id);

      return {
        ...company,
        property_count: propertyCount || 0,
      };
    })
  );

  return {
    companies: companiesWithCount,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single company by ID
 */
export const getCompanyById = async (
  id: string,
  userId: string
): Promise<CompanyWithPropertyCount> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Company not found');
  }

  // Get property count
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', id);

  return {
    ...data,
    property_count: propertyCount || 0,
  };
};

/**
 * Get a company by ID (admin - no user check)
 */
export const getCompany = async (id: string): Promise<CompanyWithPropertyCount> => {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('NOT_FOUND', 'Company not found');
  }

  // Get property count
  const { count: propertyCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', id);

  return {
    ...data,
    property_count: propertyCount || 0,
  };
};

/**
 * Create a new company
 */
export const createCompany = async (
  userId: string,
  input: CreateCompanyRequest
): Promise<CompanyWithPropertyCount> => {
  const supabase = getAdminClient();

  console.log('=== [COMPANY_SERVICE] createCompany called ===');
  console.log('[COMPANY_SERVICE] User ID:', userId);
  console.log('[COMPANY_SERVICE] Company input:', JSON.stringify(input, null, 2));

  // Check company limit (with error handling - don't block creation on limit check failure)
  let limitInfo;
  try {
    console.log('[COMPANY_SERVICE] Checking company limit...');
    limitInfo = await getCompanyLimitInfo(userId);
    console.log('[COMPANY_SERVICE] Limit info:', JSON.stringify(limitInfo, null, 2));
  } catch (err) {
    console.error('[COMPANY_SERVICE] Failed to check company limit - applying defaults:', err);
    logger.error('Failed to check company limit - allowing creation with free tier defaults', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    // Default to allowing 1 company if limit check fails (free tier)
    limitInfo = {
      current_count: 0,
      max_allowed: 1,
      is_unlimited: false,
      can_create: true,
      remaining: 1,
    };
    console.log('[COMPANY_SERVICE] Using default limit info:', JSON.stringify(limitInfo, null, 2));
  }

  if (!limitInfo.can_create) {
    console.error('[COMPANY_SERVICE] Company limit reached:', limitInfo);
    throw new AppError(
      'FORBIDDEN',
      `You have reached your company limit (${limitInfo.max_allowed}). Please upgrade your subscription to create more companies.`
    );
  }

  console.log('[COMPANY_SERVICE] Limit check passed - can create company');

  // Validate required fields
  if (!input.name || !input.name.trim()) {
    console.error('[COMPANY_SERVICE] Validation failed: Company name is required');
    throw new AppError('VALIDATION_ERROR', 'Company name is required');
  }

  console.log('[COMPANY_SERVICE] Validation passed - proceeding with INSERT');

  const { data, error } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      display_name: input.display_name?.trim() || input.name.trim(),
      description: input.description?.trim() || null,
      logo_url: input.logo_url || null,
      website: input.website?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      contact_phone: input.contact_phone?.trim() || null,
      default_currency: input.default_currency?.trim() || 'USD',
      address_street: input.address_street?.trim() || null,
      address_city: input.address_city?.trim() || null,
      address_state: input.address_state?.trim() || null,
      address_postal_code: input.address_postal_code?.trim() || null,
      address_country: input.address_country?.trim() || null,
      vat_number: input.vat_number?.trim() || null,
      registration_number: input.registration_number?.trim() || null,
      linkedin_url: input.linkedin_url?.trim() || null,
      facebook_url: input.facebook_url?.trim() || null,
      instagram_url: input.instagram_url?.trim() || null,
      twitter_url: input.twitter_url?.trim() || null,
      youtube_url: input.youtube_url?.trim() || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('[COMPANY_SERVICE] Database INSERT error:', error);
    console.error('[COMPANY_SERVICE] Error code:', error.code);
    console.error('[COMPANY_SERVICE] Error details:', error.details);
    console.error('[COMPANY_SERVICE] Error hint:', error.hint);
    console.error('[COMPANY_SERVICE] Error message:', error.message);
    throw new AppError('INTERNAL_ERROR', `Failed to create company: ${error.message}`);
  }

  if (!data) {
    console.error('[COMPANY_SERVICE] INSERT returned no data');
    throw new AppError('INTERNAL_ERROR', 'Failed to create company: No data returned');
  }

  console.log('[COMPANY_SERVICE] Company INSERT successful:', data.id);

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'company.created' as any,
    entity_type: 'company' as any,
    entity_id: data.id,
    new_data: input as unknown as Record<string, unknown>,
  });

  return {
    ...data,
    property_count: 0,
  };
};

/**
 * Update a company
 */
export const updateCompany = async (
  id: string,
  userId: string,
  input: UpdateCompanyRequest
): Promise<CompanyWithPropertyCount> => {
  const supabase = getAdminClient();

  console.log('🟡 [CompanyService] updateCompany called');
  console.log('🟡 [CompanyService] Input received:', JSON.stringify(input, null, 2));
  console.log('🟡 [CompanyService] VAT Percentage in input:', input.vat_percentage);

  // Verify ownership
  const current = await getCompanyById(id, userId);

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  // Only update fields that are provided
  if (input.name !== undefined) updateData.name = input.name.trim();
  if (input.display_name !== undefined) updateData.display_name = input.display_name?.trim() || null;
  if (input.description !== undefined) updateData.description = input.description?.trim() || null;
  if (input.logo_url !== undefined) updateData.logo_url = input.logo_url || null;
  if (input.website !== undefined) updateData.website = input.website?.trim() || null;
  if (input.contact_email !== undefined) updateData.contact_email = input.contact_email?.trim() || null;
  if (input.contact_phone !== undefined) updateData.contact_phone = input.contact_phone?.trim() || null;
  if (input.default_currency !== undefined) updateData.default_currency = input.default_currency?.trim() || 'USD';
  if (input.address_street !== undefined) updateData.address_street = input.address_street?.trim() || null;
  if (input.address_city !== undefined) updateData.address_city = input.address_city?.trim() || null;
  if (input.address_state !== undefined) updateData.address_state = input.address_state?.trim() || null;
  if (input.address_postal_code !== undefined) updateData.address_postal_code = input.address_postal_code?.trim() || null;
  if (input.address_country !== undefined) updateData.address_country = input.address_country?.trim() || null;
  if (input.vat_number !== undefined) updateData.vat_number = input.vat_number?.trim() || null;
  if (input.vat_percentage !== undefined) {
    // Explicitly convert to number and validate
    const vatValue = typeof input.vat_percentage === 'string'
      ? parseFloat(input.vat_percentage)
      : input.vat_percentage;

    console.log('🟡 [CompanyService] VAT Percentage input type:', typeof input.vat_percentage);
    console.log('🟡 [CompanyService] VAT Percentage input value:', input.vat_percentage);
    console.log('🟡 [CompanyService] VAT Percentage converted value:', vatValue);
    console.log('🟡 [CompanyService] VAT Percentage is valid number:', !isNaN(vatValue) && vatValue !== null);

    // Only set if it's a valid number
    if (vatValue !== null && !isNaN(vatValue)) {
      updateData.vat_percentage = vatValue;
      console.log('🟡 [CompanyService] VAT Percentage is being updated to:', vatValue);
    } else {
      console.warn('⚠️ [CompanyService] Invalid VAT Percentage value, skipping update');
    }
  }
  if (input.registration_number !== undefined) updateData.registration_number = input.registration_number?.trim() || null;
  if (input.linkedin_url !== undefined) updateData.linkedin_url = input.linkedin_url?.trim() || null;
  if (input.facebook_url !== undefined) updateData.facebook_url = input.facebook_url?.trim() || null;
  if (input.instagram_url !== undefined) updateData.instagram_url = input.instagram_url?.trim() || null;
  if (input.twitter_url !== undefined) updateData.twitter_url = input.twitter_url?.trim() || null;
  if (input.youtube_url !== undefined) updateData.youtube_url = input.youtube_url?.trim() || null;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;
  if (input.enable_book_via_chat !== undefined) {
    updateData.enable_book_via_chat = input.enable_book_via_chat;
    console.log('🟢 [CompanyService] enable_book_via_chat is being updated to:', input.enable_book_via_chat);
  }

  console.log('🟡 [CompanyService] Update data being sent to Supabase:', JSON.stringify(updateData, null, 2));

  const { data, error } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('❌ [CompanyService] Supabase update error:', error);
    throw new AppError('INTERNAL_ERROR', 'Failed to update company');
  }

  console.log('✅ [CompanyService] Supabase update successful, returned data:', JSON.stringify(data, null, 2));
  console.log('✅ [CompanyService] VAT Percentage in returned data:', data.vat_percentage);

  // Verify the update by querying the database directly
  const { data: verifyData, error: verifyError } = await supabase
    .from('companies')
    .select('id, vat_percentage')
    .eq('id', id)
    .single();

  if (verifyData) {
    console.log('🔍 [CompanyService] Database verification - VAT Percentage:', verifyData.vat_percentage);
    if (input.vat_percentage !== undefined) {
      const expectedValue = typeof input.vat_percentage === 'string'
        ? parseFloat(input.vat_percentage)
        : input.vat_percentage;

      if (verifyData.vat_percentage !== expectedValue) {
        console.error('❌ [CompanyService] VAT MISMATCH! Expected:', expectedValue, 'Got:', verifyData.vat_percentage);
      } else {
        console.log('✅ [CompanyService] VAT Percentage verified in database:', verifyData.vat_percentage);
      }
    }
  } else if (verifyError) {
    console.error('❌ [CompanyService] Verification query error:', verifyError);
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'company.updated' as any,
    entity_type: 'company' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
    new_data: input as unknown as Record<string, unknown>,
  });

  return getCompanyById(id, userId);
};

/**
 * Delete a company
 */
export const deleteCompany = async (
  id: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify ownership
  const current = await getCompanyById(id, userId);

  // Check if company has properties
  if (current.property_count > 0) {
    throw new AppError(
      'CONFLICT',
      'Cannot delete company that has properties. Please reassign or delete the properties first.'
    );
  }

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to delete company');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'company.deleted' as any,
    entity_type: 'company' as any,
    entity_id: id,
    old_data: current as unknown as Record<string, unknown>,
  });
};

// ============================================================================
// LIMIT CHECKING
// ============================================================================

/**
 * Get company limit info for a user
 */
export const getCompanyLimitInfo = async (userId: string): Promise<CompanyLimitInfo> => {
  const supabase = getAdminClient();

  // Get user's subscription (with error handling - don't throw)
  let subscription;
  try {
    subscription = await getUserSubscription(userId);
  } catch (err) {
    logger.warn('Failed to fetch subscription for company limit check - applying free tier defaults', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    subscription = null;
  }

  // Count current companies
  const { count: currentCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const companyCount = currentCount || 0;

  // If no subscription, allow 1 company by default (free tier)
  if (!subscription) {
    logger.info('No subscription found - applying free tier limits (1 company allowed)', { userId });
    return {
      current_count: companyCount,
      max_allowed: 1,
      is_unlimited: false,
      can_create: companyCount < 1,
      remaining: Math.max(0, 1 - companyCount),
    };
  }

  // Get max_companies limit from subscription
  const maxCompanies = subscription.limits['max_companies'] ?? 1;

  // -1 means unlimited
  if (maxCompanies === -1) {
    return {
      current_count: companyCount,
      max_allowed: -1,
      is_unlimited: true,
      can_create: true,
      remaining: -1,
    };
  }

  return {
    current_count: companyCount,
    max_allowed: maxCompanies,
    is_unlimited: false,
    can_create: companyCount < maxCompanies,
    remaining: Math.max(0, maxCompanies - companyCount),
  };
};

/**
 * Check if user can create a company
 */
export const canCreateCompany = async (userId: string): Promise<boolean> => {
  const limitInfo = await getCompanyLimitInfo(userId);
  return limitInfo.can_create;
};

// ============================================================================
// PROPERTY LINKING
// ============================================================================

/**
 * Link a property to a company
 */
export const linkPropertyToCompany = async (
  propertyId: string,
  companyId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify company ownership
  await getCompanyById(companyId, userId);

  // Update property
  const { error } = await supabase
    .from('properties')
    .update({
      company_id: companyId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .eq('owner_id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to link property to company');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.updated' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
    new_data: { company_id: companyId },
  });
};

/**
 * Unlink a property from a company
 */
export const unlinkPropertyFromCompany = async (
  propertyId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Update property
  const { error } = await supabase
    .from('properties')
    .update({
      company_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', propertyId)
    .eq('owner_id', userId);

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to unlink property from company');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'property.updated' as any,
    entity_type: 'property' as any,
    entity_id: propertyId,
    new_data: { company_id: null },
  });
};

/**
 * Get properties for a company
 */
export const getCompanyProperties = async (
  companyId: string,
  userId: string
): Promise<any[]> => {
  const supabase = getAdminClient();

  // Verify company ownership
  await getCompanyById(companyId, userId);

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch company properties');
  }

  return data || [];
};

// ============================================================================
// LOGO UPLOAD
// ============================================================================

/**
 * Upload a company logo
 */
export const uploadLogo = async (
  companyId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify company ownership
  const company = await getCompanyById(companyId, userId);

  // Delete old logo if exists
  if (company.logo_url) {
    try {
      const oldPath = company.logo_url.split('/company-logos/')[1];
      if (oldPath) {
        await supabase.storage.from('company-logos').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'jpg';
  const filename = `${companyId}/${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('company-logos')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to upload logo');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('company-logos')
    .getPublicUrl(filename);

  const logoUrl = urlData.publicUrl;

  // Update company with new logo URL
  const { error: updateError } = await supabase
    .from('companies')
    .update({
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .eq('user_id', userId);

  if (updateError) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update logo URL');
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'company.updated' as any,
    entity_type: 'company' as any,
    entity_id: companyId,
    old_data: { logo_url: company.logo_url },
    new_data: { logo_url: logoUrl },
  });

  return logoUrl;
};

// ============================================================================
// COMPANY INVOICE SETTINGS
// ============================================================================

/**
 * Get invoice settings for a company (without fallback)
 * Returns null if company has no custom settings
 */
export const getCompanyInvoiceSettings = async (
  companyId: string,
  userId: string
): Promise<CompanyInvoiceSettingsResponse> => {
  const supabase = getAdminClient();

  // Verify company ownership
  await getCompanyById(companyId, userId);

  // Query company-specific settings only (no fallback)
  const { data, error } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch company invoice settings', { companyId, error });
    throw new AppError('INTERNAL_ERROR', 'Failed to fetch invoice settings');
  }

  // If no custom settings exist, return null with fallback flag
  if (!data) {
    return {
      settings: null,
      is_using_global_fallback: true,
    };
  }

  return {
    settings: data,
    is_using_global_fallback: false,
  };
};

/**
 * Create or update company-specific invoice settings
 */
export const createOrUpdateCompanyInvoiceSettings = async (
  companyId: string,
  userId: string,
  input: UpdateInvoiceSettingsDTO
): Promise<InvoiceSettings> => {
  const supabase = getAdminClient();

  // Verify company ownership
  await getCompanyById(companyId, userId);

  // Check if settings exist
  const { data: existing } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  let result: InvoiceSettings;

  if (existing) {
    // Update existing settings
    const { data, error } = await supabase
      .from('invoice_settings')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) {
      logger.error('Failed to update company invoice settings', { companyId, error });
      throw new AppError('INTERNAL_ERROR', 'Failed to update invoice settings');
    }

    result = data;

    logger.info('Updated company invoice settings', { companyId, settingsId: result.id });
  } else {
    // Create new settings
    const { data, error } = await supabase
      .from('invoice_settings')
      .insert({
        company_id: companyId,
        ...input,
        next_invoice_number: input.invoice_prefix ? 1 : undefined, // Start from 1 for new company settings
      })
      .select()
      .single();

    if (error || !data) {
      logger.error('Failed to create company invoice settings', { companyId, error });
      throw new AppError('INTERNAL_ERROR', 'Failed to create invoice settings');
    }

    result = data;

    logger.info('Created company invoice settings', { companyId, settingsId: result.id });
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'invoice_settings.updated' as any,
    entity_type: 'invoice_settings' as any,
    entity_id: result.id,
    old_data: (existing || {}) as unknown as Record<string, unknown>,
    new_data: input as unknown as Record<string, unknown>,
  });

  return result;
};

/**
 * Upload company invoice logo
 */
export const uploadCompanyInvoiceLogo = async (
  companyId: string,
  userId: string,
  file: Express.Multer.File
): Promise<string> => {
  const supabase = getAdminClient();

  // Verify company ownership
  await getCompanyById(companyId, userId);

  // Get current settings (if any)
  const { data: currentSettings } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  // Delete old logo if exists
  if (currentSettings?.logo_url) {
    try {
      const urlParts = currentSettings.logo_url.split('/invoice-logos/');
      if (urlParts.length > 1) {
        const oldPath = urlParts[1].split('?')[0]; // Remove query params
        await supabase.storage.from('invoice-logos').remove([oldPath]);
      }
    } catch {
      // Ignore deletion errors - file may not exist
    }
  }

  // Generate unique filename
  const ext = file.originalname.split('.').pop() || 'png';
  const filename = `companies/${companyId}/logo_${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('invoice-logos')
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    logger.error('Failed to upload company invoice logo', { companyId, error: uploadError });
    throw new AppError('INTERNAL_ERROR', 'Failed to upload logo');
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('invoice-logos').getPublicUrl(filename);

  const logoUrl = urlData.publicUrl;

  // Update or create settings with new logo URL
  if (currentSettings) {
    await supabase
      .from('invoice_settings')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSettings.id);
  } else {
    // Create minimal settings with just the logo
    await supabase.from('invoice_settings').insert({
      company_id: companyId,
      logo_url: logoUrl,
      // Other fields will be populated when user completes settings
    });
  }

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'invoice_settings.updated' as any,
    entity_type: 'invoice_settings' as any,
    entity_id: currentSettings?.id || companyId,
    old_data: { logo_url: currentSettings?.logo_url || null },
    new_data: { logo_url: logoUrl },
  });

  logger.info('Uploaded company invoice logo', { companyId, logoUrl });

  return logoUrl;
};

/**
 * Delete company invoice logo
 */
export const deleteCompanyInvoiceLogo = async (
  companyId: string,
  userId: string
): Promise<void> => {
  const supabase = getAdminClient();

  // Verify company ownership
  await getCompanyById(companyId, userId);

  // Get current settings
  const { data: currentSettings } = await supabase
    .from('invoice_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!currentSettings || !currentSettings.logo_url) {
    return; // No logo to delete
  }

  // Delete from storage
  try {
    const urlParts = currentSettings.logo_url.split('/invoice-logos/');
    if (urlParts.length > 1) {
      const oldPath = urlParts[1].split('?')[0];
      await supabase.storage.from('invoice-logos').remove([oldPath]);
    }
  } catch {
    // Ignore deletion errors
  }

  // Update settings to remove logo URL
  await supabase
    .from('invoice_settings')
    .update({
      logo_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', currentSettings.id);

  // Create audit log
  await createAuditLog({
    actor_id: userId,
    action: 'invoice_settings.updated' as any,
    entity_type: 'invoice_settings' as any,
    entity_id: currentSettings.id,
    old_data: { logo_url: currentSettings.logo_url },
    new_data: { logo_url: null },
  });

  logger.info('Deleted company invoice logo', { companyId });
};
