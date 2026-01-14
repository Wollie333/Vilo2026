export interface MarketingFeatureCardProps {
  /** Primary title text */
  title: React.ReactNode;
  /** Secondary info text (dates, price, etc.) */
  subtitle?: string;
  /** Whether the feature is active */
  isActive?: boolean;
  /** Additional metadata to display */
  metadata?: string[];
  /** Edit button click handler */
  onEdit: () => void;
  /** Delete button click handler */
  onDelete: () => void;
  /** Additional CSS classes */
  className?: string;
}
