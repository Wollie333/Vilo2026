/**
 * usePromotionsManagement Hook
 *
 * Stateless utility hook for managing promotion CRUD operations in edit mode.
 * Compares current promotions with original promotions to determine add/update/delete operations.
 */

import { useCallback } from 'react';
import { roomService } from '@/services';
import type { RoomPromotion } from '@/types/room.types';
import type { PromotionFormData } from '@/components/features/Room/RoomWizard/RoomWizard.types';

interface UsePromotionsManagementReturn {
  savePromotions: (
    currentPromotions: PromotionFormData[],
    originalPromotions: RoomPromotion[]
  ) => Promise<void>;
}

/**
 * Hook for managing promotions in edit mode
 *
 * @param roomId - The ID of the room being edited (undefined for create mode)
 * @returns Object with savePromotions function
 */
export function usePromotionsManagement(
  roomId?: string
): UsePromotionsManagementReturn {
  /**
   * Save promotion changes by comparing current vs original
   * Determines which promotions to create, update, or delete
   */
  const savePromotions = useCallback(
    async (
      currentPromotions: PromotionFormData[],
      originalPromotions: RoomPromotion[]
    ) => {
      console.log('[PromotionsManagement] savePromotions called');
      console.log('[PromotionsManagement] Room ID:', roomId);
      console.log('[PromotionsManagement] Current promotions:', currentPromotions);
      console.log('[PromotionsManagement] Original promotions:', originalPromotions);

      if (!roomId) {
        console.log('[PromotionsManagement] No room ID - skipping (create mode)');
        return;
      }

      try {
        // Step 1: Find promotions to delete (in original but not in current)
        const currentPromotionIds = new Set(
          currentPromotions.filter((p) => p.id).map((p) => p.id!)
        );
        const promotionsToDelete = originalPromotions.filter(
          (originalPromo) => !currentPromotionIds.has(originalPromo.id)
        );

        console.log('[PromotionsManagement] Promotions to delete:', promotionsToDelete.map(p => p.id));

        // Step 2: Create Map for O(1) lookups (performance optimization)
        const originalPromoMap = new Map(
          originalPromotions.map((promo) => [promo.id, promo])
        );

        // Step 3: Run deletions and creates/updates in parallel (not sequential)
        const promises = [
          // Delete removed promotions
          ...promotionsToDelete.map((promo) => {
            console.log(`[PromotionsManagement] Deleting promotion ${promo.id} (${promo.name})`);
            return roomService.deletePromotion(roomId, promo.id);
          }),
          // Create or update current promotions
          ...currentPromotions.map(async (promo) => {
            if (promo.id) {
              // Existing promotion - check if it needs updating (O(1) lookup)
              const originalPromo = originalPromoMap.get(promo.id);
              console.log(`[PromotionsManagement] Comparing:`, {
                current: promo,
                original: originalPromo
              });
              const changed = originalPromo && hasPromotionChanged(promo, originalPromo);
              console.log(`[PromotionsManagement] Promotion ${promo.id} (${promo.name}):`,
                changed ? 'HAS CHANGES - updating' : 'NO CHANGES - skipping');

              if (changed) {
                // Promotion has changes - update it
                // Clean up date fields - convert date-only strings to datetime format
                const valid_from = promo.start_date && promo.start_date.trim() !== ''
                  ? convertToDatetime(promo.start_date)
                  : undefined;
                const valid_until = promo.end_date && promo.end_date.trim() !== ''
                  ? convertToDatetime(promo.end_date)
                  : null;

                // Build payload - only include fields that should be updated
                const updatePayload: any = {
                  code: promo.code,
                  name: promo.name,
                  description: promo.description || null,  // Ensure null, not undefined
                  discount_type: promo.discount_type,
                  discount_value: promo.discount_value,
                  is_active: promo.is_active,
                };

                // Only include optional fields if they have values
                if (promo.min_nights) updatePayload.min_nights = promo.min_nights;
                if (promo.max_uses) updatePayload.max_uses = promo.max_uses;
                if (valid_from) updatePayload.valid_from = valid_from;
                if (valid_until !== undefined) updatePayload.valid_until = valid_until;

                console.log(`[PromotionsManagement] Update payload:`, updatePayload);
                await roomService.updatePromotion(roomId, promo.id, updatePayload);
                console.log(`[PromotionsManagement] Successfully updated promotion ${promo.id}`);
              }
              // If no changes, skip update
            } else {
              // New promotion - create it
              console.log(`[PromotionsManagement] Creating new promotion: ${promo.name}`);

              // Clean up date fields - convert date-only strings to datetime format
              const valid_from = promo.start_date && promo.start_date.trim() !== ''
                ? convertToDatetime(promo.start_date)
                : undefined;
              const valid_until = promo.end_date && promo.end_date.trim() !== ''
                ? convertToDatetime(promo.end_date)
                : null;

              await roomService.addPromotion(roomId, {
                code: promo.code,
                name: promo.name,
                description: promo.description,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value,
                min_nights: promo.min_nights || undefined,
                max_uses: promo.max_uses || undefined,
                valid_from,
                valid_until,
                is_active: promo.is_active,
              });
              console.log(`[PromotionsManagement] Successfully created promotion: ${promo.name}`);
            }
          }),
        ];

        console.log(`[PromotionsManagement] Executing ${promises.length} operations...`);
        await Promise.all(promises);
        console.log('[PromotionsManagement] All operations completed successfully');
      } catch (error) {
        console.error('[PromotionsManagement] Failed to save promotions:', error);
        throw error;
      }
    },
    [roomId]
  );

  return { savePromotions };
}

