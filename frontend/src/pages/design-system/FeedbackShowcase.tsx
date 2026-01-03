import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import { Card, Button } from '../../components/ui';
import {
  Progress,
  CircularProgress,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  Tooltip,
} from '../../components/ui';
import { ComponentShowcase, PropsTable } from './components';

export function FeedbackShowcase() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Feedback Components
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Components for providing visual feedback - Progress indicators, Loading skeletons, and Tooltips.
          </p>
        </div>

        {/* Progress Section */}
        <ComponentShowcase
          title="Progress"
          description="Visualize the completion status of a task or process."
        >
          <div className="space-y-8">
            {/* Basic Progress */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Progress Bar</h4>
              <div className="space-y-4">
                <Progress value={25} />
                <Progress value={50} />
                <Progress value={75} />
                <Progress value={100} />
              </div>
            </div>

            {/* With Label */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Label</h4>
              <div className="space-y-4">
                <Progress value={65} showValue />
                <Progress value={40} label="Upload Progress" showValue />
              </div>
            </div>

            {/* Variants */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Color Variants</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Default</span>
                  <Progress value={70} variant="default" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Success</span>
                  <Progress value={100} variant="success" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Warning</span>
                  <Progress value={50} variant="warning" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Error</span>
                  <Progress value={25} variant="error" />
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Small</span>
                  <Progress value={60} size="sm" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Medium (default)</span>
                  <Progress value={60} size="md" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Large</span>
                  <Progress value={60} size="lg" />
                </div>
              </div>
            </div>

            {/* Indeterminate */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Indeterminate (Loading)</h4>
              <Progress indeterminate />
            </div>

            {/* Circular Progress */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Circular Progress</h4>
              <div className="flex items-center gap-8">
                <CircularProgress value={25} size="sm" />
                <CircularProgress value={50} size="md" />
                <CircularProgress value={75} size="lg" showValue />
                <CircularProgress value={100} size="lg" variant="success" showValue />
              </div>
            </div>

            {/* Circular Variants */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Circular Variants</h4>
              <div className="flex items-center gap-8">
                <CircularProgress value={60} variant="default" showValue />
                <CircularProgress value={100} variant="success" showValue />
                <CircularProgress value={45} variant="warning" showValue />
                <CircularProgress value={20} variant="error" showValue />
              </div>
            </div>

            {/* Circular Indeterminate */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Circular Indeterminate</h4>
              <div className="flex items-center gap-8">
                <CircularProgress indeterminate size="sm" />
                <CircularProgress indeterminate size="md" />
                <CircularProgress indeterminate size="lg" />
              </div>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'value', type: 'number', default: '0', description: 'Current progress value (0-100)' },
            { name: 'max', type: 'number', default: '100', description: 'Maximum value' },
            { name: 'variant', type: "'default' | 'success' | 'warning' | 'error'", default: "'default'", description: 'Color variant' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size of the progress bar' },
            { name: 'showValue', type: 'boolean', default: 'false', description: 'Show percentage label' },
            { name: 'label', type: 'string', description: 'Custom label text' },
            { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Show loading animation' },
          ]}
        />

        {/* Skeleton Section */}
        <ComponentShowcase
          title="Skeleton"
          description="Display placeholder loading states while content is being fetched."
        >
          <div className="space-y-8">
            {/* Basic Skeleton */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Skeleton</h4>
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            {/* Shapes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Shapes</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Skeleton variant="circular" className="w-12 h-12" />
                  <span className="text-xs text-gray-500 mt-2 block">Circular</span>
                </div>
                <div className="text-center">
                  <Skeleton variant="rectangular" className="w-24 h-12" />
                  <span className="text-xs text-gray-500 mt-2 block">Rectangular</span>
                </div>
                <div className="text-center">
                  <Skeleton variant="rounded" className="w-24 h-12" />
                  <span className="text-xs text-gray-500 mt-2 block">Rounded</span>
                </div>
              </div>
            </div>

            {/* Text Skeleton */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Text Skeleton</h4>
              <Card className="p-4">
                <SkeletonText lines={4} />
              </Card>
            </div>

            {/* Card Skeleton */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Card Skeleton</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard showImage={false} />
                <SkeletonCard lines={2} />
              </div>
            </div>

            {/* Table Skeleton */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Table Skeleton</h4>
              <SkeletonTable rows={4} columns={4} />
            </div>

            {/* Animation Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Animation Types</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-2">Pulse (default)</p>
                  <Skeleton animation="pulse" className="h-8 w-full" />
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-2">Wave</p>
                  <Skeleton animation="wave" className="h-8 w-full" />
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-gray-500 mb-2">None</p>
                  <Skeleton animation="none" className="h-8 w-full" />
                </Card>
              </div>
            </div>

            {/* Real World Example */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Property Card Loading State</h4>
              <Card className="overflow-hidden max-w-sm">
                <Skeleton variant="rectangular" className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" className="w-6 h-6" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton variant="rounded" className="h-8 w-24" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'variant', type: "'text' | 'rectangular' | 'circular' | 'rounded'", default: "'text'", description: 'Shape variant' },
            { name: 'animation', type: "'pulse' | 'wave' | 'none'", default: "'pulse'", description: 'Animation style' },
            { name: 'width', type: 'string | number', description: 'Width of skeleton' },
            { name: 'height', type: 'string | number', description: 'Height of skeleton' },
            { name: 'className', type: 'string', description: 'Additional CSS classes' },
          ]}
        />

        {/* Tooltip Section */}
        <ComponentShowcase
          title="Tooltip"
          description="Display informative text when users hover over or focus on an element."
        >
          <div className="space-y-8">
            {/* Basic Tooltip */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Tooltip</h4>
              <div className="flex gap-4">
                <Tooltip content="This is a tooltip">
                  <Button variant="outline">Hover me</Button>
                </Tooltip>
              </div>
            </div>

            {/* Positions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Positions</h4>
              <div className="flex flex-wrap gap-4 justify-center py-8">
                <Tooltip content="Tooltip on top" position="top">
                  <Button variant="outline" size="sm">Top</Button>
                </Tooltip>
                <Tooltip content="Tooltip on right" position="right">
                  <Button variant="outline" size="sm">Right</Button>
                </Tooltip>
                <Tooltip content="Tooltip on bottom" position="bottom">
                  <Button variant="outline" size="sm">Bottom</Button>
                </Tooltip>
                <Tooltip content="Tooltip on left" position="left">
                  <Button variant="outline" size="sm">Left</Button>
                </Tooltip>
              </div>
            </div>

            {/* With Delay */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Custom Delay</h4>
              <div className="flex gap-4">
                <Tooltip content="Instant (0ms)" delay={0}>
                  <Button variant="outline" size="sm">No Delay</Button>
                </Tooltip>
                <Tooltip content="Short delay (200ms)" delay={200}>
                  <Button variant="outline" size="sm">200ms</Button>
                </Tooltip>
                <Tooltip content="Long delay (500ms)" delay={500}>
                  <Button variant="outline" size="sm">500ms</Button>
                </Tooltip>
              </div>
            </div>

            {/* On Different Elements */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">On Different Elements</h4>
              <div className="flex items-center gap-6">
                <Tooltip content="Icon tooltip">
                  <span className="p-2 rounded-lg bg-gray-100 dark:bg-dark-card cursor-pointer">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </Tooltip>
                <Tooltip content="Text tooltip">
                  <span className="text-primary underline cursor-pointer">Hover this text</span>
                </Tooltip>
                <Tooltip content="Badge tooltip">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full cursor-pointer">
                    New Feature
                  </span>
                </Tooltip>
              </div>
            </div>

            {/* Long Content */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Long Content</h4>
              <Tooltip content="This is a longer tooltip message that provides more detailed information about the element. It automatically wraps to multiple lines when needed.">
                <Button variant="outline">Hover for detailed info</Button>
              </Tooltip>
            </div>

            {/* Disabled Tooltip */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled State</h4>
              <div className="flex gap-4">
                <Tooltip content="This tooltip is disabled" disabled>
                  <Button variant="outline" size="sm">Tooltip Disabled</Button>
                </Tooltip>
                <Tooltip content="This tooltip works">
                  <Button variant="outline" size="sm">Tooltip Enabled</Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'content', type: 'ReactNode', required: true, description: 'Tooltip content to display' },
            { name: 'children', type: 'ReactNode', required: true, description: 'Element that triggers the tooltip' },
            { name: 'position', type: "'top' | 'right' | 'bottom' | 'left'", default: "'top'", description: 'Position relative to trigger' },
            { name: 'delay', type: 'number', default: '200', description: 'Delay before showing (ms)' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the tooltip' },
          ]}
        />
      </div>
    </AuthenticatedLayout>
  );
}
