/**
 * Date Pickers Showcase
 *
 * Showcases DateInput, DatePickerModal, and DateRangePicker components
 */

import { useState } from 'react';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import { Card, Button, DateInput, DatePickerModal, DateRangePicker } from '../../components/ui';
import { ComponentShowcase, PropsTable } from './components';
import type { DateRange } from '../../components/ui';

export function DatePickersShowcase() {
  // DateInput state
  const [singleDate, setSingleDate] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // DatePickerModal state
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [modalSingleDate, setModalSingleDate] = useState<Date | null>(null);
  const [modalDateRange, setModalDateRange] = useState<{ checkIn: Date | null; checkOut: Date | null }>({
    checkIn: null,
    checkOut: null,
  });

  // DateRangePicker state
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [bookingRange, setBookingRange] = useState<DateRange>({ startDate: null, endDate: null });

  // Disabled dates (for example: block specific dates)
  const disabledDates = [
    new Date(2026, 0, 15),
    new Date(2026, 0, 16),
    new Date(2026, 0, 17),
  ];

  const dateInputProps = [
    { name: 'value', type: 'string', default: '-', description: 'Date value in YYYY-MM-DD format' },
    { name: 'onChange', type: '(value: string) => void', default: '-', description: 'Callback when date changes' },
    { name: 'label', type: 'string', default: '-', description: 'Input label' },
    { name: 'placeholder', type: 'string', default: 'Select date', description: 'Placeholder text' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the input is disabled' },
    { name: 'error', type: 'string', default: '-', description: 'Error message' },
    { name: 'required', type: 'boolean', default: 'false', description: 'Whether the field is required' },
    { name: 'minDate', type: 'Date', default: '-', description: 'Minimum selectable date' },
    { name: 'maxDate', type: 'Date', default: '-', description: 'Maximum selectable date' },
  ];

  const datePickerModalProps = [
    { name: 'isOpen', type: 'boolean', default: '-', description: 'Whether the modal is open' },
    { name: 'onClose', type: '() => void', default: '-', description: 'Callback to close the modal' },
    { name: 'onDateSelect', type: '(checkIn: Date, checkOut?: Date) => void', default: '-', description: 'Callback when date(s) selected' },
    { name: 'mode', type: "'single' | 'range'", default: 'range', description: 'Single date or date range selection' },
    { name: 'title', type: 'string', default: 'Select Dates', description: 'Modal title' },
    { name: 'minDate', type: 'Date', default: 'new Date()', description: 'Minimum selectable date' },
    { name: 'maxDate', type: 'Date', default: '-', description: 'Maximum selectable date' },
    { name: 'disabledDates', type: 'Date[]', default: '[]', description: 'Array of disabled dates' },
  ];

  const dateRangePickerProps = [
    { name: 'value', type: 'DateRange', default: '-', description: 'Date range value ({ startDate, endDate })' },
    { name: 'onChange', type: '(value: DateRange) => void', default: '-', description: 'Callback when range changes' },
    { name: 'label', type: 'string', default: '-', description: 'Component label' },
    { name: 'startLabel', type: 'string', default: 'From', description: 'Start date label' },
    { name: 'endLabel', type: 'string', default: 'To', description: 'End date label' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Whether the picker is disabled' },
    { name: 'error', type: 'string', default: '-', description: 'Error message' },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Date Picker Components
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Modern date selection components with calendar modal interface. Replaces native date inputs across the app.
          </p>
        </div>

        {/* DateInput Section */}
        <ComponentShowcase
          title="DateInput"
          description="Single date input with modal calendar picker. Used for check-in dates, birthdays, etc."
        >
          <div className="space-y-8">
            {/* Basic DateInput */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Usage</h4>
              <div className="max-w-md">
                <DateInput
                  label="Select a date"
                  value={singleDate}
                  onChange={setSingleDate}
                  placeholder="Choose a date"
                />
                {singleDate && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {new Date(singleDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* With constraints */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Min/Max Date</h4>
              <div className="max-w-md">
                <DateInput
                  label="Birth date"
                  value={birthDate}
                  onChange={setBirthDate}
                  placeholder="Select your birth date"
                  maxDate={new Date()}
                  helperText="Must be in the past"
                />
              </div>
            </div>

            {/* Required & Error states */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Required & Error States</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <DateInput
                  label="Required field"
                  value=""
                  onChange={() => {}}
                  required
                  placeholder="Select date"
                />
                <DateInput
                  label="With error"
                  value=""
                  onChange={() => {}}
                  error="This field is required"
                  placeholder="Select date"
                />
              </div>
            </div>

            {/* Disabled */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled State</h4>
              <div className="max-w-md">
                <DateInput
                  label="Disabled date input"
                  value="2026-01-15"
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Common Use Cases</h4>
              <Card className="p-6 space-y-4 max-w-2xl">
                <DateInput
                  label="Event date"
                  value=""
                  onChange={() => {}}
                  placeholder="When is your event?"
                  minDate={new Date()}
                />
                <DateInput
                  label="Check-in date"
                  value=""
                  onChange={() => {}}
                  placeholder="Select check-in"
                  minDate={new Date()}
                />
                <DateInput
                  label="Expiry date"
                  value=""
                  onChange={() => {}}
                  placeholder="Document expiry"
                  minDate={new Date()}
                />
              </Card>
            </div>
          </div>

          <PropsTable props={dateInputProps} />
        </ComponentShowcase>

        {/* DatePickerModal Section */}
        <ComponentShowcase
          title="DatePickerModal"
          description="Full-screen modal with calendar interface for date selection. Supports single date and date range modes."
        >
          <div className="space-y-8">
            {/* Single Date Mode */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Single Date Mode</h4>
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSingleModal(true)}
                  className="max-w-md"
                >
                  Open Single Date Picker
                </Button>
                {modalSingleDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Selected: {modalSingleDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
              <DatePickerModal
                isOpen={showSingleModal}
                onClose={() => setShowSingleModal(false)}
                onDateSelect={(date) => {
                  setModalSingleDate(date);
                  setShowSingleModal(false);
                }}
                mode="single"
                title="Select Event Date"
                minDate={new Date()}
              />
            </div>

            {/* Date Range Mode */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Date Range Mode</h4>
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRangeModal(true)}
                  className="max-w-md"
                >
                  Open Date Range Picker
                </Button>
                {modalDateRange.checkIn && modalDateRange.checkOut && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Range: {modalDateRange.checkIn.toLocaleDateString()} - {modalDateRange.checkOut.toLocaleDateString()}
                  </p>
                )}
              </div>
              <DatePickerModal
                isOpen={showRangeModal}
                onClose={() => setShowRangeModal(false)}
                onDateSelect={(checkIn, checkOut) => {
                  setModalDateRange({ checkIn, checkOut: checkOut || null });
                  setShowRangeModal(false);
                }}
                mode="range"
                title="Select Booking Dates"
                minDate={new Date()}
                disabledDates={disabledDates}
              />
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Key Features</h4>
              <Card className="p-6">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Month navigation with previous/next arrows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Min/max date constraints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Disabled dates support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Range selection with hover preview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Full dark mode support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Keyboard navigation support</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>

          <PropsTable props={datePickerModalProps} />
        </ComponentShowcase>

        {/* DateRangePicker Section */}
        <ComponentShowcase
          title="DateRangePicker"
          description="Inline date range picker with two date inputs. Opens DatePickerModal on click."
        >
          <div className="space-y-8">
            {/* Basic Usage */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Usage</h4>
              <div className="max-w-2xl">
                <DateRangePicker
                  label="Select date range"
                  value={dateRange}
                  onChange={setDateRange}
                />
                {dateRange.startDate && dateRange.endDate && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Custom Labels */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Custom Labels</h4>
              <div className="max-w-2xl">
                <DateRangePicker
                  label="Booking period"
                  startLabel="Check-in"
                  endLabel="Check-out"
                  value={bookingRange}
                  onChange={setBookingRange}
                />
              </div>
            </div>

            {/* With Error */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">With Error</h4>
              <div className="max-w-2xl">
                <DateRangePicker
                  label="Invalid range"
                  value={{ startDate: null, endDate: null }}
                  onChange={() => {}}
                  error="Please select both start and end dates"
                />
              </div>
            </div>

            {/* Disabled */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Disabled State</h4>
              <div className="max-w-2xl">
                <DateRangePicker
                  label="Disabled range picker"
                  value={{ startDate: '2026-01-10', endDate: '2026-01-15' }}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Common Use Cases</h4>
              <Card className="p-6 space-y-6 max-w-2xl">
                <DateRangePicker
                  label="Report period"
                  startLabel="Start date"
                  endLabel="End date"
                  value={{ startDate: null, endDate: null }}
                  onChange={() => {}}
                  helperText="Select the period for your report"
                />
                <DateRangePicker
                  label="Promotion dates"
                  startLabel="Starts"
                  endLabel="Ends"
                  value={{ startDate: null, endDate: null }}
                  onChange={() => {}}
                />
                <DateRangePicker
                  label="Booking search"
                  startLabel="Check-in"
                  endLabel="Check-out"
                  value={{ startDate: null, endDate: null }}
                  onChange={() => {}}
                />
              </Card>
            </div>
          </div>

          <PropsTable props={dateRangePickerProps} />
        </ComponentShowcase>
      </div>
    </AuthenticatedLayout>
  );
}

export default DatePickersShowcase;
