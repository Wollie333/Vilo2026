import { Link } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, Button, Badge, Alert, LogoIcon, Logo } from '@/components/ui';
import { designTokens } from '@/design-system';
import { PageHeader, ColorSwatch } from './components';

const ComponentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

interface QuickLinkProps {
  title: string;
  description: string;
  href: string;
  count: number;
}

function QuickLink({ title, description, href, count }: QuickLinkProps) {
  return (
    <Link to={href} className="group">
      <Card variant="bordered" className="h-full transition-all hover:border-primary hover:shadow-md">
        <Card.Body>
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <ComponentIcon />
            </div>
            <Badge variant="primary" size="sm">{count}</Badge>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        </Card.Body>
      </Card>
    </Link>
  );
}

export function DesignSystemOverview() {
  const brandColors = [
    { name: 'Primary', hex: designTokens.colors.primary.DEFAULT },
    { name: 'Black', hex: designTokens.colors.brand.black },
    { name: 'White', hex: designTokens.colors.brand.white },
    { name: 'Success', hex: designTokens.colors.success.DEFAULT },
    { name: 'Warning', hex: designTokens.colors.warning.DEFAULT },
    { name: 'Error', hex: designTokens.colors.error.DEFAULT },
    { name: 'Info', hex: designTokens.colors.info.DEFAULT },
  ];

  const quickLinks: QuickLinkProps[] = [
    {
      title: 'Buttons',
      description: 'Primary, secondary, outline, and ghost button variants',
      href: '/design-system/buttons',
      count: 4,
    },
    {
      title: 'Forms',
      description: 'Input fields, multi-select, and date pickers',
      href: '/design-system/forms',
      count: 3,
    },
    {
      title: 'Cards',
      description: 'Card layouts with headers, bodies, and footers',
      href: '/design-system/cards',
      count: 3,
    },
    {
      title: 'UI Elements',
      description: 'Badges, alerts, avatars, and spinners',
      href: '/design-system/elements',
      count: 4,
    },
    {
      title: 'Modals',
      description: 'Modal dialogs and confirmation popups',
      href: '/design-system/modals',
      count: 2,
    },
    {
      title: 'Charts',
      description: 'Bar, line, pie, and area chart components',
      href: '/design-system/charts',
      count: 4,
    },
    {
      title: 'Colors & Typography',
      description: 'Full color palette and typography scale',
      href: '/design-system/colors',
      count: 50,
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Design System"
          description="A comprehensive collection of reusable UI components and design tokens for building consistent interfaces."
        />

      {/* Brand Overview */}
      <Card variant="bordered">
        <Card.Header>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Brand Overview
          </h2>
        </Card.Header>
        <Card.Body className="space-y-6">
          {/* Primary Brand Lockup */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Logo size="xl" variant="glossy-slow" />
            <div className="flex-1">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                The Vilo design system provides a consistent visual language across all interfaces.
                Built with Tailwind CSS and React, it emphasizes clarity, accessibility, and modern aesthetics.
              </p>
            </div>
          </div>

          {/* Logo Variations */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Logo Variations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Static */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-card">
                <LogoIcon size="xl" variant="static" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Static</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Favicons, print, small sizes</p>
                </div>
              </div>

              {/* Glossy Fast */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-card">
                <LogoIcon size="xl" variant="glossy-fast" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Glossy (3s)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Buttons, nav, general use</p>
                </div>
              </div>

              {/* Glossy Slow */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-card">
                <LogoIcon size="xl" variant="glossy-slow" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Glossy (6s)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hero, premium, dashboard</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Sizes */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Logo Sizes
            </h3>
            <div className="flex flex-wrap items-end gap-6">
              {(['xs', 'sm', 'md', 'lg', 'xl', 'hero'] as const).map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <LogoIcon size={size} variant="static" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Logo with Text */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
              Logo with Text
            </h3>
            <div className="flex flex-wrap items-center gap-8">
              <Logo size="sm" variant="static" />
              <Logo size="md" variant="glossy-fast" />
              <Logo size="lg" variant="glossy-slow" />
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Usage Guidelines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-primary mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span><strong>Static:</strong> Use for favicons, print materials, and sizes below 32px</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span><strong>Glossy Fast:</strong> Interactive elements, buttons, navigation bars</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span><strong>Glossy Slow:</strong> Hero sections, dashboards, premium contexts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span><strong>Minimum size:</strong> xs (20px) for icon only, sm (24px) with text</span>
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
              Usage
            </h3>
            <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto">
{`import { Logo, LogoIcon } from '@/components/ui';

// Logo with text
<Logo size="lg" variant="glossy-slow" />

// Icon only
<LogoIcon size="md" variant="glossy-fast" />

// Static (no animation)
<LogoIcon size="sm" variant="static" />`}
            </pre>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Components
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <QuickLink key={link.title} {...link} />
          ))}
        </div>
      </div>

      {/* Brand Colors Preview */}
      <Card variant="bordered">
        <Card.Header>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Brand Colors
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-4">
            {brandColors.map((color) => (
              <ColorSwatch key={color.name} name={color.name} hex={color.hex} />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
            <Link to="/design-system/colors">
              <Button variant="outline" size="sm">
                View Full Palette
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>

        {/* Quick Start */}
        <Alert variant="info" title="Quick Start">
          <p className="text-xs">
            Import components from <code className="bg-gray-100 dark:bg-dark-card px-1 py-0.5 rounded">@/components/ui</code> and
            design tokens from <code className="bg-gray-100 dark:bg-dark-card px-1 py-0.5 rounded">@/design-system</code>.
            All components support dark mode and are fully accessible.
          </p>
        </Alert>
      </div>
    </AuthenticatedLayout>
  );
}
