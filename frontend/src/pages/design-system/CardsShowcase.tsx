import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, Button, Badge } from '@/components/ui';
import { PageHeader, ShowcaseGrid, PropsTable } from './components';

const cardProps = [
  { name: 'variant', type: "'default' | 'bordered' | 'elevated' | 'highlight' | 'feature' | 'gradient'", default: "'bordered'", description: 'Card style variant' },
  { name: 'padding', type: "'none' | 'sm' | 'md' | 'lg'", default: "'none'", description: 'Card padding size' },
  { name: 'interactive', type: 'boolean', default: 'false', description: 'Adds hover effects for clickable cards' },
  { name: 'selected', type: 'boolean', default: 'false', description: 'Shows selected/active state' },
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
            Six card variants for different visual treatments
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

            <Card variant="highlight" padding="md">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Highlight
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Primary border for selected or featured items.
              </p>
            </Card>

            <Card variant="feature" padding="md">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Feature
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Subtle gradient background for feature cards.
              </p>
            </Card>

            <Card variant="gradient" padding="md">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Gradient
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Primary-tinted background for callouts or tips.
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
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
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

      {/* Interactive Cards */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Interactive Cards
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cards with hover effects and selection states for clickable elements
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            {/* Interactive Feature Card */}
            <Card variant="feature" interactive padding="md">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Feature Card
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click me to see the hover effect with lift animation.
              </p>
            </Card>

            {/* Selected Card */}
            <Card variant="bordered" interactive selected padding="md">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <svg className="w-6 h-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <Badge variant="primary" size="sm">Selected</Badge>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Selected Card
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Shows active selection with ring and border highlight.
              </p>
            </Card>

            {/* Interactive Highlight */}
            <Card variant="highlight" interactive padding="md">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Featured Item
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Highlighted card with primary border and hover effects.
              </p>
            </Card>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* Payment Integration Example */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Payment Integration Cards
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Example of card-based UI for payment provider integrations
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            <Card variant="feature" interactive className="cursor-pointer">
              <Card.Body>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <Badge variant="success">Connected</Badge>
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Stripe
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Accept credit cards and digital wallets globally.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Configure</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Card.Body>
            </Card>

            <Card variant="feature" interactive className="cursor-pointer">
              <Card.Body>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <Badge variant="warning">Disabled</Badge>
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  PayPal
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Accept PayPal and credit card payments.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Configure</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Card.Body>
            </Card>

            <Card variant="feature" interactive className="cursor-pointer">
              <Card.Body>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                    <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
                    </svg>
                  </div>
                  <Badge variant="default">Not Configured</Badge>
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Bank Transfer
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Accept manual bank transfers with tracking.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Configure</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Card.Body>
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
