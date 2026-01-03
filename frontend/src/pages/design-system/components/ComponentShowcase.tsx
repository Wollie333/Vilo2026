import React from 'react';
import { Card } from '@/components/ui';

interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ComponentShowcase({
  title,
  description,
  children,
  className = '',
}: ComponentShowcaseProps) {
  return (
    <Card variant="bordered" className={className}>
      <Card.Header>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </Card.Header>
      <Card.Body className="bg-gray-50 dark:bg-dark-bg">
        <div className="flex flex-wrap items-center gap-3">
          {children}
        </div>
      </Card.Body>
    </Card>
  );
}

interface ShowcaseSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ShowcaseSection({
  title,
  children,
  className = '',
}: ShowcaseSectionProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h4>
      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>
    </div>
  );
}

interface ShowcaseGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ShowcaseGrid({
  children,
  cols = 2,
  className = '',
}: ShowcaseGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid gap-6 ${colsClass[cols]} ${className}`}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {description}
      </p>
    </div>
  );
}
