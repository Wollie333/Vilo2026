/**
 * PromoCodeFormPage Component
 *
 * Create and edit promo codes.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Card, Input, Textarea, Select, Alert, Spinner } from '@/components/ui';
import { PropertySelector } from '@/components/features';
import { promotionsService } from '@/services';
import type { RoomPromotion } from '@/types/room.types';
import type { PropertyWithCompany } from '@/types/property.types';
import { useToast } from '@/context/NotificationContext';
import { HiOutlineArrowLeft } from 'react-icons/hi';

type Mode = 'create' | 'edit';

export const PromoCodeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const mode: Mode = id ? 'edit' : 'create';

  // State
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState<RoomPromotion | null>(null);

  // Form state
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCompany | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_nights',
    discount_value: 0,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    max_uses: '',
    max_uses_per_customer: '1',
    min_booking_amount: '',
    min_nights: '',
    is_claimable: false,
    is_active: true,
  });

  // Load promo code for editing
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadPromo();
    }
  }, [id, mode]);

  const loadPromo = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await promotionsService.getPromotionById(id);
      console.log('📝 Loaded promo data:', data);
      setPromo(data);

      // Extract date part from datetime
      const extractDate = (datetime?: string | null) => {
        if (!datetime) return '';
        return datetime.split('T')[0];
      };

      // Populate form with safe defaults
      setFormData({
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        discount_type: data.discount_type || 'percentage',
        discount_value: data.discount_value || 0,
        valid_from: extractDate(data.valid_from) || '',
        valid_until: extractDate(data.valid_until) || '',
        max_uses: data.max_uses?.toString() || '',
        max_uses_per_customer: (data as any).max_uses_per_customer?.toString() || '1',
        min_booking_amount: (data as any).min_booking_amount?.toString() || '',
        min_nights: data.min_nights?.toString() || '',
        is_claimable: (data as any).is_claimable || false,
        is_active: data.is_active ?? true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load promo code';
      console.error('❌ Error loading promo:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedProperty && mode === 'create') {
      toast({
        variant: 'error',
        title: 'Validation Error',
        message: 'Please select a property',
        duration: 3000,
      });
      return;
    }

    if (!formData.code.trim()) {
      toast({
        variant: 'error',
        title: 'Validation Error',
        message: 'Promo code is required',
        duration: 3000,
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        variant: 'error',
        title: 'Validation Error',
        message: 'Name is required',
        duration: 3000,
      });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({
        variant: 'error',
        title: 'Validation Error',
        message: 'Discount value must be greater than 0',
        duration: 3000,
      });
      return;
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      toast({
        variant: 'error',
        title: 'Validation Error',
        message: 'Percentage discount cannot exceed 100%',
        duration: 3000,
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
        max_uses_per_customer: formData.max_uses_per_customer
          ? parseInt(formData.max_uses_per_customer)
          : 1,
        min_booking_amount: formData.min_booking_amount
          ? parseFloat(formData.min_booking_amount)
          : undefined,
        min_nights: formData.min_nights ? parseInt(formData.min_nights) : undefined,
        is_claimable: formData.is_claimable,
        is_active: formData.is_active,
      };

      if (mode === 'create') {
        payload.property_id = selectedProperty!.id;
        await promotionsService.createPromotion(payload);

        toast({
          variant: 'success',
          title: 'Created',
          message: 'Promo code created successfully',
          duration: 3000,
        });
      } else if (id) {
        await promotionsService.updatePromotion(id, payload);

        toast({
          variant: 'success',
          title: 'Updated',
          message: 'Promo code updated successfully',
          duration: 3000,
        });
      }

      navigate('/manage/rooms/promo-codes');
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${mode} promo code`;
      setError(message);
      toast({
        variant: 'error',
        title: mode === 'create' ? 'Create Failed' : 'Update Failed',
        message,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout title={mode === 'create' ? 'Create Promo Code' : 'Edit Promo Code'}>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={mode === 'create' ? 'Create Promo Code' : 'Edit Promo Code'}
      subtitle={mode === 'edit' ? promo?.name : 'Add a new promotional discount code'}
    >
      <div className="max-w-3xl space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/manage/rooms/promo-codes')}>
          <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
          Back to Promo Codes
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Promo Code Details
              </h2>
            </Card.Header>
            <Card.Body className="space-y-6">
              {/* Property Selection (Create Only) */}
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Property <span className="text-red-500">*</span>
                  </label>
                  <PropertySelector
                    value={selectedProperty}
                    onChange={setSelectedProperty}
                    placeholder="Select a property"
                    required
                  />
                </div>
              )}

              {/* Code and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Promo Code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., SUMMER2026"
                  required
                  helperText="Unique code customers will enter"
                />
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Special 2026"
                  required
                />
              </div>

              {/* Description */}
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for internal use"
                rows={3}
              />

              {/* Discount Type and Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Discount Type"
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_type: e.target.value as typeof formData.discount_type,
                    })
                  }
                  options={[
                    { value: 'percentage', label: 'Percentage Off' },
                    { value: 'fixed_amount', label: 'Fixed Amount Off' },
                    { value: 'free_nights', label: 'Free Nights' },
                  ]}
                  required
                />
                <Input
                  label="Discount Value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step={formData.discount_type === 'fixed_amount' ? '0.01' : '1'}
                  required
                  helperText={
                    formData.discount_type === 'percentage'
                      ? '0-100%'
                      : formData.discount_type === 'fixed_amount'
                      ? 'Amount in currency'
                      : 'Number of free nights'
                  }
                />
              </div>

              {/* Validity Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Valid From"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
                <Input
                  label="Valid Until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  helperText="Leave empty for no expiry"
                />
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Max Total Uses"
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  min="1"
                  helperText="Leave empty for unlimited"
                />
                <Input
                  label="Max Uses Per Customer"
                  type="number"
                  value={formData.max_uses_per_customer}
                  onChange={(e) =>
                    setFormData({ ...formData, max_uses_per_customer: e.target.value })
                  }
                  min="1"
                  required
                />
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Minimum Booking Amount"
                  type="number"
                  value={formData.min_booking_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, min_booking_amount: e.target.value })
                  }
                  min="0"
                  step="0.01"
                  helperText="Leave empty for no minimum"
                />
                <Input
                  label="Minimum Nights"
                  type="number"
                  value={formData.min_nights}
                  onChange={(e) => setFormData({ ...formData, min_nights: e.target.value })}
                  min="1"
                  helperText="Leave empty for no minimum"
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.is_claimable}
                    onChange={(e) =>
                      setFormData({ ...formData, is_claimable: e.target.checked })
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Claimable (guests can request this code via contact form)
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Active (promo code can be used)
                  </span>
                </label>
              </div>
            </Card.Body>
            <Card.Footer>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/manage/rooms/promo-codes')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={saving}>
                  {mode === 'create' ? 'Create Promo Code' : 'Save Changes'}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
};
