import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, Button, Badge, Alert, LogoIcon, Logo, Input } from '@/components/ui';
import { designTokens } from '@/design-system';
import { PageHeader, ColorSwatch } from './components';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface ComponentItem {
  id: string;           // Variable name: "ds.inputs.textfield"
  title: string;        // Display name
  description: string;  // Full description
  href: string;         // Route path
  count: number;        // Variant count
  keywords: string[];   // Search keywords
}

interface ComponentCategory {
  id: string;           // Category ID
  title: string;        // Display title
  items: ComponentItem[];
}

// =============================================================================
// COMPONENT CATALOG - Industry Standard Categorization
// =============================================================================

const COMPONENT_CATALOG: ComponentCategory[] = [
  {
    id: 'actions',
    title: 'Actions',
    items: [
      {
        id: 'ds.actions.button',
        title: 'Button',
        description: 'Primary, secondary, outline, and ghost button variants',
        href: '/design-system/buttons',
        count: 4,
        keywords: ['click', 'action', 'submit', 'cta', 'primary', 'secondary', 'ghost', 'outline'],
      },
    ],
  },
  {
    id: 'inputs',
    title: 'Inputs & Forms',
    items: [
      {
        id: 'ds.inputs.textfield',
        title: 'Input',
        description: 'Text input fields with icons, validation, and helper text',
        href: '/design-system/forms',
        count: 3,
        keywords: ['text', 'field', 'form', 'textfield', 'textbox', 'input', 'type'],
      },
      {
        id: 'ds.inputs.phone',
        title: 'Phone Input',
        description: 'South African phone number input with formatting',
        href: '/design-system/forms',
        count: 1,
        keywords: ['phone', 'telephone', 'mobile', 'number', 'contact'],
      },
      {
        id: 'ds.inputs.masked',
        title: 'Masked Input',
        description: 'VAT numbers, company registration with auto-formatting',
        href: '/design-system/forms',
        count: 2,
        keywords: ['mask', 'format', 'vat', 'registration', 'pattern'],
      },
      {
        id: 'ds.inputs.textarea',
        title: 'Textarea',
        description: 'Multi-line text input with resize options',
        href: '/design-system/form-controls',
        count: 4,
        keywords: ['multiline', 'text', 'area', 'paragraph', 'description', 'notes'],
      },
      {
        id: 'ds.inputs.switch',
        title: 'Switch',
        description: 'Toggle switches for on/off states',
        href: '/design-system/form-controls',
        count: 3,
        keywords: ['toggle', 'on', 'off', 'boolean', 'enabled', 'disabled'],
      },
      {
        id: 'ds.inputs.checkbox',
        title: 'Checkbox',
        description: 'Checkboxes with indeterminate state support',
        href: '/design-system/form-controls',
        count: 3,
        keywords: ['check', 'tick', 'select', 'multiple', 'boolean'],
      },
      {
        id: 'ds.inputs.radio',
        title: 'Radio',
        description: 'Radio buttons and radio groups',
        href: '/design-system/form-controls',
        count: 3,
        keywords: ['radio', 'option', 'single', 'select', 'choice', 'group'],
      },
      {
        id: 'ds.inputs.multiselect',
        title: 'Multi Select',
        description: 'Multi-select dropdowns with grouping',
        href: '/design-system/forms',
        count: 1,
        keywords: ['dropdown', 'select', 'multiple', 'tags', 'options', 'picker'],
      },
      {
        id: 'ds.inputs.datepicker',
        title: 'Date Pickers',
        description: 'DateInput, DatePickerModal, and DateRangePicker components',
        href: '/design-system/date-pickers',
        count: 3,
        keywords: ['date', 'calendar', 'range', 'time', 'picker', 'schedule', 'modal', 'input'],
      },
      {
        id: 'ds.inputs.filtercard',
        title: 'Filter Card',
        description: 'Compound filter component with search and fields',
        href: '/design-system/forms',
        count: 1,
        keywords: ['filter', 'search', 'query', 'refine', 'criteria'],
      },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback & Status',
    items: [
      {
        id: 'ds.feedback.alert',
        title: 'Alert',
        description: 'Info, success, warning, and error alerts',
        href: '/design-system/elements',
        count: 4,
        keywords: ['message', 'notification', 'warning', 'error', 'info', 'success', 'banner'],
      },
      {
        id: 'ds.feedback.badge',
        title: 'Badge',
        description: 'Status badges with color variants and dot indicators',
        href: '/design-system/elements',
        count: 6,
        keywords: ['tag', 'label', 'status', 'indicator', 'chip', 'pill'],
      },
      {
        id: 'ds.feedback.progress',
        title: 'Progress',
        description: 'Linear and circular progress indicators',
        href: '/design-system/feedback',
        count: 4,
        keywords: ['loading', 'percent', 'bar', 'circular', 'completion', 'status'],
      },
      {
        id: 'ds.feedback.tooltip',
        title: 'Tooltip',
        description: 'Hover tooltips with positioning options',
        href: '/design-system/feedback',
        count: 4,
        keywords: ['hover', 'hint', 'help', 'info', 'popover', 'tip'],
      },
      {
        id: 'ds.feedback.toast',
        title: 'Toast',
        description: 'Toast notifications with actions and positions',
        href: '/design-system/notifications',
        count: 4,
        keywords: ['notification', 'snackbar', 'message', 'alert', 'popup'],
      },
      {
        id: 'ds.feedback.notifications',
        title: 'Notification Center',
        description: 'Bell icon with unread count and notification list',
        href: '/design-system/notifications',
        count: 1,
        keywords: ['bell', 'inbox', 'messages', 'alerts', 'unread'],
      },
    ],
  },
  {
    id: 'data',
    title: 'Data Display',
    items: [
      {
        id: 'ds.data.table',
        title: 'Table',
        description: 'Data tables with sorting, selection, and pagination',
        href: '/design-system/data-display',
        count: 3,
        keywords: ['data', 'grid', 'list', 'rows', 'columns', 'sort', 'paginate'],
      },
      {
        id: 'ds.data.emptystate',
        title: 'Empty State',
        description: 'No data, no results, and error state placeholders',
        href: '/design-system/data-display',
        count: 3,
        keywords: ['empty', 'no data', 'placeholder', 'zero', 'blank', 'error'],
      },
      {
        id: 'ds.data.charts',
        title: 'Charts',
        description: 'Bar, line, pie, and area chart components',
        href: '/design-system/charts',
        count: 4,
        keywords: ['graph', 'visualization', 'bar', 'line', 'pie', 'area', 'analytics'],
      },
      {
        id: 'ds.data.ratescalendar',
        title: 'Rates Calendar',
        description: 'Booking.com-style seasonal rates calendar tables',
        href: '/design-system/rates-calendar',
        count: 2,
        keywords: ['rates', 'calendar', 'booking', 'pricing', 'seasonal', 'availability', 'table'],
      },
    ],
  },
  {
    id: 'layout',
    title: 'Layout & Containers',
    items: [
      {
        id: 'ds.layout.admindetail',
        title: 'Admin Detail Layout',
        description: 'Sidebar navigation layout for admin detail pages',
        href: '/design-system/layouts',
        count: 3,
        keywords: ['admin', 'detail', 'sidebar', 'navigation', 'columns', 'grid', 'sticky'],
      },
      {
        id: 'ds.layout.card',
        title: 'Card',
        description: 'Card layouts with headers, bodies, and footers',
        href: '/design-system/cards',
        count: 6,
        keywords: ['container', 'panel', 'box', 'surface', 'wrapper', 'section'],
      },
      {
        id: 'ds.layout.integrationcard',
        title: 'Integration Card',
        description: 'Expandable cards for payment integrations',
        href: '/design-system/integration-card',
        count: 3,
        keywords: ['integration', 'payment', 'expandable', 'accordion', 'connection'],
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    items: [
      {
        id: 'ds.navigation.tabs',
        title: 'Tabs',
        description: 'Tab navigation with default, pills, and underline variants',
        href: '/design-system/navigation',
        count: 3,
        keywords: ['tab', 'switch', 'section', 'panel', 'view'],
      },
      {
        id: 'ds.navigation.breadcrumbs',
        title: 'Breadcrumbs',
        description: 'Navigation breadcrumbs with custom separators',
        href: '/design-system/navigation',
        count: 2,
        keywords: ['path', 'trail', 'hierarchy', 'location', 'back'],
      },
      {
        id: 'ds.navigation.pagination',
        title: 'Pagination',
        description: 'Page navigation with size variants',
        href: '/design-system/navigation',
        count: 3,
        keywords: ['page', 'next', 'previous', 'pages', 'navigate'],
      },
      {
        id: 'ds.navigation.dropdown',
        title: 'Dropdown',
        description: 'Dropdown menus with icons and alignment options',
        href: '/design-system/navigation',
        count: 3,
        keywords: ['menu', 'select', 'options', 'popover', 'actions'],
      },
      {
        id: 'ds.navigation.steps',
        title: 'Progress Steps',
        description: 'Step indicators with numbers, dots, and icons',
        href: '/design-system/navigation',
        count: 3,
        keywords: ['stepper', 'wizard', 'flow', 'process', 'stage'],
      },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    items: [
      {
        id: 'ds.overlays.modal',
        title: 'Modal',
        description: 'Modal dialogs with size variants and custom content',
        href: '/design-system/modals',
        count: 5,
        keywords: ['dialog', 'popup', 'overlay', 'lightbox', 'window'],
      },
      {
        id: 'ds.overlays.confirm',
        title: 'Confirm Dialog',
        description: 'Confirmation dialogs for destructive actions',
        href: '/design-system/modals',
        count: 3,
        keywords: ['confirm', 'delete', 'warning', 'destructive', 'approve'],
      },
    ],
  },
  {
    id: 'loading',
    title: 'Loading States',
    items: [
      {
        id: 'ds.loading.spinner',
        title: 'Spinner',
        description: 'Loading spinners with size and color variants',
        href: '/design-system/elements',
        count: 5,
        keywords: ['loading', 'wait', 'processing', 'busy', 'loader'],
      },
      {
        id: 'ds.loading.skeleton',
        title: 'Skeleton',
        description: 'Content placeholder skeletons with animation',
        href: '/design-system/feedback',
        count: 4,
        keywords: ['placeholder', 'loading', 'shimmer', 'pulse', 'preview'],
      },
    ],
  },
  {
    id: 'brand',
    title: 'Brand & Identity',
    items: [
      {
        id: 'ds.brand.logo',
        title: 'Logo',
        description: 'Logo and LogoIcon with size and animation variants',
        href: '/design-system',
        count: 6,
        keywords: ['brand', 'identity', 'icon', 'vilo', 'mark'],
      },
      {
        id: 'ds.brand.avatar',
        title: 'Avatar',
        description: 'User avatars with sizes, shapes, and status indicators',
        href: '/design-system/elements',
        count: 6,
        keywords: ['user', 'profile', 'picture', 'image', 'initials', 'photo'],
      },
    ],
  },
  {
    id: 'foundation',
    title: 'Foundation',
    items: [
      {
        id: 'ds.foundation.colors',
        title: 'Colors & Typography',
        description: 'Full color palette, typography scale, and spacing tokens',
        href: '/design-system/colors',
        count: 50,
        keywords: ['color', 'palette', 'font', 'text', 'size', 'spacing', 'tokens', 'theme'],
      },
    ],
  },
];

// =============================================================================
// ICONS
// =============================================================================

const ComponentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// =============================================================================
// COMPONENT CARD
// =============================================================================

interface ComponentCardProps {
  item: ComponentItem;
}

function ComponentCard({ item }: ComponentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link to={item.href} className="group">
      <Card variant="bordered" className="h-full transition-all hover:border-primary hover:shadow-md">
        <Card.Body>
          <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <ComponentIcon />
            </div>
            <Badge variant="primary" size="sm">{item.count}</Badge>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
            {item.description}
          </p>
          <button
            onClick={handleCopyId}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
            title="Click to copy"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {item.id}
          </button>
        </Card.Body>
      </Card>
    </Link>
  );
}

export function DesignSystemOverview() {
  const [searchQuery, setSearchQuery] = useState('');

  const brandColors = [
    { name: 'Primary', hex: designTokens.colors.primary.DEFAULT },
    { name: 'Black', hex: designTokens.colors.brand.black },
    { name: 'White', hex: designTokens.colors.brand.white },
    { name: 'Success', hex: designTokens.colors.success.DEFAULT },
    { name: 'Warning', hex: designTokens.colors.warning.DEFAULT },
    { name: 'Error', hex: designTokens.colors.error.DEFAULT },
    { name: 'Info', hex: designTokens.colors.info.DEFAULT },
  ];

  // Filter categories and items based on search query
  const query = searchQuery.toLowerCase();
  const filteredCategories = query
    ? COMPONENT_CATALOG.map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.keywords.some(k => k.toLowerCase().includes(query))
        ),
      })).filter(category => category.items.length > 0)
    : COMPONENT_CATALOG;

  const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);

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

      {/* Component Catalog */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Components
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {searchQuery ? `${totalResults} result${totalResults !== 1 ? 's' : ''} found` : `${COMPONENT_CATALOG.reduce((sum, cat) => sum + cat.items.length, 0)} components in ${COMPONENT_CATALOG.length} categories`}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name, keyword, or ds.xxx.xxx..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<SearchIcon />}
              size="sm"
            />
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {category.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {category.items.map((item) => (
                    <ComponentCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No components found matching "{searchQuery}"</p>
            <p className="text-xs mt-1">Try searching by component name, keyword, or variable name (e.g., ds.inputs.textfield)</p>
          </div>
        )}
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
