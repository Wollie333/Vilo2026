import { ReactNode } from 'react';

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component */
  icon: ReactNode;
  /** Navigation URL */
  href: string;
  /** Sub-navigation items */
  children?: NavItem[];
  /** Badge content (count or text) */
  badge?: string | number;
  /** Section group label (renders as header) */
  section?: string;
}

export interface SidebarProps {
  /** Navigation items to display */
  items: NavItem[];
  /** Whether sidebar is collapsed */
  isCollapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: () => void;
  /** Currently active navigation item ID */
  activeItemId?: string;
  /** Callback when navigation item is clicked */
  onItemClick?: (item: NavItem) => void;
  /** Custom logo component */
  logo?: ReactNode;
  /** Property selector component to display above navigation */
  propertySelector?: ReactNode;
}
