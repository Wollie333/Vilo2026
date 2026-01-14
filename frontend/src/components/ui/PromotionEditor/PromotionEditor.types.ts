// ============================================================================
// PromotionEditor Types
// ============================================================================

export interface Promotion {
  code: string;
  discount: number;
  discount_type?: 'percentage' | 'fixed';
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface PromotionEditorProps {
  /** Array of promotions */
  promotions: Promotion[];
  /** Callback when promotions change */
  onPromotionsChange: (promotions: Promotion[]) => void;
  /** Seasonal message (banner text) */
  seasonalMessage?: string;
  /** Callback when seasonal message changes */
  onSeasonalMessageChange?: (message: string | undefined) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Maximum number of promotions allowed */
  maxPromotions?: number;
}
