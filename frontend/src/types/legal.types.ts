// ============================================================================
// Legal Types
// ============================================================================

export interface CancellationPolicyTier {
  days: number;
  refund: number;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  description: string | null;
  tiers: CancellationPolicyTier[];
  is_default: boolean;
  is_active: boolean;
  is_custom: boolean;
  created_by: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCancellationPolicyData {
  name: string;
  description?: string;
  tiers: CancellationPolicyTier[];
  is_default?: boolean;
  is_active?: boolean;
  is_custom?: boolean;
  created_by?: string;
  sort_order?: number;
}

export interface UpdateCancellationPolicyData {
  name?: string;
  description?: string;
  tiers?: CancellationPolicyTier[];
  is_default?: boolean;
  is_active?: boolean;
  sort_order?: number;
}