/**
 * Helper function to check if a promotion has changed
 * Optimized with early exits - checks fastest comparisons first
 */
function hasPromotionChanged(
  current: PromotionFormData,
  original: RoomPromotion
): boolean {
  const changes: string[] = [];

  // Quick primitive checks first (boolean and numbers are fastest)
  if (current.is_active !== original.is_active) {
    changes.push(`is_active: ${original.is_active} -> ${current.is_active}`);
  }
  if (current.discount_value !== original.discount_value) {
    changes.push(`discount_value: ${original.discount_value} -> ${current.discount_value}`);
  }
  if (current.min_nights !== original.min_nights) {
    changes.push(`min_nights: ${original.min_nights} -> ${current.min_nights}`);
  }
  if (current.max_uses !== original.max_uses) {
    changes.push(`max_uses: ${original.max_uses} -> ${current.max_uses}`);
  }

  // Type/enum comparison
  if (current.discount_type !== original.discount_type) {
    changes.push(`discount_type: ${original.discount_type} -> ${current.discount_type}`);
  }

  // String comparisons (slower)
  if (current.code !== original.code) {
    changes.push(`code: "${original.code}" -> "${current.code}"`);
  }
  if (current.name !== original.name) {
    changes.push(`name: "${original.name}" -> "${current.name}"`);
  }
  // Normalize null/undefined for description comparison
  const currentDesc = current.description || null;
  const originalDesc = original.description || null;
  if (currentDesc !== originalDesc) {
    changes.push(`description: "${originalDesc}" -> "${currentDesc}"`);
  }

  // Note: Database uses valid_from/valid_until, form uses start_date/end_date
  // Normalize dates to datetime format before comparing (form may have date-only strings)
  const currentStartDate = current.start_date && current.start_date.trim() !== ''
    ? convertToDatetime(current.start_date)
    : null;
  const originalValidFrom = original.valid_from || null;
  if (currentStartDate !== originalValidFrom) {
    changes.push(`valid_from: ${originalValidFrom} -> ${currentStartDate}`);
  }

  const currentEndDate = current.end_date && current.end_date.trim() !== ''
    ? convertToDatetime(current.end_date)
    : null;
  const originalValidUntil = original.valid_until || null;
  if (currentEndDate !== originalValidUntil) {
    changes.push(`valid_until: ${originalValidUntil} -> ${currentEndDate}`);
  }

  if (changes.length > 0) {
    console.log(`[PromotionsManagement] Changes detected:`, changes);
    return true;
  }

  return false;
}

/**
 * Helper function to convert date-only strings to datetime format
 * Backend validator expects ISO 8601 datetime strings (with time component)
 */
function convertToDatetime(dateString: string): string {
  // If already has time component, return as-is
  if (dateString.includes('T')) {
    return dateString;
  }

  // Date-only string (YYYY-MM-DD) - convert to datetime at midnight UTC
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date.toISOString();
}
