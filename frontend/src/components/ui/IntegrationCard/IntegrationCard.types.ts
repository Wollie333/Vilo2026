import { ReactNode, HTMLAttributes } from 'react';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface IntegrationCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Unique identifier for the integration */
  id: string;
  /** Display name of the integration */
  name: string;
  /** Brief description of the integration */
  description: string;
  /** Logo or icon to display */
  logo: ReactNode;
  /** Connection status of the integration */
  status: IntegrationStatus;
  /** Whether this is the primary/default integration */
  isPrimary?: boolean;
  /** Controlled expanded state */
  isExpanded?: boolean;
  /** Default expanded state for uncontrolled usage */
  defaultExpanded?: boolean;
  /** Callback when card is toggled */
  onToggle?: (expanded: boolean) => void;
  /** Content to show when expanded */
  children?: ReactNode;
  /** Additional class names */
  className?: string;
}

export interface IntegrationCardHeaderProps {
  name: string;
  description: string;
  logo: ReactNode;
  status: IntegrationStatus;
  isPrimary?: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export interface IntegrationCardContentProps {
  isExpanded: boolean;
  children?: ReactNode;
}

export interface StatusBadgeProps {
  status: IntegrationStatus;
}
