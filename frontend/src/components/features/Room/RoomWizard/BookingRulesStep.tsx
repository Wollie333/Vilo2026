/**
 * BookingRulesStep Component
 *
 * Step 4 of the Room Wizard: Minimum/maximum nights and inventory settings.
 */

import React, { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import type { BookingRulesStepProps } from './RoomWizard.types';

// ============================================================================
// BookingRulesStep Component
// ============================================================================

export const BookingRulesStep: React.FC<BookingRulesStepProps> = ({
  data,
  onChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = <K extends keyof typeof data>(field: K, value: (typeof data)[K]) => {
    onChange({ ...data, [field]: value });
    // Clear error when field is edited
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.min_nights < 1) {
      newErrors.min_nights = 'Minimum nights must be at least 1';
    }

    if (data.max_nights !== null && data.max_nights < data.min_nights) {
      newErrors.max_nights = 'Maximum nights must be greater than or equal to minimum nights';
    }

    if (data.total_units < 1) {
      newErrors.total_units = 'Total units must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Rules</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Set rules for how guests can book this room.
        </p>
      </div>

      {/* Stay Duration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Stay Duration</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Minimum Nights *"
            type="number"
            min={1}
            max={365}
            value={data.min_nights}
            onChange={(e) => handleChange('min_nights', parseInt(e.target.value) || 1)}
            error={errors.min_nights}
            helperText="Shortest allowed stay"
            fullWidth
          />
          <Input
            label="Maximum Nights"
            type="number"
            min={1}
            max={365}
            value={data.max_nights || ''}
            onChange={(e) => handleChange('max_nights', e.target.value ? parseInt(e.target.value) : null)}
            error={errors.max_nights}
            helperText="Leave empty for no limit"
            fullWidth
          />
        </div>

        {/* Common presets */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">Quick presets:</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleChange('min_nights', 1)}
          >
            1 night min
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleChange('min_nights', 2)}
          >
            2 nights min
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleChange('min_nights', 3)}
          >
            Weekend (3 nights)
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleChange('min_nights', 7)}
          >
            Weekly (7 nights)
          </Button>
        </div>
      </div>

      {/* Inventory Mode */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Inventory</h3>

        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <HiOutlineInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600 dark:text-blue-400">
            <p>
              <strong>Single Unit:</strong> This room is a unique space that can only be booked by one guest at a time (e.g., a specific cabin, suite, or apartment).
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Summary</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>
            Guests must book for at least <strong>{data.min_nights} night{data.min_nights !== 1 ? 's' : ''}</strong>
          </li>
          {data.max_nights && (
            <li>
              Maximum stay is <strong>{data.max_nights} nights</strong>
            </li>
          )}
          <li>
            This is a <strong>single unit</strong> room
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  );
};
