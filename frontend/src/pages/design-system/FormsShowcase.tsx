import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Input, Card, PhoneInput, MaskedInput, FilterCard, Select, Button } from '@/components/ui';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { PageHeader, ComponentShowcase, ShowcaseGrid, PropsTable } from './components';

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const inputProps = [
  { name: 'label', type: 'string', description: 'Input label' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size' },
  { name: 'error', type: 'string', description: 'Error message' },
  { name: 'helperText', type: 'string', description: 'Helper text below input' },
  { name: 'leftIcon', type: 'ReactNode', description: 'Icon on the left side' },
  { name: 'rightIcon', type: 'ReactNode', description: 'Icon on the right side' },
  { name: 'isLoading', type: 'boolean', default: 'false', description: 'Show loading spinner' },
  { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Take full width' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable input' },
];

const phoneInputProps = [
  { name: 'label', type: 'string', description: 'Input label' },
  { name: 'value', type: 'string', description: 'Phone number digits (without country code)' },
  { name: 'onChange', type: '(value: string) => void', description: 'Callback when value changes' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size' },
  { name: 'error', type: 'string', description: 'Error message' },
  { name: 'helperText', type: 'string', description: 'Helper text below input' },
  { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Take full width' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable input' },
];

const maskedInputProps = [
  { name: 'label', type: 'string', description: 'Input label' },
  { name: 'mask', type: "'vat' | 'company_registration'", description: 'Mask type to apply' },
  { name: 'value', type: 'string', description: 'Raw value (digits only)' },
  { name: 'onChange', type: '(value: string) => void', description: 'Callback when value changes' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Input size' },
  { name: 'error', type: 'string', description: 'Error message' },
  { name: 'helperText', type: 'string', description: 'Helper text below input' },
  { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Take full width' },
  { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable input' },
  { name: 'leftIcon', type: 'ReactNode', description: 'Icon on the left side' },
];

const filterCardProps = [
  { name: 'children', type: 'ReactNode', required: true, description: 'Filter fields and controls' },
  { name: 'className', type: 'string', description: 'Additional CSS classes' },
  { name: 'layout', type: "'inline' | 'stacked'", description: 'Layout direction (default: responsive)' },
];

const filterCardSearchProps = [
  { name: 'value', type: 'string', required: true, description: 'Current search value' },
  { name: 'onChange', type: '(value: string) => void', required: true, description: 'Change handler - called after debounce' },
  { name: 'placeholder', type: 'string', default: "'Search...'", description: 'Placeholder text' },
  { name: 'debounceMs', type: 'number', default: '300', description: 'Debounce delay in milliseconds' },
  { name: 'className', type: 'string', description: 'Additional CSS classes' },
];

const filterCardFieldProps = [
  { name: 'children', type: 'ReactNode', required: true, description: 'Filter control (usually a Select)' },
  { name: 'label', type: 'string', description: 'Optional label above the field' },
  { name: 'className', type: 'string', description: 'Additional CSS classes' },
];

const filterCardActionsProps = [
  { name: 'children', type: 'ReactNode', required: true, description: 'Action buttons (Reset, etc.)' },
  { name: 'className', type: 'string', description: 'Additional CSS classes' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' },
];

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'devops', label: 'DevOps' },
];

const multiSelectOptions = [
  { value: 'react', label: 'React', group: 'Frontend' },
  { value: 'vue', label: 'Vue', group: 'Frontend' },
  { value: 'angular', label: 'Angular', group: 'Frontend' },
  { value: 'node', label: 'Node.js', group: 'Backend' },
  { value: 'python', label: 'Python', group: 'Backend' },
  { value: 'go', label: 'Go', group: 'Backend' },
];

export function FormsShowcase() {
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>(['react']);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });
  const [phoneValue, setPhoneValue] = useState('');
  const [vatValue, setVatValue] = useState('');
  const [companyRegValue, setCompanyRegValue] = useState('');

  // FilterCard demo state
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSearch2, setFilterSearch2] = useState('');
  const [filterStatus2, setFilterStatus2] = useState('');

  const handleResetFilters = () => {
    setFilterSearch('');
    setFilterStatus('');
    setFilterCategory('');
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Forms"
          description="Form components including inputs, multi-selects, and date pickers for collecting user data."
        />

      {/* Input Component */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Input
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Text input field with various configurations
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            {/* Sizes */}
            <ComponentShowcase title="Sizes" description="Small, medium, and large inputs">
              <div className="w-full space-y-3">
                <Input size="sm" placeholder="Small input" />
                <Input size="md" placeholder="Medium input" />
                <Input size="lg" placeholder="Large input" />
              </div>
            </ComponentShowcase>

            {/* With Labels */}
            <ComponentShowcase title="With Labels" description="Input with label and helper text">
              <div className="w-full space-y-3">
                <Input
                  label="Email Address"
                  placeholder="you@example.com"
                  helperText="We'll never share your email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                />
              </div>
            </ComponentShowcase>

            {/* With Icons */}
            <ComponentShowcase title="With Icons" description="Input with left or right icons">
              <div className="w-full space-y-3">
                <Input
                  leftIcon={<SearchIcon />}
                  placeholder="Search..."
                />
                <Input
                  leftIcon={<MailIcon />}
                  placeholder="Email address"
                />
              </div>
            </ComponentShowcase>

            {/* States */}
            <ComponentShowcase title="States" description="Error, loading, and disabled states">
              <div className="w-full space-y-3">
                <Input
                  label="With Error"
                  placeholder="Invalid input"
                  error="This field is required"
                />
                <Input
                  label="Loading"
                  placeholder="Loading..."
                  isLoading
                />
                <Input
                  label="Disabled"
                  placeholder="Disabled input"
                  disabled
                />
              </div>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* PhoneInput Component */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            PhoneInput
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            South African phone number input with country flag and +27 prefix
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            <ComponentShowcase title="Basic Usage" description="Phone input with SA flag">
              <div className="w-full">
                <PhoneInput
                  label="Phone Number"
                  value={phoneValue}
                  onChange={setPhoneValue}
                  fullWidth
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Helper Text" description="Additional guidance for users">
              <div className="w-full">
                <PhoneInput
                  label="Mobile Number"
                  value={phoneValue}
                  onChange={setPhoneValue}
                  helperText="Enter your 9-digit mobile number"
                  fullWidth
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Error" description="Validation error state">
              <div className="w-full">
                <PhoneInput
                  label="Phone Number"
                  value=""
                  onChange={() => {}}
                  error="Phone number is required"
                  fullWidth
                />
              </div>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* MaskedInput Component */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            MaskedInput
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Input with automatic formatting masks for South African business numbers
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="VAT Number" description="10-digit South African VAT format">
              <div className="w-full">
                <MaskedInput
                  label="VAT Number"
                  mask="vat"
                  value={vatValue}
                  onChange={setVatValue}
                  helperText="10 digits starting with 4"
                  fullWidth
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Company Registration" description="YYYY/NNNNNN/NN format">
              <div className="w-full">
                <MaskedInput
                  label="Company Registration"
                  mask="company_registration"
                  value={companyRegValue}
                  onChange={setCompanyRegValue}
                  helperText="Format: YYYY/NNNNNN/NN"
                  fullWidth
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Error" description="Validation error state">
              <div className="w-full">
                <MaskedInput
                  label="VAT Number"
                  mask="vat"
                  value=""
                  onChange={() => {}}
                  error="Invalid VAT number"
                  fullWidth
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="Disabled State" description="Non-editable masked input">
              <div className="w-full">
                <MaskedInput
                  label="Company Registration"
                  mask="company_registration"
                  value="202012345607"
                  onChange={() => {}}
                  disabled
                  fullWidth
                />
              </div>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* MultiSelect Component */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            MultiSelect
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Select multiple options from a dropdown with search functionality
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="Basic Usage" description="Simple multi-select dropdown">
              <div className="w-full">
                <MultiSelect
                  label="Select Technologies"
                  options={multiSelectOptions}
                  value={multiSelectValue}
                  onChange={setMultiSelectValue}
                  placeholder="Choose technologies..."
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Grouping" description="Options grouped by category">
              <div className="w-full">
                <MultiSelect
                  label="Grouped Options"
                  options={multiSelectOptions}
                  value={multiSelectValue}
                  onChange={setMultiSelectValue}
                  groupBy
                  placeholder="Select from groups..."
                />
              </div>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* DateRangePicker Component */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            DateRangePicker
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Select a date range with start and end dates
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="Basic Usage" description="Date range selection">
              <div className="w-full">
                <DateRangePicker
                  label="Select Date Range"
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            </ComponentShowcase>

            <ComponentShowcase title="With Constraints" description="Min/max date constraints">
              <div className="w-full">
                <DateRangePicker
                  label="Booking Period"
                  value={dateRange}
                  onChange={setDateRange}
                  minDate={new Date().toISOString().split('T')[0]}
                  helperText="Select dates from today onwards"
                />
              </div>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* FilterCard Component */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            FilterCard
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            A compound component for filter controls with search, dropdowns, and actions
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-6">
            {/* Basic Filter */}
            <ComponentShowcase title="Basic Filter" description="Search with dropdowns and reset button">
              <div className="w-full">
                <FilterCard>
                  <FilterCard.Search
                    value={filterSearch}
                    onChange={setFilterSearch}
                    placeholder="Search by name or email..."
                  />
                  <FilterCard.Field>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      options={statusOptions}
                    />
                  </FilterCard.Field>
                  <FilterCard.Field>
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      options={categoryOptions}
                    />
                  </FilterCard.Field>
                  <FilterCard.Actions>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                    >
                      Reset
                    </Button>
                  </FilterCard.Actions>
                </FilterCard>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Current filters: search="{filterSearch}", status="{filterStatus}", category="{filterCategory}"
                </p>
              </div>
            </ComponentShowcase>

            {/* With Labels */}
            <ComponentShowcase title="With Field Labels" description="Labels above each filter field">
              <div className="w-full">
                <FilterCard>
                  <FilterCard.Search
                    value={filterSearch2}
                    onChange={setFilterSearch2}
                    placeholder="Search..."
                  />
                  <FilterCard.Field label="Status">
                    <Select
                      value={filterStatus2}
                      onChange={(e) => setFilterStatus2(e.target.value)}
                      options={statusOptions}
                    />
                  </FilterCard.Field>
                </FilterCard>
              </div>
            </ComponentShowcase>

            {/* Stacked Layout */}
            <ComponentShowcase title="Stacked Layout" description="Vertical layout for narrow sidebars">
              <div className="w-full max-w-sm">
                <FilterCard layout="stacked">
                  <FilterCard.Search
                    value=""
                    onChange={() => {}}
                    placeholder="Search..."
                  />
                  <FilterCard.Field label="Status">
                    <Select
                      value=""
                      onChange={() => {}}
                      options={statusOptions}
                      placeholder="All Statuses"
                    />
                  </FilterCard.Field>
                  <FilterCard.Field label="Category">
                    <Select
                      value=""
                      onChange={() => {}}
                      options={categoryOptions}
                      placeholder="All Categories"
                    />
                  </FilterCard.Field>
                </FilterCard>
              </div>
            </ComponentShowcase>
          </div>
        </Card.Body>
      </Card>

        {/* Props Tables */}
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Input Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={inputProps} />
          </Card.Body>
        </Card>

        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              PhoneInput Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={phoneInputProps} />
          </Card.Body>
        </Card>

        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              MaskedInput Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={maskedInputProps} />
          </Card.Body>
        </Card>

        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              FilterCard Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={filterCardProps} />
          </Card.Body>
        </Card>

        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              FilterCard.Search Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={filterCardSearchProps} />
          </Card.Body>
        </Card>

        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              FilterCard.Field Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={filterCardFieldProps} />
          </Card.Body>
        </Card>

        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              FilterCard.Actions Props
            </h3>
          </Card.Header>
          <Card.Body>
            <PropsTable props={filterCardActionsProps} />
          </Card.Body>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
