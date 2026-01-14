import React, { useState } from 'react';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Select } from '../Select';
import { Button } from '../Button';
import { DateInput } from '../DateInput';
import type { PromotionEditorProps, Promotion } from './PromotionEditor.types';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const EMPTY_PROMOTION: Promotion = {
  code: '',
  discount: 0,
  discount_type: 'percentage',
  start_date: '',
  end_date: '',
  description: '',
};

export const PromotionEditor: React.FC<PromotionEditorProps> = ({
  promotions,
  onPromotionsChange,
  seasonalMessage,
  onSeasonalMessageChange,
  disabled = false,
  maxPromotions = 5,
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion>(EMPTY_PROMOTION);

  const canAddMore = promotions.length < maxPromotions;

  const handleAddPromotion = () => {
    setEditingIndex(promotions.length);
    setEditingPromotion({ ...EMPTY_PROMOTION });
  };

  const handleEditPromotion = (index: number) => {
    setEditingIndex(index);
    setEditingPromotion({ ...promotions[index] });
  };

  const handleSavePromotion = () => {
    if (editingIndex === null) return;
    if (!editingPromotion.code.trim()) return;

    const newPromotions = [...promotions];
    if (editingIndex < promotions.length) {
      newPromotions[editingIndex] = editingPromotion;
    } else {
      newPromotions.push(editingPromotion);
    }

    onPromotionsChange(newPromotions);
    setEditingIndex(null);
    setEditingPromotion(EMPTY_PROMOTION);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingPromotion(EMPTY_PROMOTION);
  };

  const handleDeletePromotion = (index: number) => {
    const newPromotions = promotions.filter((_, i) => i !== index);
    onPromotionsChange(newPromotions);
  };

  const updateEditingField = <K extends keyof Promotion>(field: K, value: Promotion[K]) => {
    setEditingPromotion((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Seasonal Message */}
      {onSeasonalMessageChange && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Seasonal Message
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A short banner message displayed at the top of your listing (max 100 characters)
          </p>
          <Input
            value={seasonalMessage || ''}
            onChange={(e) => onSeasonalMessageChange(e.target.value || undefined)}
            placeholder="e.g., Summer Special - Book now for 20% off!"
            maxLength={100}
            disabled={disabled}
            fullWidth
          />
          <div className="text-xs text-gray-400 text-right">
            {(seasonalMessage || '').length}/100
          </div>
        </div>
      )}

      {/* Promotions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Special Offers
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create discount codes for guests ({promotions.length}/{maxPromotions})
            </p>
          </div>
          {canAddMore && editingIndex === null && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPromotion}
              disabled={disabled}
            >
              <PlusIcon />
              <span className="ml-1">Add Offer</span>
            </Button>
          )}
        </div>

        {/* Existing Promotions */}
        {promotions.map((promo, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 dark:border-dark-border rounded-lg"
          >
            {editingIndex === index ? (
              // Editing form
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Promo Code"
                    value={editingPromotion.code}
                    onChange={(e) => updateEditingField('code', e.target.value.toUpperCase())}
                    placeholder="SUMMER20"
                    disabled={disabled}
                    fullWidth
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Discount"
                      type="number"
                      min={0}
                      max={editingPromotion.discount_type === 'percentage' ? 100 : undefined}
                      value={editingPromotion.discount.toString()}
                      onChange={(e) => updateEditingField('discount', parseFloat(e.target.value) || 0)}
                      disabled={disabled}
                    />
                    <Select
                      label="Type"
                      value={editingPromotion.discount_type || 'percentage'}
                      onChange={(e) => updateEditingField('discount_type', e.target.value as 'percentage' | 'fixed')}
                      options={DISCOUNT_TYPE_OPTIONS}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DateInput
                    label="Start Date"
                    value={editingPromotion.start_date || ''}
                    onChange={(value) => updateEditingField('start_date', value || undefined)}
                    disabled={disabled}
                    placeholder="Select start date"
                  />
                  <DateInput
                    label="End Date"
                    value={editingPromotion.end_date || ''}
                    onChange={(value) => updateEditingField('end_date', value || undefined)}
                    disabled={disabled}
                    placeholder="Select end date"
                    minDate={editingPromotion.start_date ? new Date(editingPromotion.start_date) : undefined}
                  />
                </div>

                <Textarea
                  label="Description (optional)"
                  value={editingPromotion.description || ''}
                  onChange={(e) => updateEditingField('description', e.target.value || undefined)}
                  placeholder="Describe this offer..."
                  rows={2}
                  disabled={disabled}
                />

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSavePromotion}
                    disabled={!editingPromotion.code.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // Display view
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <TagIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white">
                        {promo.code}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        {promo.discount}
                        {promo.discount_type === 'percentage' ? '%' : ''} off
                      </span>
                    </div>
                    {promo.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {promo.description}
                      </p>
                    )}
                    {(promo.start_date || promo.end_date) && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {promo.start_date && `From ${promo.start_date}`}
                        {promo.start_date && promo.end_date && ' - '}
                        {promo.end_date && `Until ${promo.end_date}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPromotion(index)}
                    disabled={disabled}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePromotion(index)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add new promotion form */}
        {editingIndex !== null && editingIndex >= promotions.length && (
          <div className="p-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5">
            <h5 className="font-medium text-gray-900 dark:text-white mb-4">New Offer</h5>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Promo Code"
                  value={editingPromotion.code}
                  onChange={(e) => updateEditingField('code', e.target.value.toUpperCase())}
                  placeholder="SUMMER20"
                  disabled={disabled}
                  fullWidth
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Discount"
                    type="number"
                    min={0}
                    max={editingPromotion.discount_type === 'percentage' ? 100 : undefined}
                    value={editingPromotion.discount.toString()}
                    onChange={(e) => updateEditingField('discount', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                  />
                  <Select
                    label="Type"
                    value={editingPromotion.discount_type || 'percentage'}
                    onChange={(e) => updateEditingField('discount_type', e.target.value as 'percentage' | 'fixed')}
                    options={DISCOUNT_TYPE_OPTIONS}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DateInput
                  label="Start Date"
                  value={editingPromotion.start_date || ''}
                  onChange={(value) => updateEditingField('start_date', value || undefined)}
                  disabled={disabled}
                  placeholder="Select start date"
                />
                <DateInput
                  label="End Date"
                  value={editingPromotion.end_date || ''}
                  onChange={(value) => updateEditingField('end_date', value || undefined)}
                  disabled={disabled}
                  placeholder="Select end date"
                  minDate={editingPromotion.start_date ? new Date(editingPromotion.start_date) : undefined}
                />
              </div>

              <Textarea
                label="Description (optional)"
                value={editingPromotion.description || ''}
                onChange={(e) => updateEditingField('description', e.target.value || undefined)}
                placeholder="Describe this offer..."
                rows={2}
                disabled={disabled}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSavePromotion}
                  disabled={!editingPromotion.code.trim()}
                >
                  Add Offer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {promotions.length === 0 && editingIndex === null && (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-dark-border rounded-lg">
            <TagIcon />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              No special offers yet. Add a promotion to attract more bookings.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={handleAddPromotion}
              disabled={disabled}
            >
              <PlusIcon />
              <span className="ml-1">Add Your First Offer</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
