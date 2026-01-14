/**
 * SelectableCard Types
 */

export interface SelectableCardProps {
  /**
   * Unique identifier for the card
   */
  id: string;

  /**
   * Whether this card is currently selected
   */
  selected: boolean;

  /**
   * Whether this card should be disabled (not selectable)
   */
  disabled?: boolean;

  /**
   * Callback when card selection changes
   */
  onSelect: (id: string) => void;

  /**
   * Card content (usually displays item details)
   */
  children: React.ReactNode;

  /**
   * Optional additional className
   */
  className?: string;
}
