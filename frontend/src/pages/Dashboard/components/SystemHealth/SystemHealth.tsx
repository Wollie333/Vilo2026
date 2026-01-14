import React from 'react';
import { Card } from '@/components/ui/Card';
import type { SystemHealthProps } from './SystemHealth.types';

const statusStyles = {
  healthy: {
    dot: 'bg-success',
    text: 'text-success',
    label: 'Healthy',
  },
  warning: {
    dot: 'bg-warning',
    text: 'text-warning',
    label: 'Warning',
  },
  error: {
    dot: 'bg-error',
    text: 'text-error',
    label: 'Error',
  },
};

export const SystemHealth: React.FC<SystemHealthProps> = ({
  indicators,
  title = 'System Health',
  className = '',
}) => {
  const healthyCount = indicators.filter((i) => i.status === 'healthy').length;
  const warningCount = indicators.filter((i) => i.status === 'warning').length;
  const errorCount = indicators.filter((i) => i.status === 'error').length;

  const overallStatus =
    errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';
  const overallStyles = statusStyles[overallStatus];

  return (
    <Card variant="bordered" className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${overallStyles.dot} animate-pulse`}
            />
            <span className={`text-sm font-medium ${overallStyles.text}`}>
              {overallStyles.label}
            </span>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-dark-border">
          {indicators.map((indicator) => {
            const styles = statusStyles[indicator.status];
            return (
              <div
                key={indicator.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {indicator.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last checked: {indicator.lastChecked}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {indicator.value && (
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {indicator.value}
                    </p>
                  )}
                  <p className={`text-xs font-medium ${styles.text}`}>
                    {styles.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-dark-card-hover border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-gray-600 dark:text-gray-400">
                  {healthyCount} Healthy
                </span>
              </span>
              {warningCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {warningCount} Warning
                  </span>
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {errorCount} Error
                  </span>
                </span>
              )}
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              {indicators.length} services
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};
