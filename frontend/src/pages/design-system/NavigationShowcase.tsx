import { useState } from 'react';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import { Card } from '../../components/ui';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Breadcrumbs,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  Button,
  ProgressSteps,
} from '../../components/ui';
import { ComponentShowcase, PropsTable } from './components';

export function NavigationShowcase() {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('tab1');
  const [currentStep, setCurrentStep] = useState(1);

  const progressSteps = [
    { id: 1, label: 'Details', description: 'Enter booking information' },
    { id: 2, label: 'Payment', description: 'Add payment method' },
    { id: 3, label: 'Review', description: 'Confirm your booking' },
    { id: 4, label: 'Complete', description: 'Booking confirmed' },
  ];

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    { label: 'Beach House', href: '/properties/beach-house' },
    { label: 'Bookings' },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Navigation Components
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Components for navigating through the application - Tabs, Breadcrumbs, Pagination, and Dropdown menus.
          </p>
        </div>

        {/* Tabs Section */}
        <ComponentShowcase
          title="Tabs"
          description="Organize content into separate views that users can switch between."
        >
          <div className="space-y-8">
            {/* Default Variant */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Default Variant</h4>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="tab1">Account</TabsTrigger>
                  <TabsTrigger value="tab2">Security</TabsTrigger>
                  <TabsTrigger value="tab3">Notifications</TabsTrigger>
                  <TabsTrigger value="tab4" disabled>Disabled</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <Card className="p-4">
                    <p className="text-gray-600 dark:text-gray-400">Account settings content goes here.</p>
                  </Card>
                </TabsContent>
                <TabsContent value="tab2">
                  <Card className="p-4">
                    <p className="text-gray-600 dark:text-gray-400">Security settings content goes here.</p>
                  </Card>
                </TabsContent>
                <TabsContent value="tab3">
                  <Card className="p-4">
                    <p className="text-gray-600 dark:text-gray-400">Notification preferences content goes here.</p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Pills Variant */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Pills Variant</h4>
              <Tabs defaultValue="overview" variant="pills">
                <TabsList variant="pills">
                  <TabsTrigger value="overview" variant="pills">Overview</TabsTrigger>
                  <TabsTrigger value="analytics" variant="pills">Analytics</TabsTrigger>
                  <TabsTrigger value="reports" variant="pills">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <Card className="p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400">Overview content with pills styling.</p>
                  </Card>
                </TabsContent>
                <TabsContent value="analytics">
                  <Card className="p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400">Analytics content with pills styling.</p>
                  </Card>
                </TabsContent>
                <TabsContent value="reports">
                  <Card className="p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400">Reports content with pills styling.</p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Underline Variant */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Underline Variant</h4>
              <Tabs defaultValue="details" variant="underline">
                <TabsList variant="underline">
                  <TabsTrigger value="details" variant="underline">Details</TabsTrigger>
                  <TabsTrigger value="reviews" variant="underline">Reviews</TabsTrigger>
                  <TabsTrigger value="availability" variant="underline">Availability</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <Card className="p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400">Property details with underline styling.</p>
                  </Card>
                </TabsContent>
                <TabsContent value="reviews">
                  <Card className="p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400">Guest reviews with underline styling.</p>
                  </Card>
                </TabsContent>
                <TabsContent value="availability">
                  <Card className="p-4 mt-4">
                    <p className="text-gray-600 dark:text-gray-400">Availability calendar with underline styling.</p>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'defaultValue', type: 'string', description: 'Initial active tab value' },
            { name: 'value', type: 'string', description: 'Controlled active tab value' },
            { name: 'onValueChange', type: '(value: string) => void', description: 'Callback when tab changes' },
            { name: 'variant', type: "'default' | 'pills' | 'underline'", default: "'default'", description: 'Visual style variant' },
          ]}
        />

        {/* Breadcrumbs Section */}
        <ComponentShowcase
          title="Breadcrumbs"
          description="Show the user's current location within the application hierarchy."
        >
          <div className="space-y-6">
            {/* Basic */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Breadcrumbs</h4>
              <Breadcrumbs items={breadcrumbItems} />
            </div>

            {/* With Home Icon */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Home Icon</h4>
              <Breadcrumbs items={breadcrumbItems} showHomeIcon />
            </div>

            {/* Custom Separator */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Custom Separator</h4>
              <Breadcrumbs items={breadcrumbItems} separator="→" />
            </div>

            {/* Collapsed (maxItems) */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Collapsed (Max 3 Items)</h4>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Properties', href: '/properties' },
                  { label: 'Europe', href: '/properties/europe' },
                  { label: 'France', href: '/properties/europe/france' },
                  { label: 'Paris', href: '/properties/europe/france/paris' },
                  { label: 'Beach House' },
                ]}
                maxItems={3}
              />
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'items', type: 'BreadcrumbItem[]', required: true, description: 'Array of breadcrumb items with label and optional href' },
            { name: 'separator', type: 'ReactNode', default: "'/'", description: 'Custom separator element' },
            { name: 'showHomeIcon', type: 'boolean', default: 'false', description: 'Show home icon for first item' },
            { name: 'maxItems', type: 'number', description: 'Maximum items to show before collapsing' },
          ]}
        />

        {/* Pagination Section */}
        <ComponentShowcase
          title="Pagination"
          description="Navigate through paginated data sets."
        >
          <div className="space-y-6">
            {/* Basic */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Pagination</h4>
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* With First/Last Buttons */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With First/Last Buttons</h4>
              <Pagination
                currentPage={currentPage}
                totalPages={20}
                onPageChange={setCurrentPage}
                showFirstLast
              />
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Small</span>
                  <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} size="sm" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Medium (default)</span>
                  <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} size="md" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Large</span>
                  <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} size="lg" />
                </div>
              </div>
            </div>

            {/* Disabled */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled State</h4>
              <Pagination
                currentPage={3}
                totalPages={10}
                onPageChange={() => {}}
                disabled
              />
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'currentPage', type: 'number', required: true, description: 'Current active page' },
            { name: 'totalPages', type: 'number', required: true, description: 'Total number of pages' },
            { name: 'onPageChange', type: '(page: number) => void', required: true, description: 'Callback when page changes' },
            { name: 'siblingCount', type: 'number', default: '1', description: 'Number of siblings shown on each side' },
            { name: 'showFirstLast', type: 'boolean', default: 'false', description: 'Show first/last page buttons' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable all pagination controls' },
          ]}
        />

        {/* Dropdown Section */}
        <ComponentShowcase
          title="Dropdown"
          description="Display a menu of actions or options in a floating panel."
        >
          <div className="space-y-6">
            {/* Basic Dropdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Dropdown</h4>
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="outline">Open Menu</Button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem onClick={() => console.log('Profile')}>Profile</DropdownItem>
                  <DropdownItem onClick={() => console.log('Settings')}>Settings</DropdownItem>
                  <DropdownItem onClick={() => console.log('Help')}>Help</DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>

            {/* With Icons and Sections */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Icons and Sections</h4>
              <Dropdown>
                <DropdownTrigger>
                  <Button>Actions</Button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownLabel>Account</DropdownLabel>
                  <DropdownItem
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    onClick={() => {}}
                  >
                    Profile
                  </DropdownItem>
                  <DropdownItem
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    onClick={() => {}}
                  >
                    Settings
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownLabel>Danger Zone</DropdownLabel>
                  <DropdownItem
                    destructive
                    icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    onClick={() => {}}
                  >
                    Delete Account
                  </DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>

            {/* Alignment Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Alignment Options</h4>
              <div className="flex gap-4">
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="outline" size="sm">Align Start</Button>
                  </DropdownTrigger>
                  <DropdownContent align="start">
                    <DropdownItem onClick={() => {}}>Item 1</DropdownItem>
                    <DropdownItem onClick={() => {}}>Item 2</DropdownItem>
                  </DropdownContent>
                </Dropdown>

                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="outline" size="sm">Align Center</Button>
                  </DropdownTrigger>
                  <DropdownContent align="center">
                    <DropdownItem onClick={() => {}}>Item 1</DropdownItem>
                    <DropdownItem onClick={() => {}}>Item 2</DropdownItem>
                  </DropdownContent>
                </Dropdown>

                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="outline" size="sm">Align End</Button>
                  </DropdownTrigger>
                  <DropdownContent align="end">
                    <DropdownItem onClick={() => {}}>Item 1</DropdownItem>
                    <DropdownItem onClick={() => {}}>Item 2</DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </div>
            </div>

            {/* Disabled Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Disabled Items</h4>
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="secondary">Options</Button>
                </DropdownTrigger>
                <DropdownContent>
                  <DropdownItem onClick={() => {}}>Available</DropdownItem>
                  <DropdownItem disabled>Not Available</DropdownItem>
                  <DropdownItem onClick={() => {}}>Also Available</DropdownItem>
                </DropdownContent>
              </Dropdown>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'children', type: 'ReactNode', required: true, description: 'Dropdown trigger and content' },
            { name: 'align', type: "'start' | 'center' | 'end'", default: "'start'", description: 'Horizontal alignment of dropdown content' },
            { name: 'side', type: "'top' | 'bottom'", default: "'bottom'", description: 'Side to show dropdown' },
            { name: 'sideOffset', type: 'number', default: '4', description: 'Offset from trigger element' },
          ]}
        />

        {/* Progress Steps Section */}
        <ComponentShowcase
          title="Progress Steps"
          description="Guide users through multi-step processes like checkout flows, onboarding wizards, or form sequences."
        >
          <div className="space-y-8 w-full">
            {/* Interactive Demo */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Interactive Demo (Click steps or use buttons)</h4>
              <div className="space-y-4">
                <ProgressSteps
                  steps={progressSteps}
                  currentStep={currentStep}
                  clickable
                  onStepClick={(index) => setCurrentStep(index)}
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep(Math.min(progressSteps.length - 1, currentStep + 1))}
                    disabled={currentStep === progressSteps.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Variants</h4>
              <div className="space-y-6">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Numbers (default)</span>
                  <ProgressSteps steps={progressSteps} currentStep={1} variant="numbers" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Dots</span>
                  <ProgressSteps steps={progressSteps} currentStep={1} variant="dots" />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Icons (with custom icons)</span>
                  <ProgressSteps
                    steps={[
                      { id: 1, label: 'Cart', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                      { id: 2, label: 'Shipping', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                      { id: 3, label: 'Payment', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
                      { id: 4, label: 'Done', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
                    ]}
                    currentStep={2}
                    variant="icons"
                  />
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="space-y-6">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Small</span>
                  <ProgressSteps steps={progressSteps} currentStep={1} size="sm" showDescriptions={false} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Medium (default)</span>
                  <ProgressSteps steps={progressSteps} currentStep={1} size="md" showDescriptions={false} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Large</span>
                  <ProgressSteps steps={progressSteps} currentStep={1} size="lg" showDescriptions={false} />
                </div>
              </div>
            </div>

            {/* Vertical Orientation */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Vertical Orientation</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Numbers</span>
                  <ProgressSteps
                    steps={progressSteps}
                    currentStep={1}
                    orientation="vertical"
                    variant="numbers"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Dots</span>
                  <ProgressSteps
                    steps={progressSteps}
                    currentStep={2}
                    orientation="vertical"
                    variant="dots"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Clickable</span>
                  <ProgressSteps
                    steps={progressSteps}
                    currentStep={1}
                    orientation="vertical"
                    clickable
                    onStepClick={(index) => console.log('Clicked step:', index)}
                  />
                </div>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Step States</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">All Upcoming (Step 0)</span>
                  <ProgressSteps steps={progressSteps} currentStep={0} showDescriptions={false} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">Mixed States (Step 2)</span>
                  <ProgressSteps steps={progressSteps} currentStep={2} showDescriptions={false} />
                </div>
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">All Completed (Step 4)</span>
                  <ProgressSteps steps={progressSteps} currentStep={4} showDescriptions={false} />
                </div>
              </div>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'steps', type: 'ProgressStep[]', required: true, description: 'Array of step objects with id, label, and optional description/icon' },
            { name: 'currentStep', type: 'number', required: true, description: 'Current active step index (0-based)' },
            { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout orientation' },
            { name: 'variant', type: "'dots' | 'numbers' | 'icons'", default: "'numbers'", description: 'Visual style of step indicators' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size of step indicators' },
            { name: 'clickable', type: 'boolean', default: 'false', description: 'Whether steps are clickable for navigation' },
            { name: 'onStepClick', type: '(index: number, step: ProgressStep) => void', description: 'Callback when a step is clicked' },
            { name: 'showDescriptions', type: 'boolean', default: 'true', description: 'Whether to show step descriptions' },
          ]}
        />
      </div>
    </AuthenticatedLayout>
  );
}
