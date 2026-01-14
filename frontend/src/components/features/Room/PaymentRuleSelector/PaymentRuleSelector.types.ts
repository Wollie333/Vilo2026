/**
 * PaymentRuleSelector Types
 */

export interface PaymentRuleSelectorProps {
  /**
   * Currently selected payment rule IDs
   */
  selectedIds: string[];

  /**
   * Callback when selection changes
   */
  onSelectionChange: (ids: string[]) => void;

  /**
   * Property ID to filter rules by
   */
  propertyId?: string;

  /**
   * Whether to allow multiple selections
   */
  multiple?: boolean;
}
