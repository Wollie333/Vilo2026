import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Button, Card } from '@/components/ui';
import { PageHeader, ComponentShowcase, ShowcaseSection, ShowcaseGrid, PropsTable } from './components';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const buttonProps = [
  { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost'", default: "'primary'", description: 'Button style variant' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size' },
  { name: 'isLoading', type: 'boolean', default: 'false', description: 'Show loading spinner' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable button' },
  { name: 'leftIcon', type: 'ReactNode', description: 'Icon on the left side' },
  { name: 'rightIcon', type: 'ReactNode', description: 'Icon on the right side' },
  { name: 'children', type: 'ReactNode', required: true, description: 'Button content' },
];

export function ButtonsShowcase() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Buttons"
          description="Buttons are used to trigger actions. They come in different variants and sizes to suit various use cases."
        />

      <ShowcaseGrid cols={2}>
        {/* Variants */}
        <ComponentShowcase
          title="Variants"
          description="Four distinct button styles for different levels of emphasis"
        >
          <ShowcaseSection title="Primary">
            <Button variant="primary">Primary</Button>
          </ShowcaseSection>
          <ShowcaseSection title="Secondary">
            <Button variant="secondary">Secondary</Button>
          </ShowcaseSection>
          <ShowcaseSection title="Outline">
            <Button variant="outline">Outline</Button>
          </ShowcaseSection>
          <ShowcaseSection title="Ghost">
            <Button variant="ghost">Ghost</Button>
          </ShowcaseSection>
        </ComponentShowcase>

        {/* Sizes */}
        <ComponentShowcase
          title="Sizes"
          description="Three size options to fit different contexts"
        >
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </ComponentShowcase>

        {/* With Icons */}
        <ComponentShowcase
          title="With Icons"
          description="Buttons can include icons on either side"
        >
          <Button leftIcon={<PlusIcon />}>Left Icon</Button>
          <Button rightIcon={<ArrowRightIcon />}>Right Icon</Button>
          <Button leftIcon={<PlusIcon />} rightIcon={<ArrowRightIcon />}>
            Both Icons
          </Button>
        </ComponentShowcase>

        {/* States */}
        <ComponentShowcase
          title="States"
          description="Loading and disabled states"
        >
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>Outline Disabled</Button>
        </ComponentShowcase>
      </ShowcaseGrid>

      {/* All Variants at All Sizes */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Size Comparison
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Variant</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Small</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Medium</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300">Large</th>
                </tr>
              </thead>
              <tbody>
                {(['primary', 'secondary', 'outline', 'ghost'] as const).map((variant) => (
                  <tr key={variant} className="border-b border-gray-100 dark:border-dark-border last:border-0">
                    <td className="py-3 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {variant}
                    </td>
                    <td className="py-3 px-3">
                      <Button variant={variant} size="sm">{variant}</Button>
                    </td>
                    <td className="py-3 px-3">
                      <Button variant={variant} size="md">{variant}</Button>
                    </td>
                    <td className="py-3 px-3">
                      <Button variant={variant} size="lg">{variant}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <PropsTable props={buttonProps} />
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
