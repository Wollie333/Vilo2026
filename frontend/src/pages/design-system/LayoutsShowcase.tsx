/**
 * LayoutsShowcase
 *
 * Design system showcase for layout components.
 */

import { useState } from 'react';
import { AuthenticatedLayout, AdminDetailLayout } from '@/components/layout';
import { Card, Badge, Alert } from '@/components/ui';
import { PageHeader, PropsTable } from './components';
import type { AdminNavSection } from '@/components/layout';

// Icons for demo
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SecurityIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Props tables
const adminDetailLayoutProps = [
  { name: 'navSections', type: 'AdminNavSection[]', required: true, description: 'Navigation sections with items for the sidebar' },
  { name: 'activeId', type: 'string', required: true, description: 'Currently active navigation item ID' },
  { name: 'onNavChange', type: '(id: string) => void', required: true, description: 'Callback when navigation item is clicked' },
  { name: 'children', type: 'ReactNode', required: true, description: 'Main content area content' },
  { name: 'rightSidebar', type: 'ReactNode', default: 'undefined', description: 'Optional right sidebar content' },
  { name: 'showRightSidebar', type: 'boolean', default: 'false', description: 'Whether to show the right sidebar' },
  { name: 'navHeader', type: 'ReactNode', default: 'undefined', description: 'Optional header content above navigation' },
  { name: 'navFooter', type: 'ReactNode', default: 'undefined', description: 'Optional footer content below navigation' },
  { name: 'variant', type: "'default' | 'wide-content' | 'equal-columns'", default: "'default'", description: 'Layout column distribution variant' },
  { name: 'className', type: 'string', default: "''", description: 'Additional CSS classes for the container' },
];

const navItemProps = [
  { name: 'id', type: 'string', required: true, description: 'Unique identifier for the nav item' },
  { name: 'label', type: 'string', required: true, description: 'Display label' },
  { name: 'icon', type: 'ReactNode', default: 'undefined', description: 'Optional icon component' },
  { name: 'count', type: 'number', default: 'undefined', description: 'Optional count badge' },
  { name: 'isComplete', type: 'boolean', default: 'false', description: 'Shows checkmark when complete' },
];

// Demo content component
const DemoContent: React.FC<{ activeId: string }> = ({ activeId }) => {
  const contentMap: Record<string, { title: string; description: string }> = {
    overview: { title: 'Overview', description: 'Dashboard overview with key metrics and recent activity.' },
    users: { title: 'Users', description: 'Manage user accounts, permissions, and team members.' },
    analytics: { title: 'Analytics', description: 'View charts, reports, and performance metrics.' },
    settings: { title: 'Settings', description: 'Configure application preferences and options.' },
    security: { title: 'Security', description: 'Manage authentication, roles, and access control.' },
  };

  const content = contentMap[activeId] || contentMap.overview;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{content.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{content.description}</p>
      </div>
      <Card variant="bordered">
        <Card.Body className="py-12 text-center">
          <p className="text-gray-400 dark:text-gray-500">Content for "{content.title}" section</p>
        </Card.Body>
      </Card>
    </div>
  );
};

// Demo right sidebar
const DemoRightSidebar: React.FC = () => (
  <Card variant="bordered">
    <Card.Body className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">JD</span>
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white">John Doe</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">Administrator</p>
      </div>
      <div className="border-t border-gray-200 dark:border-dark-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <Badge variant="success">Active</Badge>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Last Login</span>
          <span className="text-gray-900 dark:text-white">2 hours ago</span>
        </div>
      </div>
    </Card.Body>
  </Card>
);

