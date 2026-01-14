export interface FilterToggleButtonProps {
  /** Whether the filter panel is currently open */
  isOpen: boolean;
  /** Callback when the button is clicked */
  onToggle: () => void;
  /** Number of active filters (shown as badge) */
  activeFilterCount?: number;
  /** Optional custom className */
  className?: string;
}
