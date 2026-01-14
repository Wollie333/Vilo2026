/**
 * AdminDetailLayout Component
 *
 * A reusable layout component for admin detail pages.
 * Features a sticky sidebar navigation with sections, main content area,
 * and optional right sidebar. Based on the UserDetailPage design pattern.
 *
 * @example
 * ```tsx
 * <AdminDetailLayout
 *   navSections={[
 *     {
 *       title: 'General',
 *       items: [
 *         { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
 *         { id: 'settings', label: 'Settings', icon: <SettingsIcon />, count: 3 },
 *       ]
 *     }
 *   ]}
 *   activeId="overview"
 *   onNavChange={(id) => setActiveId(id)}
 * >
 *   <YourContent />
 * </AdminDetailLayout>
 * ```
 */

import React from 'react';
import { Card } from '@/components/ui';
import type {
  AdminDetailLayoutProps,
  AdminNavItemProps,
  AdminSectionTitleProps,
  AdminNavSection,
} from './AdminDetailLayout.types';

// Icons
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

/**
 * Section title component for navigation groups
 */
const SectionTitle: React.FC<AdminSectionTitleProps> = ({ title }) => (
  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
    {title}
  </div>
);

/**
 * Individual navigation item
 */
const NavItem: React.FC<AdminNavItemProps> = ({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors
      ${isActive
        ? 'bg-primary/10 text-primary-700 font-medium'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-card'
      }
    `}
  >
    <div className="flex items-center gap-2.5">
      {item.icon && (
        <span className={isActive ? 'text-primary-700' : 'text-gray-500 dark:text-gray-400'}>
          {item.icon}
        </span>
      )}
      <span>{item.label}</span>
    </div>
    <div className="flex items-center gap-2">
      {item.count !== undefined && (
        <span className={`text-xs ${isActive ? 'text-primary-700/70' : 'text-gray-400 dark:text-gray-500'}`}>
          {item.count}
        </span>
      )}
      {item.isComplete && (
        <span className="text-green-500">
          <CheckIcon />
        </span>
      )}
    </div>
  </button>
);

/**
 * Navigation sidebar component
 */
const NavigationSidebar: React.FC<{
  sections: AdminNavSection[];
  activeId: string;
  onNavChange: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ sections, activeId, onNavChange, header, footer }) => (
  <Card variant="bordered" className="lg:sticky lg:top-6">
    <Card.Body className="p-2">
      {header && <div className="mb-2">{header}</div>}

      {sections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
          <SectionTitle title={section.title} />
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                onClick={() => onNavChange(item.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {footer && <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">{footer}</div>}
    </Card.Body>
  </Card>
);

/**
 * Get grid classes based on variant
 */
const getGridClasses = (variant: AdminDetailLayoutProps['variant'], hasRightSidebar: boolean): {
  container: string;
  leftSidebar: string;
  content: string;
  rightSidebar: string;
} => {
  switch (variant) {
    case 'wide-content':
      return {
        container: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
        leftSidebar: 'lg:col-span-2',
        content: hasRightSidebar ? 'lg:col-span-7' : 'lg:col-span-10',
        rightSidebar: 'lg:col-span-3',
      };
    case 'equal-columns':
      return {
        container: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
        leftSidebar: 'lg:col-span-3',
        content: hasRightSidebar ? 'lg:col-span-6' : 'lg:col-span-9',
        rightSidebar: 'lg:col-span-3',
      };
    default:
      return {
        container: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
        leftSidebar: 'lg:col-span-3',
        content: hasRightSidebar ? 'lg:col-span-5' : 'lg:col-span-9',
        rightSidebar: 'lg:col-span-4',
      };
  }
};

/**
 * AdminDetailLayout - Main component
 *
 * A flexible 2-3 column layout for admin detail pages.
 * Features:
 * - Sticky left sidebar navigation with sections
 * - Main content area
 * - Optional right sidebar for profile/summary info
 * - Multiple layout variants
 * - Responsive design (stacks on mobile)
 */
export const AdminDetailLayout: React.FC<AdminDetailLayoutProps> = ({
  navSections,
  activeId,
  onNavChange,
  children,
  rightSidebar,
  showRightSidebar = false,
  navHeader,
  navFooter,
  className = '',
  variant = 'default',
}) => {
  const hasRightSidebar = showRightSidebar && rightSidebar;
  const gridClasses = getGridClasses(variant, !!hasRightSidebar);

  return (
    <div className={`${gridClasses.container} ${className}`}>
      {/* Left Sidebar - Navigation */}
      <div className={gridClasses.leftSidebar}>
        <NavigationSidebar
          sections={navSections}
          activeId={activeId}
          onNavChange={onNavChange}
          header={navHeader}
          footer={navFooter}
        />
      </div>

      {/* Main Content */}
      <div className={gridClasses.content}>
        {children}
      </div>

      {/* Right Sidebar (optional) */}
      {hasRightSidebar && (
        <div className={gridClasses.rightSidebar}>
          <div className="lg:sticky lg:top-6">
            {rightSidebar}
          </div>
        </div>
      )}
    </div>
  );
};

// Export sub-components for flexibility
export { NavItem as AdminNavItemComponent };
export { SectionTitle as AdminSectionTitleComponent };
