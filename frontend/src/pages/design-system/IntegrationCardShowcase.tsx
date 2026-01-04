import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, Button, IntegrationCard, Input } from '@/components/ui';
import { PageHeader, PropsTable } from './components';

// Example logos for showcase
const StripeIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#635BFF" />
    <path
      d="M18.5 16.5c0-.83.67-1.5 1.5-1.5h.5c2.49 0 4.5 2.01 4.5 4.5S23 24 20.5 24h-.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5H20c-.83 0-1.5-.67-1.5-1.5z"
      fill="#fff"
    />
  </svg>
);

const SlackIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#4A154B" />
    <path d="M16 22a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm1 0a2 2 0 0 1 2-2h5a2 2 0 1 1 0 4h-5a2 2 0 0 1-2-2z" fill="#E01E5A" />
    <path d="M22 16a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a2 2 0 0 1 2 2v5a2 2 0 1 1-4 0v-5a2 2 0 0 1 2-2z" fill="#36C5F0" />
    <path d="M28 22a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-1 0a2 2 0 0 1-2 2h-5a2 2 0 1 1 0-4h5a2 2 0 0 1 2 2z" fill="#2EB67D" />
    <path d="M22 28a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm0-1a2 2 0 0 1-2-2v-5a2 2 0 1 1 4 0v5a2 2 0 0 1-2 2z" fill="#ECB22E" />
  </svg>
);

const WebhookIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="8" fill="#374151" />
    <path
      d="M20 12a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"
      fill="#9CA3AF"
    />
    <circle cx="20" cy="20" r="3" fill="#9CA3AF" />
  </svg>
);

const integrationCardProps = [
  { name: 'id', type: 'string', required: true, description: 'Unique identifier for the integration' },
  { name: 'name', type: 'string', required: true, description: 'Display name of the integration' },
  { name: 'description', type: 'string', required: true, description: 'Brief description of the integration' },
  { name: 'logo', type: 'ReactNode', required: true, description: 'Logo or icon to display' },
  { name: 'status', type: "'connected' | 'disconnected' | 'error'", required: true, description: 'Connection status of the integration' },
  { name: 'isPrimary', type: 'boolean', default: 'false', description: 'Whether this is the primary/default integration' },
  { name: 'isExpanded', type: 'boolean', description: 'Controlled expanded state' },
  { name: 'defaultExpanded', type: 'boolean', default: 'false', description: 'Default expanded state for uncontrolled usage' },
  { name: 'onToggle', type: '(expanded: boolean) => void', description: 'Callback when card is toggled' },
  { name: 'children', type: 'ReactNode', description: 'Content to show when expanded' },
  { name: 'className', type: 'string', description: 'Additional CSS classes' },
];