export function LayoutsShowcase() {
  const [activeId, setActiveId] = useState('overview');
  const [variant, setVariant] = useState<'default' | 'wide-content' | 'equal-columns'>('default');
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Demo navigation sections
  const navSections: AdminNavSection[] = [
    {
      title: 'General',
      items: [
        { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
        { id: 'users', label: 'Users', icon: <UsersIcon />, count: 12 },
        { id: 'analytics', label: 'Analytics', icon: <ChartIcon /> },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { id: 'settings', label: 'Settings', icon: <SettingsIcon />, isComplete: true },
        { id: 'security', label: 'Security', icon: <SecurityIcon /> },
      ],
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Layouts"
          description="Layout components for structuring admin pages with sidebar navigation and content areas."
        />

        {/* AdminDetailLayout Section */}
        <Card variant="bordered">
          <Card.Header>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  AdminDetailLayout
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  A flexible 2-3 column layout for admin detail pages with sticky sidebar navigation
                </p>
              </div>
              <Badge variant="primary">New</Badge>
            </div>
          </Card.Header>
          <Card.Body className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Variant:</span>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value as typeof variant)}
                  className="text-sm border border-gray-300 dark:border-dark-border rounded-md px-2 py-1 bg-white dark:bg-dark-card"
                >
                  <option value="default">Default</option>
                  <option value="wide-content">Wide Content</option>
                  <option value="equal-columns">Equal Columns</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRightSidebar}
                  onChange={(e) => setShowRightSidebar(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Show Right Sidebar</span>
              </label>
            </div>

            {/* Live Demo */}
            <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-dark-bg px-4 py-2 border-b border-gray-200 dark:border-dark-border">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Live Preview</span>
              </div>
              <div className="p-4 bg-white dark:bg-dark-sidebar min-h-[400px]">
                <AdminDetailLayout
                  navSections={navSections}
                  activeId={activeId}
                  onNavChange={setActiveId}
                  variant={variant}
                  showRightSidebar={showRightSidebar}
                  rightSidebar={<DemoRightSidebar />}
                >
                  <DemoContent activeId={activeId} />
                </AdminDetailLayout>
              </div>
            </div>

            {/* Usage Example */}
            <Alert variant="info">
              <p className="text-sm font-medium mb-2">Usage Example</p>
              <pre className="text-xs bg-gray-100 dark:bg-dark-bg p-3 rounded-md overflow-x-auto">
{`<AdminDetailLayout
  navSections={[
    {
      title: 'General',
      items: [
        { id: 'overview', label: 'Overview', icon: <HomeIcon /> },
        { id: 'users', label: 'Users', icon: <UsersIcon />, count: 12 },
      ],
    },
  ]}
  activeId={activeId}
  onNavChange={setActiveId}
  variant="default"
  showRightSidebar={true}
  rightSidebar={<ProfileCard />}
>
  <YourContent />
</AdminDetailLayout>`}
              </pre>
            </Alert>
          </Card.Body>
        </Card>

        {/* Layout Variants */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Layout Variants
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Three layout variants for different content needs
            </p>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="feature" padding="md">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Default
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  3-5-4 column ratio. Best for pages with rich right sidebar content like profiles.
                </p>
                <div className="flex gap-1 h-8">
                  <div className="w-1/4 bg-primary/20 rounded" />
                  <div className="flex-1 bg-primary/40 rounded" />
                  <div className="w-1/3 bg-primary/20 rounded" />
                </div>
              </Card>

              <Card variant="feature" padding="md">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Wide Content
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  2-7-3 column ratio. Minimal navigation, maximum content space.
                </p>
                <div className="flex gap-1 h-8">
                  <div className="w-1/6 bg-primary/20 rounded" />
                  <div className="flex-1 bg-primary/40 rounded" />
                  <div className="w-1/4 bg-primary/20 rounded" />
                </div>
              </Card>

              <Card variant="feature" padding="md">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Equal Columns
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  3-6-3 column ratio. Balanced layout for comparison views.
                </p>
                <div className="flex gap-1 h-8">
                  <div className="w-1/4 bg-primary/20 rounded" />
                  <div className="flex-1 bg-primary/40 rounded" />
                  <div className="w-1/4 bg-primary/20 rounded" />
                </div>
              </Card>
            </div>
          </Card.Body>
        </Card>

        {/* Navigation Features */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Navigation Features
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Sidebar navigation supports sections, icons, counts, and completion states
            </p>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="gradient" padding="md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <HomeIcon />
                  </div>
                  <span className="font-medium text-sm">Icons</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Each nav item can have an icon for visual identification
                </p>
              </Card>

              <Card variant="gradient" padding="md">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">12</Badge>
                  <span className="font-medium text-sm">Counts</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Display counts for items like users, notifications, etc.
                </p>
              </Card>

              <Card variant="gradient" padding="md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="font-medium text-sm">Completion</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Show completion status with checkmarks for wizard flows
                </p>
              </Card>

              <Card variant="gradient" padding="md">
                <div className="mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Section</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Group related items under section headers
                </p>
              </Card>
            </div>
          </Card.Body>
        </Card>

        {/* Props Table - AdminDetailLayout */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              AdminDetailLayout Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={adminDetailLayoutProps} />
          </Card.Body>
        </Card>

        {/* Props Table - AdminNavItem */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              AdminNavItem Props
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Properties for each navigation item in navSections
            </p>
          </Card.Header>
          <Card.Body>
            <PropsTable props={navItemProps} />
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
