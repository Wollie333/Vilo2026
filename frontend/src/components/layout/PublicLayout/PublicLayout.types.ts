/**
 * PublicLayout Types
 */

export type MenuType = 'default' | 'for-hosts';

export interface PublicLayoutProps {
  children: React.ReactNode;
  showSearchBar?: boolean;
  transparentHeader?: boolean;
  stickyHeader?: boolean;
  className?: string;
  menuType?: MenuType;
}