export function IntegrationCardShowcase() {
  // State for controlled example
  const [controlledExpanded, setControlledExpanded] = useState<string | null>(null);

  const handleToggle = (id: string, expanded: boolean) => {
    setControlledExpanded(expanded ? id : null);
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Integration Card"
          description="Expandable cards for displaying integration configurations. Click the card header to expand/collapse and reveal configuration options."
        />

        {/* Basic Usage */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Basic Usage
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Click the card to expand and reveal configuration content
            </p>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <IntegrationCard
                id="stripe"
                name="Stripe"
                description="Accept payments via credit cards and bank transfers"
                logo={<StripeIcon />}
                status="connected"
              >
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="sk_live_..."
                      defaultValue="sk_live_xxxxxxxxxxxx"
                      fullWidth
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">Test Connection</Button>
                    <Button size="sm">Save</Button>
                  </div>
                </div>
              </IntegrationCard>
            </div>
          </Card.Body>
        </Card>

        {/* Status Variations */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Status Variations
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Different status badges indicate the integration state
            </p>
          </Card.Header>
          <Card.Body>
            <div className="space-y-4">
              <IntegrationCard
                id="status-connected"
                name="Connected Integration"
                description="This integration is active and working"
                logo={<StripeIcon />}
                status="connected"
                isPrimary
              >
                <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  Connected integrations are shown with a green status badge.
                  The "Primary" badge indicates this is the default payment method.
                </div>
              </IntegrationCard>

              <IntegrationCard
                id="status-disconnected"
                name="Disconnected Integration"
                description="This integration needs to be configured"
                logo={<SlackIcon />}
                status="disconnected"
              >
                <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  Disconnected integrations have a gray status badge and need configuration.
                </div>
              </IntegrationCard>

              <IntegrationCard
                id="status-error"
                name="Error Integration"
                description="This integration has a connection issue"
                logo={<WebhookIcon />}
                status="error"
              >
                <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                  Error state integrations have a red status badge indicating a problem.
                </div>
              </IntegrationCard>
            </div>
          </Card.Body>
        </Card>

        {/* Controlled vs Uncontrolled */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Controlled vs Uncontrolled
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Cards can be controlled (accordion-style) or uncontrolled (independent)
            </p>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controlled Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Controlled (Accordion)
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Only one card can be expanded at a time
                </p>
                <div className="space-y-3">
                  <IntegrationCard
                    id="controlled-1"
                    name="Stripe"
                    description="Payment processing"
                    logo={<StripeIcon />}
                    status="connected"
                    isExpanded={controlledExpanded === 'controlled-1'}
                    onToggle={(expanded) => handleToggle('controlled-1', expanded)}
                  >
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      Stripe configuration options would go here.
                    </div>
                  </IntegrationCard>

                  <IntegrationCard
                    id="controlled-2"
                    name="Slack"
                    description="Team notifications"
                    logo={<SlackIcon />}
                    status="disconnected"
                    isExpanded={controlledExpanded === 'controlled-2'}
                    onToggle={(expanded) => handleToggle('controlled-2', expanded)}
                  >
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      Slack configuration options would go here.
                    </div>
                  </IntegrationCard>

                  <IntegrationCard
                    id="controlled-3"
                    name="Webhook"
                    description="Custom webhooks"
                    logo={<WebhookIcon />}
                    status="connected"
                    isExpanded={controlledExpanded === 'controlled-3'}
                    onToggle={(expanded) => handleToggle('controlled-3', expanded)}
                  >
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      Webhook configuration options would go here.
                    </div>
                  </IntegrationCard>
                </div>
              </div>

              {/* Uncontrolled Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Uncontrolled (Independent)
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Multiple cards can be expanded simultaneously
                </p>
                <div className="space-y-3">
                  <IntegrationCard
                    id="uncontrolled-1"
                    name="Stripe"
                    description="Payment processing"
                    logo={<StripeIcon />}
                    status="connected"
                    defaultExpanded
                  >
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      This card starts expanded (defaultExpanded=true).
                    </div>
                  </IntegrationCard>

                  <IntegrationCard
                    id="uncontrolled-2"
                    name="Slack"
                    description="Team notifications"
                    logo={<SlackIcon />}
                    status="disconnected"
                  >
                    <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      This card manages its own state independently.
                    </div>
                  </IntegrationCard>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* With Form Content */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              With Form Content
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Example of a card with a complete configuration form
            </p>
          </Card.Header>
          <Card.Body>
            <IntegrationCard
              id="form-example"
              name="Slack Notifications"
              description="Send booking notifications to your Slack workspace"
              logo={<SlackIcon />}
              status="disconnected"
              defaultExpanded
            >
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Webhook URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    fullWidth
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Create a webhook in your Slack workspace settings
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Channel Name
                  </label>
                  <Input
                    type="text"
                    placeholder="#bookings"
                    fullWidth
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Send new booking alerts
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Send cancellation alerts
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-dark-border">
                  <Button variant="outline" size="sm">Test Connection</Button>
                  <Button size="sm">Save Configuration</Button>
                </div>
              </div>
            </IntegrationCard>
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
            <PropsTable props={integrationCardProps} />
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
