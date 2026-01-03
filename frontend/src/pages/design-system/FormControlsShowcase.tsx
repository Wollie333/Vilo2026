import { useState } from 'react';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import { Card } from '../../components/ui';
import {
  Switch,
  Checkbox,
  Radio,
  RadioGroup,
  Textarea,
} from '../../components/ui';
import { ComponentShowcase, PropsTable } from './components';

export function FormControlsShowcase() {
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(true);
  const [selectedRadio, setSelectedRadio] = useState('option1');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Form Control Components
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Interactive form controls - Switch, Checkbox, Radio buttons, and Textarea.
          </p>
        </div>

        {/* Switch Section */}
        <ComponentShowcase
          title="Switch"
          description="Toggle between two states, typically used for on/off settings."
        >
          <div className="space-y-8">
            {/* Basic Switch */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Switch</h4>
              <Switch
                checked={switchEnabled}
                onCheckedChange={setSwitchEnabled}
              />
            </div>

            {/* With Label */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Label</h4>
              <div className="space-y-4">
                <Switch
                  label="Email notifications"
                  checked={true}
                  onCheckedChange={() => {}}
                />
                <Switch
                  label="Marketing emails"
                  description="Receive promotional offers and updates"
                  checked={false}
                  onCheckedChange={() => {}}
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <Switch size="sm" checked={true} onCheckedChange={() => {}} />
                  <span className="text-xs text-gray-500 mt-2 block">Small</span>
                </div>
                <div className="text-center">
                  <Switch size="md" checked={true} onCheckedChange={() => {}} />
                  <span className="text-xs text-gray-500 mt-2 block">Medium</span>
                </div>
                <div className="text-center">
                  <Switch size="lg" checked={true} onCheckedChange={() => {}} />
                  <span className="text-xs text-gray-500 mt-2 block">Large</span>
                </div>
              </div>
            </div>

            {/* Disabled */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled State</h4>
              <div className="flex items-center gap-8">
                <Switch disabled checked={false} onCheckedChange={() => {}} label="Disabled off" />
                <Switch disabled checked={true} onCheckedChange={() => {}} label="Disabled on" />
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Common Use Cases</h4>
              <Card className="p-4 space-y-4 max-w-md">
                <Switch
                  label="Dark mode"
                  description="Switch between light and dark theme"
                  checked={true}
                  onCheckedChange={() => {}}
                />
                <Switch
                  label="Auto-save"
                  description="Automatically save changes as you type"
                  checked={true}
                  onCheckedChange={() => {}}
                />
                <Switch
                  label="Two-factor authentication"
                  description="Add an extra layer of security"
                  checked={false}
                  onCheckedChange={() => {}}
                />
              </Card>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'checked', type: 'boolean', required: true, description: 'Whether the switch is on' },
            { name: 'onChange', type: '(checked: boolean) => void', required: true, description: 'Callback when toggled' },
            { name: 'label', type: 'string', description: 'Label text' },
            { name: 'description', type: 'string', description: 'Helper description text' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the switch' },
          ]}
        />

        {/* Checkbox Section */}
        <ComponentShowcase
          title="Checkbox"
          description="Allow users to select one or more options from a set."
        >
          <div className="space-y-8">
            {/* Basic Checkbox */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Checkbox</h4>
              <Checkbox
                checked={checkboxChecked}
                onCheckedChange={setCheckboxChecked}
              />
            </div>

            {/* With Label */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Label</h4>
              <div className="space-y-3">
                <Checkbox label="Accept terms and conditions" checked={true} onCheckedChange={() => {}} />
                <Checkbox label="Subscribe to newsletter" checked={false} onCheckedChange={() => {}} />
                <Checkbox label="Remember my preference" description="Save this choice for future visits" checked={true} onCheckedChange={() => {}} />
              </div>
            </div>

            {/* Indeterminate */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Indeterminate State</h4>
              <div className="space-y-2">
                <Checkbox
                  label="Select all items"
                  checked={false}
                  indeterminate={indeterminate}
                  onCheckedChange={(checked) => {
                    setIndeterminate(false);
                    console.log('Parent checked:', checked);
                  }}
                />
                <div className="ml-6 space-y-2">
                  <Checkbox label="Item 1" checked={true} onCheckedChange={() => setIndeterminate(true)} />
                  <Checkbox label="Item 2" checked={true} onCheckedChange={() => setIndeterminate(true)} />
                  <Checkbox label="Item 3" checked={false} onCheckedChange={() => setIndeterminate(true)} />
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="flex items-center gap-8">
                <Checkbox size="sm" label="Small" checked={true} onCheckedChange={() => {}} />
                <Checkbox size="md" label="Medium" checked={true} onCheckedChange={() => {}} />
                <Checkbox size="lg" label="Large" checked={true} onCheckedChange={() => {}} />
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">States</h4>
              <div className="flex items-center gap-8">
                <Checkbox label="Default" checked={false} onCheckedChange={() => {}} />
                <Checkbox label="Checked" checked={true} onCheckedChange={() => {}} />
                <Checkbox label="Disabled" disabled checked={false} onCheckedChange={() => {}} />
                <Checkbox label="Disabled Checked" disabled checked={true} onCheckedChange={() => {}} />
              </div>
            </div>

            {/* With Error */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Error</h4>
              <Checkbox
                label="I agree to the terms"
                checked={false}
                error="You must accept the terms to continue"
                onCheckedChange={() => {}}
              />
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'checked', type: 'boolean', required: true, description: 'Whether the checkbox is checked' },
            { name: 'onChange', type: '(checked: boolean) => void', required: true, description: 'Callback when toggled' },
            { name: 'label', type: 'string', description: 'Label text' },
            { name: 'description', type: 'string', description: 'Helper description text' },
            { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Show indeterminate state' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant' },
            { name: 'error', type: 'string', description: 'Error message to display' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the checkbox' },
          ]}
        />

        {/* Radio Section */}
        <ComponentShowcase
          title="Radio"
          description="Allow users to select exactly one option from a set."
        >
          <div className="space-y-8">
            {/* Basic Radio Group */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Radio Group</h4>
              <RadioGroup
                name="basic"
                value={selectedRadio}
                onChange={setSelectedRadio}
              >
                <Radio value="option1" label="Option 1" />
                <Radio value="option2" label="Option 2" />
                <Radio value="option3" label="Option 3" />
              </RadioGroup>
            </div>

            {/* With Descriptions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Descriptions</h4>
              <RadioGroup name="plans" value="pro" onChange={() => {}}>
                <Radio
                  value="free"
                  label="Free Plan"
                  description="Basic features for personal use"
                />
                <Radio
                  value="pro"
                  label="Pro Plan"
                  description="Advanced features for professionals"
                />
                <Radio
                  value="enterprise"
                  label="Enterprise Plan"
                  description="Custom solutions for large teams"
                />
              </RadioGroup>
            </div>

            {/* Horizontal Layout */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Horizontal Layout</h4>
              <RadioGroup name="size" value="md" onChange={() => {}} orientation="horizontal">
                <Radio value="sm" label="Small" />
                <Radio value="md" label="Medium" />
                <Radio value="lg" label="Large" />
              </RadioGroup>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="space-y-4">
                <RadioGroup name="size-demo-sm" value="selected" onChange={() => {}} orientation="horizontal">
                  <Radio value="selected" label="Small" size="sm" />
                  <Radio value="unselected" label="Unselected" size="sm" />
                </RadioGroup>
                <RadioGroup name="size-demo-md" value="selected" onChange={() => {}} orientation="horizontal">
                  <Radio value="selected" label="Medium (default)" size="md" />
                  <Radio value="unselected" label="Unselected" size="md" />
                </RadioGroup>
                <RadioGroup name="size-demo-lg" value="selected" onChange={() => {}} orientation="horizontal">
                  <Radio value="selected" label="Large" size="lg" />
                  <Radio value="unselected" label="Unselected" size="lg" />
                </RadioGroup>
              </div>
            </div>

            {/* Disabled Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled Options</h4>
              <RadioGroup name="disabled-demo" value="available" onChange={() => {}}>
                <Radio value="available" label="Available option" />
                <Radio value="unavailable" label="Unavailable option" disabled />
                <Radio value="another" label="Another available option" />
              </RadioGroup>
            </div>

            {/* With Error */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Error</h4>
              <RadioGroup name="error-demo" value="" onChange={() => {}} error="Please select an option">
                <Radio value="opt1" label="Option 1" />
                <Radio value="opt2" label="Option 2" />
              </RadioGroup>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'value', type: 'string', required: true, description: 'Value of this radio option' },
            { name: 'label', type: 'string', description: 'Label text' },
            { name: 'description', type: 'string', description: 'Helper description text' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the radio' },
            { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'", description: 'RadioGroup layout direction' },
            { name: 'error', type: 'string', description: 'Error message (on RadioGroup)' },
          ]}
        />

        {/* Textarea Section */}
        <ComponentShowcase
          title="Textarea"
          description="Multi-line text input for longer form content."
        >
          <div className="space-y-8">
            {/* Basic Textarea */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Textarea</h4>
              <Textarea
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                placeholder="Enter your message..."
              />
            </div>

            {/* With Label */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Label and Helper Text</h4>
              <div className="max-w-md">
                <Textarea
                  label="Description"
                  helperText="Provide a detailed description of your property"
                  placeholder="Describe your vacation rental..."
                  fullWidth
                />
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sizes</h4>
              <div className="space-y-4 max-w-md">
                <Textarea size="sm" placeholder="Small textarea" fullWidth />
                <Textarea size="md" placeholder="Medium textarea (default)" fullWidth />
                <Textarea size="lg" placeholder="Large textarea" fullWidth />
              </div>
            </div>

            {/* Resize Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Resize Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="No Resize"
                  resize="none"
                  placeholder="Cannot be resized"
                  fullWidth
                />
                <Textarea
                  label="Vertical Only (default)"
                  resize="vertical"
                  placeholder="Resize vertically"
                  fullWidth
                />
                <Textarea
                  label="Horizontal Only"
                  resize="horizontal"
                  placeholder="Resize horizontally"
                  fullWidth
                />
                <Textarea
                  label="Both Directions"
                  resize="both"
                  placeholder="Resize in any direction"
                  fullWidth
                />
              </div>
            </div>

            {/* With Error */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Error</h4>
              <div className="max-w-md">
                <Textarea
                  label="Feedback"
                  error="Please provide at least 20 characters of feedback"
                  placeholder="Tell us what you think..."
                  fullWidth
                />
              </div>
            </div>

            {/* Disabled */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled State</h4>
              <div className="max-w-md">
                <Textarea
                  label="Notes"
                  disabled
                  value="This field is currently disabled and cannot be edited."
                  fullWidth
                />
              </div>
            </div>

            {/* Character Count Example */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Use Case: Property Description</h4>
              <Card className="p-4 max-w-lg">
                <Textarea
                  label="Property Description"
                  helperText="Write a compelling description to attract guests (max 500 characters)"
                  placeholder="Describe the unique features, amenities, and nearby attractions of your property..."
                  rows={5}
                  maxLength={500}
                  fullWidth
                />
              </Card>
            </div>
          </div>
        </ComponentShowcase>

        <PropsTable
          props={[
            { name: 'label', type: 'string', description: 'Label text' },
            { name: 'error', type: 'string', description: 'Error message' },
            { name: 'helperText', type: 'string', description: 'Helper description text' },
            { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Size variant' },
            { name: 'resize', type: "'none' | 'vertical' | 'horizontal' | 'both'", default: "'vertical'", description: 'Resize behavior' },
            { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Take full width of container' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the textarea' },
          ]}
        />
      </div>
    </AuthenticatedLayout>
  );
}
