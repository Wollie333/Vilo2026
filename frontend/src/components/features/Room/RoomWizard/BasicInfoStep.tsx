/**
 * BasicInfoStep Component
 *
 * Step 1 of the Room Wizard: Basic information, capacity, beds, and amenities.
 */

import React, { useState } from 'react';
import {
  Input,
  Textarea,
  Button,
  Select,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell
} from '@/components/ui';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import type { BasicInfoStepProps, BedFormData } from './RoomWizard.types';
import { BED_TYPE_LABELS, DEFAULT_AMENITIES, BedType } from '@/types/room.types';

// ============================================================================
// Bed Selector Component
// ============================================================================

interface BedSelectorProps {
  beds: BedFormData[];
  onChange: (beds: BedFormData[]) => void;
}

const BedSelector: React.FC<BedSelectorProps> = ({ beds, onChange }) => {
  const bedTypeOptions = Object.entries(BED_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const handleAddBed = () => {
    onChange([
      ...beds,
      { bed_type: 'double' as BedType, quantity: 1, sleeps: 2 },
    ]);
  };

  const handleRemoveBed = (index: number) => {
    onChange(beds.filter((_, i) => i !== index));
  };

  const handleBedChange = (index: number, field: keyof BedFormData, value: unknown) => {
    const newBeds = [...beds];
    newBeds[index] = { ...newBeds[index], [field]: value };
    onChange(newBeds);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bed Configuration
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddBed}
        >
          <HiOutlinePlus className="w-4 h-4 mr-1" />
          Add Bed
        </Button>
      </div>

      {beds.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No beds configured. Click "Add Bed" to add bed configurations.
        </p>
      ) : (
        <Table size="sm" variant="default">
          <TableHead>
            <TableRow>
              <TableHeader width="40%">Bed Type</TableHeader>
              <TableHeader width="25%">Quantity</TableHeader>
              <TableHeader width="25%">Sleeps</TableHeader>
              <TableHeader width="10%" align="right"></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {beds.map((bed, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Select
                    value={bed.bed_type}
                    onChange={(e) => handleBedChange(index, 'bed_type', e.target.value)}
                    options={bedTypeOptions}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={bed.quantity}
                    onChange={(e) => handleBedChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    placeholder="Qty"
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={bed.sleeps}
                    onChange={(e) => handleBedChange(index, 'sleeps', parseInt(e.target.value) || 1)}
                    placeholder="Sleeps"
                    fullWidth
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBed(index)}
                    className="text-error hover:text-error/80"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

// ============================================================================
// Amenities Selector Component
// ============================================================================

interface AmenitiesSelectorProps {
  selected: string[];
  onChange: (amenities: string[]) => void;
}

const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({ selected, onChange }) => {
  const [customAmenity, setCustomAmenity] = useState('');

  const handleToggle = (amenity: string) => {
    if (selected.includes(amenity)) {
      onChange(selected.filter((a) => a !== amenity));
    } else {
      onChange([...selected, amenity]);
    }
  };

  const handleAddCustom = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomAmenity('');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        Amenities
      </label>

      {/* Quick select from defaults */}
      <div className="flex flex-wrap gap-2">
        {DEFAULT_AMENITIES.map((amenity) => (
          <Button
            key={amenity}
            type="button"
            variant={selected.includes(amenity) ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleToggle(amenity)}
          >
            {amenity}
          </Button>
        ))}
      </div>

      {/* Custom amenity input */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={customAmenity}
          onChange={(e) => setCustomAmenity(e.target.value)}
          placeholder="Add custom amenity"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          fullWidth
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCustom}
          disabled={!customAmenity.trim()}
        >
          Add
        </Button>
      </div>

      {/* Show custom amenities that are selected but not in defaults */}
      {selected.filter((a) => !DEFAULT_AMENITIES.includes(a)).length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Custom amenities:</p>
          <div className="flex flex-wrap gap-2">
            {selected
              .filter((a) => !DEFAULT_AMENITIES.includes(a))
              .map((amenity) => (
                <Badge
                  key={amenity}
                  variant="primary"
                  size="md"
                  className="inline-flex items-center gap-1 cursor-pointer"
                  onClick={() => handleToggle(amenity)}
                >
                  {amenity}
                  <span className="hover:opacity-70">×</span>
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BasicInfoStep Component
// ============================================================================

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
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

    if (!data.name.trim()) {
      newErrors.name = 'Room name is required';
    }

    if (data.max_guests < 1) {
      newErrors.max_guests = 'Maximum guests must be at least 1';
    }

    if (data.max_adults !== null && data.max_adults < 1) {
      newErrors.max_adults = 'Maximum adults must be at least 1';
    }

    if (data.max_children !== null && data.max_children < 0) {
      newErrors.max_children = 'Maximum children cannot be negative';
    }

    if (data.room_size_sqm !== null && data.room_size_sqm < 0) {
      newErrors.room_size_sqm = 'Room size cannot be negative';
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Start with the basic details about your room.
        </p>
      </div>

      {/* Room Name */}
      <Input
        label="Room Name *"
        value={data.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="e.g., Deluxe King Suite"
        error={errors.name}
        fullWidth
      />

      {/* Description */}
      <Textarea
        label="Description"
        value={data.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Describe the room, its features, and what makes it special..."
        helperText="A good description helps guests understand what to expect."
        resize="vertical"
      />

      {/* Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Maximum Guests *"
          type="number"
          min={1}
          max={50}
          value={data.max_guests}
          onChange={(e) => handleChange('max_guests', parseInt(e.target.value) || 1)}
          error={errors.max_guests}
          helperText="Total number of guests allowed"
          fullWidth
        />
        <Input
          label="Max Adults"
          type="number"
          min={1}
          max={50}
          value={data.max_adults || ''}
          onChange={(e) => handleChange('max_adults', e.target.value ? parseInt(e.target.value) : null)}
          error={errors.max_adults}
          helperText="Leave empty for no limit"
          fullWidth
        />
        <Input
          label="Max Children"
          type="number"
          min={0}
          max={50}
          value={data.max_children || ''}
          onChange={(e) => handleChange('max_children', e.target.value ? parseInt(e.target.value) : null)}
          error={errors.max_children}
          helperText="Leave empty for no limit"
          fullWidth
        />
      </div>

      {/* Room Size */}
      <Input
        label="Room Size (m²)"
        type="number"
        min={0}
        value={data.room_size_sqm || ''}
        onChange={(e) => handleChange('room_size_sqm', e.target.value ? parseFloat(e.target.value) : null)}
        error={errors.room_size_sqm}
        helperText="Optional - helps guests understand the space"
        fullWidth
      />

      {/* Bed Configuration */}
      <BedSelector
        beds={data.beds}
        onChange={(beds) => handleChange('beds', beds)}
      />

      {/* Amenities */}
      <AmenitiesSelector
        selected={data.amenities}
        onChange={(amenities) => handleChange('amenities', amenities)}
      />

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Back
          </Button>
        )}
        <div className={!onBack ? 'ml-auto' : ''}>
          <Button onClick={handleNext} disabled={isLoading}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
