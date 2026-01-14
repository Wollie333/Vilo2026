/**
 * AdminDetailLayout Types
 *
 * Type definitions for the admin detail layout component.
 */

import type { ReactNode } from 'react';

/**
 * Navigation item for the sidebar
 */
export interface AdminNavItem {
  /** Unique identifier for the nav item */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon?: ReactNode;
  /** Optional count badge */
  count?: number;
  /** Whether this item is completed (shows checkmark) */
  isComplete?: boolean;
}

/**
 * Navigation section grouping items
 */
export interface AdminNavSection {
  /** Section title (displayed uppercase) */
  title: string;
  /** Items in this section */
  items: AdminNavItem[];
}

/**
 * Props for the AdminDetailLayout component
 */
export interface AdminDetailLayoutProps {
  /** Navigation sections for the sidebar */
  navSections: AdminNavSection[];
  /** Currently active nav item ID */
  activeId: string;
  /** Callback when nav item is clicked */
  onNavChange: (id: string) => void;
  /** Main content area */
  children: ReactNode;
  /** Optional right sidebar content */
  rightSidebar?: ReactNode;
  /** Whether to show the right sidebar */
  showRightSidebar?: boolean;
  /** Optional header content above navigation */
  navHeader?: ReactNode;
  /** Optional footer content below navigation */
  navFooter?: ReactNode;
  /** Custom class for the container */
  className?: string;
  /** Layout variant */
  variant?: 'default' | 'wide-content' | 'equal-columns';
}

/**
 * Props for the NavItem sub-component
 */
export interface AdminNavItemProps {
  item: AdminNavItem;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Props for the SectionTitle sub-component
 */
export interface AdminSectionTitleProps {
  title: string;
}
