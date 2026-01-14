/**
 * useBedManagement Hook
 *
 * Stateless utility hook for managing bed CRUD operations in edit mode.
 * Compares current beds with original beds to determine add/update/delete operations.
 */

import { useCallback } from 'react';
import { roomService } from '@/services';
import type { RoomBed } from '@/types/room.types';
import type { BedFormData } from '@/components/features/Room/RoomWizard/RoomWizard.types';

interface UseBedManagementReturn {
  saveBeds: (currentBeds: BedFormData[], originalBeds: RoomBed[]) => Promise<void>;
}

/**
 * Hook for managing bed configuration in edit mode
 *
 * @param roomId - The ID of the room being edited (undefined for create mode)
 * @returns Object with saveBeds function
 */
export function useBedManagement(roomId?: string): UseBedManagementReturn {
  /**
   * Save bed changes by comparing current vs original
   * Determines which beds to create, update, or delete
   */
  const saveBeds = useCallback(
    async (currentBeds: BedFormData[], originalBeds: RoomBed[]) => {
      if (!roomId) {
        // Create mode - beds are handled inline with room creation
        return;
      }

      try {
        // Step 1: Find beds to delete (in original but not in current)
        const currentBedIds = new Set(
          currentBeds.filter((b) => b.id).map((b) => b.id!)
        );
        const bedsToDelete = originalBeds.filter(
          (originalBed) => !currentBedIds.has(originalBed.id)
        );

        // Step 2: Create Map for O(1) lookups (performance optimization)
        const originalBedMap = new Map(
          originalBeds.map((bed) => [bed.id, bed])
        );

        // Step 3: Run deletions and creates/updates in parallel (not sequential)
        await Promise.all([
          // Delete removed beds
          ...bedsToDelete.map((bed) => roomService.deleteBed(roomId, bed.id)),
          // Create or update current beds
          ...currentBeds.map(async (bed) => {
            if (bed.id) {
              // Existing bed - check if it needs updating (O(1) lookup)
              const originalBed = originalBedMap.get(bed.id);
              if (
                originalBed &&
                (originalBed.bed_type !== bed.bed_type ||
                  originalBed.quantity !== bed.quantity ||
                  originalBed.sleeps !== bed.sleeps)
              ) {
                // Bed has changes - update it
                await roomService.updateBed(roomId, bed.id, {
                  bed_type: bed.bed_type,
                  quantity: bed.quantity,
                  sleeps: bed.sleeps,
                });
              }
              // If no changes, skip update
            } else {
              // New bed - create it
              await roomService.addBed(roomId, {
                bed_type: bed.bed_type,
                quantity: bed.quantity,
                sleeps: bed.sleeps,
              });
            }
          }),
        ]);
      } catch (error) {
        console.error('Failed to save beds:', error);
        throw error;
      }
    },
    [roomId]
  );

  return { saveBeds };
}
