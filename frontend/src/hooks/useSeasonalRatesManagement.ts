/**
 * useSeasonalRatesManagement Hook
 *
 * Stateless utility hook for managing seasonal rate CRUD operations in edit mode.
 * Compares current rates with original rates to determine add/update/delete operations.
 */

import { useCallback } from 'react';
import { roomService } from '@/services';
import type { SeasonalRate } from '@/types/room.types';
import type { SeasonalRateFormData } from '@/components/features/Room/RoomWizard/RoomWizard.types';

interface UseSeasonalRatesManagementReturn {
  saveSeasonalRates: (
    currentRates: SeasonalRateFormData[],
    originalRates: SeasonalRate[]
  ) => Promise<void>;
}

/**
 * Hook for managing seasonal rates in edit mode
 *
 * @param roomId - The ID of the room being edited (undefined for create mode)
 * @returns Object with saveSeasonalRates function
 */
export function useSeasonalRatesManagement(
  roomId?: string
): UseSeasonalRatesManagementReturn {
  /**
   * Save seasonal rate changes by comparing current vs original
   * Determines which rates to create, update, or delete
   */
  const saveSeasonalRates = useCallback(
    async (
      currentRates: SeasonalRateFormData[],
      originalRates: SeasonalRate[]
    ) => {
      if (!roomId) {
        // Create mode - rates are handled inline with room creation
        return;
      }

      try {
        // Step 1: Find rates to delete (in original but not in current)
        const currentRateIds = new Set(
          currentRates.filter((r) => r.id).map((r) => r.id!)
        );
        const ratesToDelete = originalRates.filter(
          (originalRate) => !currentRateIds.has(originalRate.id)
        );

        // Step 2: Create Map for O(1) lookups (performance optimization)
        const originalRateMap = new Map(
          originalRates.map((rate) => [rate.id, rate])
        );

        // Step 3: Run deletions and creates/updates in parallel (not sequential)
        await Promise.all([
          // Delete removed rates
          ...ratesToDelete.map((rate) =>
            roomService.deleteSeasonalRate(roomId, rate.id)
          ),
          // Create or update current rates
          ...currentRates.map(async (rate) => {
            if (rate.id) {
              // Existing rate - check if it needs updating (O(1) lookup)
              const originalRate = originalRateMap.get(rate.id);
              if (originalRate && hasRateChanged(rate, originalRate)) {
                // Rate has changes - update it
                await roomService.updateSeasonalRate(roomId, rate.id, {
                  name: rate.name,
                  description: rate.description,
                  start_date: rate.start_date,
                  end_date: rate.end_date,
                  price_per_night: rate.price_per_night,
                  additional_person_rate: rate.additional_person_rate || undefined,
                  child_price_per_night: rate.child_price_per_night || undefined,
                  min_nights: rate.min_nights || undefined,
                  is_active: rate.is_active,
                });
              }
              // If no changes, skip update
            } else {
              // New rate - create it
              await roomService.addSeasonalRate(roomId, {
                name: rate.name,
                description: rate.description,
                start_date: rate.start_date,
                end_date: rate.end_date,
                price_per_night: rate.price_per_night,
                additional_person_rate: rate.additional_person_rate || undefined,
                child_price_per_night: rate.child_price_per_night || undefined,
                min_nights: rate.min_nights || undefined,
                is_active: rate.is_active,
              });
            }
          }),
        ]);
      } catch (error) {
        console.error('Failed to save seasonal rates:', error);
        throw error;
      }
    },
    [roomId]
  );

  return { saveSeasonalRates };
}

/**
 * Helper function to check if a seasonal rate has changed
 * Optimized with early exits - checks fastest comparisons first
 */
function hasRateChanged(
  current: SeasonalRateFormData,
  original: SeasonalRate
): boolean {
  // Quick primitive checks first (boolean and numbers are fastest)
  if (current.is_active !== original.is_active) return true;
  if (current.price_per_night !== original.price_per_night) return true;
  if (current.additional_person_rate !== original.additional_person_rate) return true;
  if (current.child_price_per_night !== original.child_price_per_night) return true;
  if (current.min_nights !== original.min_nights) return true;

  // String comparisons (slower)
  if (current.name !== original.name) return true;
  if (current.description !== original.description) return true;
  if (current.start_date !== original.start_date) return true;
  if (current.end_date !== original.end_date) return true;

  return false;
}
