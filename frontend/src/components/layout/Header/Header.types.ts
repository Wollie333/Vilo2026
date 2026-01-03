import { ReactNode } from 'react';

export interface HeaderProps {
  /** Main title displayed in header */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** User's display name */
  userName?: string;
  /** User's email */
  userEmail?: string;
  /** URL to user's avatar image */
  userAvatar?: string;
  /** Callback when profile is clicked */
  onProfileClick?: () => void;
  /** Callback when logout is clicked */
  onLogout?: () => void;
  /** Callback when help is clicked */
  onHelpClick?: () => void;
  /** Custom content for right side of header */
  rightContent?: ReactNode;
}
