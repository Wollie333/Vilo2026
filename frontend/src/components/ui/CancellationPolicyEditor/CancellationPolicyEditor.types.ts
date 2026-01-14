// ============================================================================
// CancellationPolicyEditor Types
// ============================================================================

export interface CancellationPolicyPreset {
  value: string;
  label: string;
  description: string;
  tiers: {
    days: number;
    refund: number;
  }[];
}

export interface CancellationPolicyEditorProps {
  /** Currently selected policy */
  value: string | null | undefined;
  /** Callback when policy changes */
  onChange: (value: string | undefined) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}
