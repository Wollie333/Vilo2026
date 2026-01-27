/**
 * Customer Sync Service
 *
 * Handles synchronization of guest profile updates to all customer instances.
 * When a guest updates their user profile (contact details), those changes
 * propagate to ALL customer records across all properties.
 */

import { getAdminClient } from '../config/supabase';
import { AppError } from '../utils/errors';

interface ContactUpdates {
  full_name?: string;
  phone?: string;
  marketing_consent?: boolean;
}

/**
 * Sync guest contact details to all customer instances
 *
 * Called when a guest updates their user profile.
 * Updates all customer records (across all properties) with the new contact info.
 *
 * @param userId - The user ID of the guest
 * @param updates - Contact field updates (name, phone, marketing_consent)
 */
export const syncGuestContactToCustomers = async (
  userId: string,
  updates: ContactUpdates
): Promise<void> => {
  console.log('=== [CUSTOMER_SYNC] Syncing guest contact to all customer instances ===');
  console.log('[CUSTOMER_SYNC] User ID:', userId);
  console.log('[CUSTOMER_SYNC] Updates:', JSON.stringify(updates, null, 2));

  const supabase = getAdminClient();

  // Count customer instances before sync
  const { count: beforeCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log('[CUSTOMER_SYNC] Customer instances to update:', beforeCount || 0);

  if (!beforeCount || beforeCount === 0) {
    console.log('[CUSTOMER_SYNC] No customer instances found for this user');
    return;
  }

  // Update all customer records for this user
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('user_id', userId)
    .select('id, property_id');

  if (error) {
    console.error('[CUSTOMER_SYNC] Failed to sync:', error);
    throw new AppError(
      'INTERNAL_ERROR',
      `Failed to sync contact details to customer instances: ${error.message}`
    );
  }

  console.log('[CUSTOMER_SYNC] Successfully synced to', data?.length || 0, 'customer instances');
  console.log('[CUSTOMER_SYNC] Updated customer IDs:', data?.map((c) => c.id).join(', '));
};

/**
 * Sync guest email change to all customer instances
 *
 * More complex than other contact updates because email is part of the
 * unique constraint (LOWER(email), property_id). Each customer must be
 * updated individually to maintain constraint integrity.
 *
 * @param userId - The user ID of the guest
 * @param oldEmail - The previous email address
 * @param newEmail - The new email address
 */
export const syncGuestEmailToCustomers = async (
  userId: string,
  oldEmail: string,
  newEmail: string
): Promise<void> => {
  console.log('=== [CUSTOMER_SYNC] Syncing email change to all customer instances ===');
  console.log('[CUSTOMER_SYNC] User ID:', userId);
  console.log('[CUSTOMER_SYNC] Old email:', oldEmail);
  console.log('[CUSTOMER_SYNC] New email:', newEmail);

  const supabase = getAdminClient();

  // Get all customer instances for this user
  console.log('[CUSTOMER_SYNC] Fetching all customer instances...');
  const { data: customers, error: fetchError } = await supabase
    .from('customers')
    .select('id, property_id, email')
    .eq('user_id', userId);

  if (fetchError) {
    console.error('[CUSTOMER_SYNC] Failed to fetch customers:', fetchError);
    throw new AppError(
      'INTERNAL_ERROR',
      `Failed to fetch customer instances: ${fetchError.message}`
    );
  }

  if (!customers || customers.length === 0) {
    console.log('[CUSTOMER_SYNC] No customer instances found for this user');
    return;
  }

  console.log('[CUSTOMER_SYNC] Found', customers.length, 'customer instances to update');

  // Update each customer's email individually
  // (Sequential to handle unique constraint properly)
  let successCount = 0;
  let errorCount = 0;

  for (const customer of customers) {
    console.log('[CUSTOMER_SYNC] Updating customer:', customer.id, 'property:', customer.property_id);

    const { error: updateError } = await supabase
      .from('customers')
      .update({ email: newEmail.toLowerCase() })
      .eq('id', customer.id);

    if (updateError) {
      console.error('[CUSTOMER_SYNC] Failed to update customer:', customer.id, updateError);
      errorCount++;
      // Continue with others even if one fails
    } else {
      console.log('[CUSTOMER_SYNC] Successfully updated customer:', customer.id);
      successCount++;
    }
  }

  console.log('[CUSTOMER_SYNC] Email sync complete');
  console.log('[CUSTOMER_SYNC] Successes:', successCount, '/', customers.length);
  console.log('[CUSTOMER_SYNC] Errors:', errorCount, '/', customers.length);

  if (errorCount > 0) {
    throw new AppError(
      'INTERNAL_ERROR',
      `Email sync partially failed: ${successCount} succeeded, ${errorCount} failed`
    );
  }
};

/**
 * Get customer instance count for a user
 *
 * Utility function to check how many customer instances a user has.
 * Useful for logging and verification.
 *
 * @param userId - The user ID
 * @returns Number of customer instances
 */
export const getCustomerInstanceCount = async (userId: string): Promise<number> => {
  const supabase = getAdminClient();

  const { count, error } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[CUSTOMER_SYNC] Failed to count customer instances:', error);
    return 0;
  }

  return count || 0;
};
