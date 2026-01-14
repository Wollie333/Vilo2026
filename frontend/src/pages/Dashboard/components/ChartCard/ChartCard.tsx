import React from 'react';
import { Card } from '@/components/ui/Card';
import type { ChartCardProps } from './ChartCard.types';

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  height = 256,
  actions,
  className = '',
}) => {
  return (
    <Card variant="bordered" className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </Card.Header>
      <Card.Body className="p-4">
        <div style={{ height, minHeight: height, minWidth: 0 }}>{children}</div>
      </Card.Body>
    </Card>
  );
};
