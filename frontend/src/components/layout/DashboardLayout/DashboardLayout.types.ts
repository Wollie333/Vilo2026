import { ReactNode } from 'react';
import { NavItem } from '../Sidebar/Sidebar.types';

export interface DashboardLayoutProps {
  /** Main content to display */
  children: ReactNode;
  /** Navigation items for sidebar (optional, defaults to empty array) */
  navItems?: NavItem[];
  /** Currently active navigation item ID */
  activeNavId?: string;
  /** Callback when navigation item is clicked */
  onNavItemClick?: (item: NavItem) => void;
  /** Title displayed in header */
  headerTitle?: string;
  /** Subtitle displayed in header */
  headerSubtitle?: string;
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
  /** Remove default padding from content area */
  noPadding?: boolean;
  /** Property selector component to display in sidebar */
  propertySelector?: ReactNode;
}
