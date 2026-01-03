import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, Button, Badge } from '@/components/ui';
import { PageHeader, ShowcaseGrid, PropsTable } from './components';

const cardProps = [
  { name: 'variant', type: "'default' | 'bordered' | 'elevated'", default: "'bordered'", description: 'Card style variant' },
  { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'none'", description: 'Card padding size' },
  { name: 'children', type: 'ReactNode', required: true, description: 'Card content' },
  { name: 'className', type: 'string', description: 'Additional CSS classes' },
];

export function CardsShowcase() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Cards"
          description="Cards are containers that group related content and actions. They support headers, bodies, and footers."
        />

      {/* Variants */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Variants
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Three card variants for different visual treatments
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            <Card variant="default" padding="md">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Default
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Simple card with background color only, no border or shadow.
              </p>
            </Card>

            <Card variant="bordered" padding="md">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Bordered
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Card with a subtle border, most commonly used variant.
              </p>
            </Card>

            <Card variant="elevated" padding="md">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Elevated
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Card with shadow for emphasis and depth.
              </p>
            </Card>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* Padding Sizes */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Padding Sizes
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Control internal spacing with padding options
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={4}>
            <Card variant="bordered" padding="none">
              <div className="bg-primary/10 p-3">
                <p className="text-xs text-primary font-medium">padding="none"</p>
              </div>
            </Card>

            <Card variant="bordered" padding="sm">
              <p className="text-xs text-gray-600 dark:text-gray-400">padding="sm"</p>
            </Card>

            <Card variant="bordered" padding="md">
              <p className="text-xs text-gray-600 dark:text-gray-400">padding="md"</p>
            </Card>

            <Card variant="bordered" padding="lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">padding="lg"</p>
            </Card>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* With Header, Body, Footer */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Compound Components
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Use Card.Header, Card.Body, and Card.Footer for structured layouts
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            {/* Basic Structure */}
            <Card variant="bordered">
              <Card.Header>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Card Header
                </h4>
              </Card.Header>
              <Card.Body>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This is the card body content. It contains the main information
                  and can include any type of content.
                </p>
              </Card.Body>
              <Card.Footer>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Save</Button>
                </div>
              </Card.Footer>
            </Card>

            {/* Example: User Card */}
            <Card variant="bordered">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    User Profile
                  </h4>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-brand-black font-bold">
                    JD
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      John Doe
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      john@example.com
                    </p>
                  </div>
                </div>
              </Card.Body>
              <Card.Footer>
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </Card.Footer>
            </Card>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* Example Use Cases */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Example Use Cases
          </h3>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            {/* Stat Card */}
            <Card variant="bordered" padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total Revenue
                </span>
                <Badge variant="success" size="sm">+12%</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                $45,231
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs last month
              </p>
            </Card>

            {/* Notification Card */}
            <Card variant="elevated" padding="md">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    New message
                  </p>
                  <p className="text-2xs text-gray-500 dark:text-gray-400 mt-0.5">
                    You have a new booking request from Jane
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Card */}
            <Card variant="bordered" padding="md">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Add New Property
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  List a new vacation rental
                </p>
                <Button size="sm">Get Started</Button>
              </div>
            </Card>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

        {/* Props Table */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={cardProps} />
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
