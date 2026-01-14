/**
 * usePaymentRulesManagement Hook
 *
 * Stateless utility hook for managing payment rule assignments in edit mode.
 * Uses junction table pattern: assigns/unassigns existing rules to rooms.
 * Does NOT create/update/delete the rules themselves.
 */

import { useCallback } from 'react';
import { paymentRulesService } from '@/services';
import type { PaymentRule } from '@/types/payment-rules.types';
import type { PaymentRuleFormData } from '@/types/payment-rules.types';

interface UsePaymentRulesManagementReturn {
  savePaymentRules: (
    currentRules: PaymentRuleFormData[],
    originalRules: PaymentRule[]
  ) => Promise<void>;
}

/**
 * Hook for managing payment rule assignments in edit mode
 *
 * @param roomId - The ID of the room being edited (undefined for create mode)
 * @param propertyId - The ID of the property the room belongs to (not used in assignment pattern)
 * @returns Object with savePaymentRules function
 */
export function usePaymentRulesManagement(
  roomId?: string,
  propertyId?: string
): UsePaymentRulesManagementReturn {
  /**
   * Save payment rule assignments by comparing current vs original
   * Creates/deletes junction table records (room-rule assignments)
   */
  const savePaymentRules = useCallback(
    async (
      currentRules: PaymentRuleFormData[],
      originalRules: PaymentRule[]
    ) => {
      console.log('[PaymentRulesManagement] savePaymentRules called');
      console.log('[PaymentRulesManagement] Room ID:', roomId);
      console.log('[PaymentRulesManagement] Current rules:', currentRules);
      console.log('[PaymentRulesManagement] Original rules:', originalRules);

      if (!roomId) {
        console.log('[PaymentRulesManagement] No room ID - skipping (create mode)');
        return;
      }

      try {
        // Extract rule IDs from current and original selections
        const currentRuleIds = new Set(
          currentRules.filter((r) => r.id).map((r) => r.id!)
        );
        const originalRuleIds = new Set(
          originalRules.map((r) => r.id)
        );

        console.log('[PaymentRulesManagement] Current rule IDs:', Array.from(currentRuleIds));
        console.log('[PaymentRulesManagement] Original rule IDs:', Array.from(originalRuleIds));

        // Find rules to assign (in current but not in original)
        const rulesToAssign = Array.from(currentRuleIds).filter(
          (ruleId) => !originalRuleIds.has(ruleId)
        );

        // Find rules to unassign (in original but not in current)
        const rulesToUnassign = Array.from(originalRuleIds).filter(
          (ruleId) => !currentRuleIds.has(ruleId)
        );

        console.log('[PaymentRulesManagement] Rules to assign:', rulesToAssign);
        console.log('[PaymentRulesManagement] Rules to unassign:', rulesToUnassign);

        // Execute assignments and unassignments in parallel
        const promises = [
          // Assign new rules (create junction table records)
          ...rulesToAssign.map((ruleId) => {
            console.log(`[PaymentRulesManagement] Assigning rule ${ruleId} to room ${roomId}`);
            return paymentRulesService.assignPaymentRuleToRooms(ruleId, [roomId]);
          }),
          // Unassign removed rules (delete junction table records)
          ...rulesToUnassign.map((ruleId) => {
            console.log(`[PaymentRulesManagement] Unassigning rule ${ruleId} from room ${roomId}`);
            return paymentRulesService.unassignPaymentRuleFromRoom(ruleId, roomId);
          }),
        ];

        console.log(`[PaymentRulesManagement] Executing ${promises.length} operations...`);
        await Promise.all(promises);
        console.log('[PaymentRulesManagement] All operations completed successfully');
      } catch (error) {
        console.error('[PaymentRulesManagement] Failed to save payment rule assignments:', error);
        throw error;
      }
    },
    [roomId]
  );

  return { savePaymentRules };
}
