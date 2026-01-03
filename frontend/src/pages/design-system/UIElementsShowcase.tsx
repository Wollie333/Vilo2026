import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Badge, Alert, Avatar, Spinner, Card } from '@/components/ui';
import { PageHeader, ComponentShowcase, ShowcaseGrid, PropsTable } from './components';

const badgeProps = [
  { name: 'variant', type: "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'", default: "'default'", description: 'Badge color variant' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Badge size' },
  { name: 'dot', type: 'boolean', default: 'false', description: 'Show dot indicator' },
  { name: 'rounded', type: 'boolean', default: 'true', description: 'Use pill shape' },
];

const alertProps = [
  { name: 'variant', type: "'info' | 'success' | 'warning' | 'error'", default: "'info'", description: 'Alert type' },
  { name: 'title', type: 'string', description: 'Alert title' },
  { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show dismiss button' },
  { name: 'onDismiss', type: '() => void', description: 'Dismiss callback' },
  { name: 'showIcon', type: 'boolean', default: 'true', description: 'Show variant icon' },
];

const avatarProps = [
  { name: 'src', type: 'string', description: 'Image URL' },
  { name: 'name', type: 'string', description: 'Name for initials fallback' },
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: 'Avatar size' },
  { name: 'shape', type: "'circle' | 'square'", default: "'circle'", description: 'Avatar shape' },
  { name: 'status', type: "'online' | 'offline' | 'busy' | 'away'", description: 'Status indicator' },
];

const spinnerProps = [
  { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", default: "'md'", description: 'Spinner size' },
  { name: 'variant', type: "'primary' | 'white' | 'gray'", default: "'primary'", description: 'Spinner color' },
  { name: 'label', type: 'string', description: 'Accessibility label' },
];

export function UIElementsShowcase() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="UI Elements"
          description="Small, reusable UI components for indicators, feedback, and visual elements."
        />

      {/* Badge */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Badge
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Small labels for status, counts, and categorization
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="Variants" description="Six color variants for different contexts">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </ComponentShowcase>

            <ComponentShowcase title="Sizes" description="Three size options">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </ComponentShowcase>

            <ComponentShowcase title="With Dot" description="Status indicator dot">
              <Badge variant="success" dot>Active</Badge>
              <Badge variant="warning" dot>Pending</Badge>
              <Badge variant="error" dot>Inactive</Badge>
            </ComponentShowcase>

            <ComponentShowcase title="Shape" description="Rounded vs square">
              <Badge rounded>Rounded</Badge>
              <Badge rounded={false}>Square</Badge>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
        <Card.Footer>
          <PropsTable props={badgeProps} />
        </Card.Footer>
      </Card>

      {/* Alert */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Alert
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Contextual feedback messages for user actions
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <Alert variant="info" title="Information">
              This is an informational alert to provide neutral context.
            </Alert>

            <Alert variant="success" title="Success">
              Your changes have been saved successfully.
            </Alert>

            <Alert variant="warning" title="Warning">
              Please review your input before proceeding.
            </Alert>

            <Alert variant="error" title="Error">
              An error occurred while processing your request.
            </Alert>

            <Alert variant="info" dismissible title="Dismissible">
              This alert can be dismissed by clicking the X button.
            </Alert>

            <Alert variant="success" showIcon={false}>
              Alert without icon for simpler messages.
            </Alert>
          </div>
        </Card.Body>
        <Card.Footer>
          <PropsTable props={alertProps} />
        </Card.Footer>
      </Card>

      {/* Avatar */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Avatar
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            User profile images with fallback to initials
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="Sizes" description="Six size options">
              <Avatar name="John Doe" size="xs" />
              <Avatar name="John Doe" size="sm" />
              <Avatar name="John Doe" size="md" />
              <Avatar name="John Doe" size="lg" />
              <Avatar name="John Doe" size="xl" />
              <Avatar name="John Doe" size="2xl" />
            </ComponentShowcase>

            <ComponentShowcase title="Shapes" description="Circle and square">
              <Avatar name="Jane Smith" size="lg" shape="circle" />
              <Avatar name="Jane Smith" size="lg" shape="square" />
            </ComponentShowcase>

            <ComponentShowcase title="Status Indicators" description="Online, offline, busy, away">
              <Avatar name="User" size="lg" status="online" />
              <Avatar name="User" size="lg" status="offline" />
              <Avatar name="User" size="lg" status="busy" />
              <Avatar name="User" size="lg" status="away" />
            </ComponentShowcase>

            <ComponentShowcase title="Initials Colors" description="Auto-generated from name">
              <Avatar name="Alice Brown" size="lg" />
              <Avatar name="Bob Wilson" size="lg" />
              <Avatar name="Carol White" size="lg" />
              <Avatar name="David Green" size="lg" />
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
        <Card.Footer>
          <PropsTable props={avatarProps} />
        </Card.Footer>
      </Card>

      {/* Spinner */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Spinner
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Loading indicators for async operations
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="Sizes" description="Five size options">
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="xl" />
            </ComponentShowcase>

            <ComponentShowcase title="Variants" description="Color options">
              <div className="flex items-center gap-4">
                <Spinner variant="primary" />
                <div className="p-3 bg-gray-800 rounded">
                  <Spinner variant="white" />
                </div>
                <Spinner variant="gray" />
              </div>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
        <Card.Footer>
          <PropsTable props={spinnerProps} />
        </Card.Footer>
      </Card>
      </div>
    </AuthenticatedLayout>
  );
}
