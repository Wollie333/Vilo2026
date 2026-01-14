export interface CTAButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'dark';
  size?: 'default' | 'large';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  /** ID for tracking and analytics */
  id?: string;
  /** Data attributes for analytics tracking */
  dataAttributes?: Record<string, string>;
}
