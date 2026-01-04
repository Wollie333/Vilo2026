import { useState, useRef, useEffect } from 'react';
import { Card } from '../Card';
import { Badge } from '../Badge';
import type {
  IntegrationCardProps,
  IntegrationCardHeaderProps,
  IntegrationCardContentProps,
  StatusBadgeProps,
  IntegrationStatus,
} from './IntegrationCard.types';

// Status configuration
const statusConfig: Record<IntegrationStatus, { label: string; variant: 'success' | 'default' | 'error' }> = {
  connected: { label: 'Connected', variant: 'success' },
  disconnected: { label: 'Not Connected', variant: 'default' },
  error: { label: 'Connection Error', variant: 'error' },
};

// Chevron Icon
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
      isExpanded ? 'rotate-180' : ''
    }`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Status Badge Component
const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Card Header Component
const IntegrationCardHeader = ({
  name,
  description,
  logo,
  status,
  isPrimary,
  isExpanded,
  onClick,
}: IntegrationCardHeaderProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
  >
    {/* Logo */}
    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
      {logo}
    </div>

    {/* Name and Description */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          {name}
        </h3>
        {isPrimary && (
          <Badge variant="primary" size="sm">
            Primary
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{description}</p>
    </div>

    {/* Status and Chevron */}
    <div className="flex items-center gap-3 flex-shrink-0">
      <StatusBadge status={status} />
      <ChevronIcon isExpanded={isExpanded} />
    </div>
  </button>
);

// Card Content Component with animation
const IntegrationCardContent = ({ isExpanded, children }: IntegrationCardContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(isExpanded ? contentHeight : 0);
    }
  }, [isExpanded, children]);

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{ height: height !== undefined ? `${height}px` : 'auto' }}
    >
      <div ref={contentRef}>
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// Main IntegrationCard Component
export function IntegrationCard({
  id,
  name,
  description,
  logo,
  status,
  isPrimary = false,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  children,
  className = '',
  ...rest
}: IntegrationCardProps) {
  // Support both controlled and uncontrolled usage
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newValue = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(newValue);
    }
    onToggle?.(newValue);
  };

  return (
    <Card
      variant="bordered"
      padding="none"
      className={`overflow-hidden ${className}`}
      {...rest}
    >
      <IntegrationCardHeader
        name={name}
        description={description}
        logo={logo}
        status={status}
        isPrimary={isPrimary}
        isExpanded={isExpanded}
        onClick={handleToggle}
      />
      <IntegrationCardContent isExpanded={isExpanded}>
        {children}
      </IntegrationCardContent>
    </Card>
  );
}

// Export sub-components for advanced usage
IntegrationCard.Header = IntegrationCardHeader;
IntegrationCard.Content = IntegrationCardContent;
IntegrationCard.StatusBadge = StatusBadge;
