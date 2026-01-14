import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({ defaultValue, value, onValueChange, children, className = '', variant }: TabsProps) {
  // variant prop is passed through for reference but styling is on TabsList/TabsTrigger
  void variant;
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (id: string) => {
    if (value === undefined) {
      setInternalValue(id);
    }
    onValueChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export function TabsList({ children, className = '', variant = 'default' }: TabsListProps) {
  const variantClasses = {
    default: 'bg-gray-100 dark:bg-dark-card p-1 rounded-lg',
    pills: 'gap-2',
    underline: 'border-b border-gray-200 dark:border-dark-border gap-4',
  };

  return (
    <div
      role="tablist"
      className={`flex items-center ${variantClasses[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'pills' | 'underline';
}

export function TabsTrigger({
  value,
  children,
  className = '',
  disabled = false,
  variant = 'default',
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  const baseClasses = 'text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

  const variantClasses = {
    default: `
      px-3 py-1.5 rounded-md
      ${isActive
        ? 'bg-white dark:bg-dark-bg text-gray-900 dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }
    `,
    pills: `
      px-4 py-2 rounded-full
      ${isActive
        ? 'bg-primary text-white'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-card'
      }
    `,
    underline: `
      px-1 py-2 border-b-2 -mb-px
      ${isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300'
      }
    `,
  };

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={`mt-4 focus:outline-none ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
