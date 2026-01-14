/**
 * Rates Calendar Showcase
 *
 * Showcases SeasonalRatesCalendar and RatesTab components
 */

import { useState } from 'react';
import { AuthenticatedLayout } from '../../components/layout/AuthenticatedLayout';
import { Card } from '../../components/ui';
import { ComponentShowcase, PropsTable } from './components';
import { SeasonalRatesCalendar } from '../../components/features/Room';
import { RatesTab } from '../../components/features/PropertyDetail';

export function RatesCalendarShowcase() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock room data for demonstration
  const mockRoom = {
    id: 'demo-room-1',
    name: 'Deluxe Suite',
    max_guests: 4,
    base_price_per_night: 1500,
    currency: 'ZAR',
    seasonal_rates: [
      {
        id: 'sr1',
        name: 'Summer Special',
        description: 'Peak season pricing',
        start_date: '2026-01-01',
        end_date: '2026-01-31',
        price_per_night: 2000,
        is_active: true,
      },
      {
        id: 'sr2',
        name: 'Winter Discount',
        description: 'Off-season special',
        start_date: '2026-06-01',
        end_date: '2026-08-31',
        price_per_night: 1200,
        is_active: true,
      },
    ],
  };

  const mockRoom2 = {
    id: 'demo-room-2',
    name: 'Standard Room',
    max_guests: 2,
    base_price_per_night: 900,
    currency: 'ZAR',
    seasonal_rates: [
      {
        id: 'sr3',
        name: 'Valentine Special',
        description: 'Romance package',
        start_date: '2026-02-10',
        end_date: '2026-02-16',
        price_per_night: 1100,
        is_active: true,
      },
    ],
  };

  const mockRooms = [mockRoom, mockRoom2];

  // Booked dates for demonstration
  const bookedDates = [
    new Date(2026, 0, 20),
    new Date(2026, 0, 21),
    new Date(2026, 0, 22),
  ];

  const handleDateSelect = (date: Date, roomId?: string) => {
    setSelectedDate(date);
    console.log('Date selected:', date, 'Room:', roomId);
  };

  const seasonalRatesCalendarProps = [
    { name: 'room', type: 'RoomWithRates', default: '-', description: 'Room object with seasonal rates' },
    { name: 'startDate', type: 'Date', default: 'new Date()', description: 'Starting date for calendar view' },
    { name: 'daysToShow', type: 'number', default: '7', description: 'Number of days to display' },
    { name: 'bookedDates', type: 'Date[]', default: '[]', description: 'Array of booked dates' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Compact mode for smaller displays' },
    { name: 'showNavigation', type: 'boolean', default: 'true', description: 'Show navigation arrows' },
    { name: 'onDateRangeChange', type: '(start: Date, end: Date) => void', default: '-', description: 'Callback when date range changes' },
    { name: 'onDateSelect', type: '(date: Date) => void', default: '-', description: 'Callback when date is selected' },
  ];

  const ratesTabProps = [
    { name: 'rooms', type: 'Room[]', default: '-', description: 'Array of rooms with seasonal rates' },
    { name: 'currency', type: 'string', default: '-', description: 'Currency code (ZAR, USD, etc.)' },
    { name: 'onDateSelect', type: '(date: Date, roomId: string) => void', default: '-', description: 'Callback when date cell is clicked' },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rates Calendar Components
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Booking.com-style rate calendars showing pricing and availability across dates.
          </p>
        </div>

        {/* SeasonalRatesCalendar Section */}
        <ComponentShowcase
          title="SeasonalRatesCalendar"
          description="Single room calendar with seasonal rates. Used in room detail pages and admin dashboard."
        >
          <div className="space-y-8">
            {/* Basic Usage */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Usage (7 Days)</h4>
              <SeasonalRatesCalendar
                room={mockRoom}
                startDate={new Date()}
                daysToShow={7}
                bookedDates={bookedDates}
                onDateSelect={handleDateSelect}
              />
              {selectedDate && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Last selected: {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Extended View */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Extended View (14 Days)</h4>
              <SeasonalRatesCalendar
                room={mockRoom}
                startDate={new Date()}
                daysToShow={14}
                bookedDates={bookedDates}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Compact Mode */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Compact Mode</h4>
              <SeasonalRatesCalendar
                room={mockRoom}
                startDate={new Date()}
                daysToShow={7}
                bookedDates={bookedDates}
                compact
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Without Navigation */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Without Navigation</h4>
              <SeasonalRatesCalendar
                room={mockRoom}
                startDate={new Date()}
                daysToShow={7}
                bookedDates={bookedDates}
                showNavigation={false}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Key Features</h4>
              <Card className="p-6">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Custom scrollbar styling for horizontal scroll</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Clickable date cells (green = available, red = booked)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Seasonal rate names displayed under pricing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Today's date highlighted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Helpful tooltips on hover</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Active seasonal rates summary below calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Date picker for quick navigation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Responsive with mobile support</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Legend */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Color Legend</h4>
              <Card className="p-6">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 dark:bg-green-900/10 border border-gray-200 dark:border-dark-border rounded" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Base Rate</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">No seasonal rate applied</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 border border-gray-200 dark:border-dark-border rounded" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Seasonal Rate</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Special pricing applied</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 border border-gray-200 dark:border-dark-border rounded" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Fully Booked</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Not available</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <PropsTable props={seasonalRatesCalendarProps} />
        </ComponentShowcase>

        {/* RatesTab Section */}
        <ComponentShowcase
          title="RatesTab"
          description="Combined rates calendar showing all rooms in a single table. Used in public property detail pages."
        >
          <div className="space-y-8">
            {/* Multiple Rooms */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Multiple Rooms View</h4>
              <RatesTab
                rooms={mockRooms}
                currency="ZAR"
                onDateSelect={(date, roomId) => {
                  setSelectedDate(date);
                  console.log('Booking:', date, 'Room:', roomId);
                }}
              />
              {selectedDate && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Ready to book: {selectedDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Single Room */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Single Room View</h4>
              <RatesTab
                rooms={[mockRoom]}
                currency="ZAR"
                onDateSelect={(date, roomId) => {
                  console.log('Selected:', date, roomId);
                }}
              />
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Key Features</h4>
              <Card className="p-6">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Unified view of all rooms in single table</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Sticky left column for room names</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Easy price comparison across rooms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Date navigation with prev/next buttons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Clickable cells redirect to checkout with pre-filled date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Custom scrollbar matches dashboard design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span>Full dark mode support</span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Use Cases */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Use Cases</h4>
              <Card className="p-6">
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Public Property Detail Page</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Guests can see availability and pricing across all rooms, then click to book their preferred date and room.
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Admin Dashboard</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Property managers can use SeasonalRatesCalendar on individual room pages to manage pricing and view bookings.
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">Booking Search Results</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Display availability calendars in search results to help users find the best dates.
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <PropsTable props={ratesTabProps} />
        </ComponentShowcase>

        {/* Integration Example */}
        <ComponentShowcase
          title="Integration Example"
          description="How to use these components in your application"
        >
          <div className="space-y-4">
            <Card className="p-6 bg-gray-900 text-white">
              <pre className="text-sm overflow-x-auto">
                <code>{`// Import components
import { SeasonalRatesCalendar, RatesTab } from '@/components/features';

// Single room calendar (Room detail page)
<SeasonalRatesCalendar
  room={room}
  startDate={new Date()}
  daysToShow={14}
  bookedDates={bookedDates}
  onDateSelect={(date) => {
    // Handle date selection
    navigate(\`/checkout?date=\${date}\`);
  }}
/>

// Multiple rooms calendar (Property detail page)
<RatesTab
  rooms={property.rooms}
  currency={property.currency}
  onDateSelect={(date, roomId) => {
    // Navigate to checkout with pre-filled data
    navigate(\`/checkout?room=\${roomId}&checkIn=\${date}\`);
  }}
/>`}</code>
              </pre>
            </Card>
          </div>
        </ComponentShowcase>
      </div>
    </AuthenticatedLayout>
  );
}

export default RatesCalendarShowcase;
