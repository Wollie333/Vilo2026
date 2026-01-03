import { useState, useEffect } from 'react';
import { SidebarProps, NavItem } from './Sidebar.types';
import { Logo, LogoIcon } from '@/components/ui/Logo';

// Icons
const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: (item: NavItem) => void;
  activeItemId?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function NavItemComponent({
  item,
  isActive,
  isCollapsed,
  onClick,
  activeItemId,
  isExpanded,
  onToggleExpand,
}: NavItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0;

  // Check if any child is active
  const hasActiveChild = hasChildren && item.children?.some(
    (child) => child.id === activeItemId
  );

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            onToggleExpand();
          } else {
            onClick(item);
          }
        }}
        className={`
          w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md
          transition-colors duration-200
          ${
            isActive || hasActiveChild
              ? 'bg-primary/10 text-primary dark:bg-primary/20'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-card'
          }
        `}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-xs font-medium">
              {item.label}
            </span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-brand-black rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <span className="flex-shrink-0">
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </span>
            )}
          </>
        )}
      </button>

      {/* Submenu */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children!.map((child) => (
            <button
              key={child.id}
              onClick={() => onClick(child)}
              className={`
                w-full flex items-center gap-2 px-2.5 py-1 rounded-md text-xs
                transition-colors duration-200
                ${
                  child.id === activeItemId
                    ? 'text-primary'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }
              `}
            >
              {child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  items,
  isCollapsed = false,
  onToggleCollapse,
  activeItemId,
  onItemClick,
  logo,
}: SidebarProps) {
  // Track which items are expanded - persists across navigation
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // Initialize with items that have active children
    const initialExpanded = new Set<string>();
    items.forEach((item) => {
      if (item.children?.some((child) => child.id === activeItemId)) {
        initialExpanded.add(item.id);
      }
    });
    return initialExpanded;
  });

  // Auto-expand parent when child becomes active
  useEffect(() => {
    items.forEach((item) => {
      if (item.children?.some((child) => child.id === activeItemId)) {
        setExpandedItems((prev) => new Set(prev).add(item.id));
      }
    });
  }, [activeItemId, items]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Group items by section
  const groupedItems: { section: string | null; items: NavItem[] }[] = [];
  let currentSection: string | null = null;
  let currentGroup: NavItem[] = [];

  items.forEach((item) => {
    if (item.section && item.section !== currentSection) {
      if (currentGroup.length > 0) {
        groupedItems.push({ section: currentSection, items: currentGroup });
      }
      currentSection = item.section;
      currentGroup = [item];
    } else {
      currentGroup.push(item);
    }
  });
  if (currentGroup.length > 0) {
    groupedItems.push({ section: currentSection, items: currentGroup });
  }

  return (
    <aside
      className={`
        h-screen bg-white dark:bg-dark-sidebar
        border-r border-gray-200 dark:border-dark-border
        transition-all duration-300 ease-in-out
        flex flex-col
        ${isCollapsed ? 'w-14' : 'w-60'}
      `}
    >
      {/* Logo & Toggle - h-14 matches header height */}
      <div className={`flex items-center h-14 px-3 border-b border-gray-200 dark:border-dark-border ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              {logo || <Logo size="xs" iconSize="md" />}
            </div>
            {/* Toggle button - only when expanded */}
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </>
        ) : (
          /* Logo icon is the toggle when collapsed */
          <button
            onClick={onToggleCollapse}
            className="rounded-md hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <LogoIcon size="md" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2.5">
        {groupedItems.map((group, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-5' : ''}>
            {/* Section header */}
            {group.section && !isCollapsed && (
              <div className="px-2.5 mb-1.5">
                <span className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group.section}
                </span>
              </div>
            )}
            {/* Section items */}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavItemComponent
                  key={item.id}
                  item={item}
                  isActive={activeItemId === item.id}
                  isCollapsed={isCollapsed}
                  onClick={onItemClick || (() => {})}
                  activeItemId={activeItemId}
                  isExpanded={expandedItems.has(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
