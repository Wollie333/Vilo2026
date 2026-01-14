import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { QuickActionsProps } from './QuickActions.types';
import type { QuickAction } from '../../Dashboard.types';

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

const variantStyles = {
  primary: 'bg-primary-light dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30',
  outline: 'bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-card-hover',
  ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
};

const ActionButton: React.FC<{ action: QuickAction; variant: 'compact' | 'full' }> = ({
  action,
  variant,
}) => {
  const buttonStyle = variantStyles[action.variant || 'outline'];

  const content = (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-dark-border transition-colors cursor-pointer ${buttonStyle}`}
    >
      <div className={`p-2 rounded-lg ${action.variant === 'primary' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <span className={action.variant === 'primary' ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>
          {action.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm">
          {action.label}
        </p>
        {variant === 'full' && action.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {action.description}
          </p>
        )}
      </div>
      <svg
        className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );

  if (action.href) {
    return <Link to={action.href}>{content}</Link>;
  }

  if (action.onClick) {
    return <button onClick={action.onClick} className="w-full text-left">{content}</button>;
  }

  return content;
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  columns = 2,
  variant = 'full',
  title = 'Quick Actions',
  className = '',
}) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Card variant="bordered" className={className}>
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </Card.Header>
      <Card.Body>
        <div className={`grid ${columnClasses[columns]} gap-3`}>
          {actions.map((action) => (
            <ActionButton key={action.id} action={action} variant={variant} />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};
