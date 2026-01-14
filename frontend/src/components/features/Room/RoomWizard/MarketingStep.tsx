/**
 * MarketingStep Component
 *
 * Step 5 of the Room Wizard: Seasonal rates and promotional codes.
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { Input, Button, Select, Badge, DateInput } from '@/components/ui';
import { HiOutlinePlus, HiOutlineCalendar, HiOutlineTag, HiOutlineCash } from 'react-icons/hi';
import { MarketingFeatureCard } from '@/components/features/Room/MarketingFeatureCard';
import { PaymentRuleEditorInline } from './PaymentRuleEditorInline';
import type { SeasonalRateFormData, PromotionFormData, MarketingFormData } from './RoomWizard.types';
import type { PaymentRuleFormData } from '@/types/payment-rules.types';
import { PAYMENT_RULE_TYPE_LABELS } from '@/types/payment-rules.types';

// Define the props for MarketingStep (shared across all marketing-related steps)
interface MarketingStepProps {
  data: MarketingFormData;
  currency: string;
  onChange: (data: MarketingFormData) => void;
  onSubmit?: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Seasonal Rate Editor Modal
// ============================================================================

interface SeasonalRateEditorProps {
  rate?: SeasonalRateFormData;
  currency: string;
  onSave: (rate: SeasonalRateFormData) => void;
  onCancel: () => void;
}

const SeasonalRateEditor: React.FC<SeasonalRateEditorProps> = ({
  rate,
  currency,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<SeasonalRateFormData>(
    rate || {
      name: '',
      start_date: '',
      end_date: '',
      price_per_night: 0,
      additional_person_rate: null,
      child_price_per_night: null,
      min_nights: null,
      is_active: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-white">
        {rate ? 'Edit Seasonal Rate' : 'Add Seasonal Rate'}
      </h4>

      <Input
        label="Season Name *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="e.g., Peak Season, Summer Holidays"
        required
        fullWidth
      />

      <div className="grid grid-cols-2 gap-4">
        <DateInput
          label="Start Date"
          value={formData.start_date}
          onChange={(value) => setFormData({ ...formData, start_date: value })}
          required
          placeholder="Select start date"
        />
        <DateInput
          label="End Date"
          value={formData.end_date}
          onChange={(value) => setFormData({ ...formData, end_date: value })}
          required
          placeholder="Select end date"
          minDate={formData.start_date ? new Date(formData.start_date) : undefined}
        />
      </div>

      <Input
        label={`Price Per Night (${currency}) *`}
        type="number"
        min={0}
        step={0.01}
        value={formData.price_per_night || ''}
        onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) || 0 })}
        required
        fullWidth
      />

      <Input
        label="Minimum Nights"
        type="number"
        min={1}
        value={formData.min_nights || ''}
        onChange={(e) => setFormData({ ...formData, min_nights: e.target.value ? parseInt(e.target.value) : null })}
        helperText="Override minimum stay for this period"
        fullWidth
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="rate-active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="rate-active" className="text-sm text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {rate ? 'Save Changes' : 'Add Rate'}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// Promotion Editor Modal
// ============================================================================

interface PromotionEditorProps {
  promotion?: PromotionFormData;
  currency: string;
  onSave: (promotion: PromotionFormData) => void;
  onCancel: () => void;
}

const PromotionEditor: React.FC<PromotionEditorProps> = ({
  promotion,
  currency,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PromotionFormData>(
    promotion || {
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_nights: null,
      max_uses: null,
      start_date: null,
      end_date: null,
      is_active: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      code: formData.code.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-dark-sidebar rounded-lg">
      <h4 className="font-medium text-gray-900 dark:text-white">
        {promotion ? 'Edit Promotion' : 'Add Promotion'}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Promo Code *"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="e.g., SUMMER20"
          helperText="Letters and numbers only"
          required
          fullWidth
        />
        <Input
          label="Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Summer Sale"
          required
          fullWidth
        />
      </div>

      <Input
        label="Description"
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Brief description of the promotion"
        fullWidth
      />

      <div className="space-y-4">
        <Select
          label="Discount Type"
          value={formData.discount_type}
          onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed_amount' | 'free_nights' })}
          options={[
            { value: 'percentage', label: 'Percentage (%)' },
            { value: 'fixed_amount', label: `Fixed Amount (${currency})` },
            { value: 'free_nights', label: 'Free Nights' },
          ]}
          helperText={
            formData.discount_type === 'percentage'
              ? 'Discount as percentage off total price'
              : formData.discount_type === 'fixed_amount'
              ? 'Fixed amount discount in currency'
              : 'Number of free nights (e.g., Book 3 Get 1 Free)'
          }
        />
        <Input
          label={
            formData.discount_type === 'percentage'
              ? 'Discount (%) *'
              : formData.discount_type === 'fixed_amount'
              ? `Discount (${currency}) *`
              : 'Number of Free Nights *'
          }
          type="number"
          min={0}
          max={formData.discount_type === 'percentage' ? 100 : undefined}
          step={formData.discount_type === 'free_nights' ? 1 : formData.discount_type === 'percentage' ? 1 : 0.01}
          value={formData.discount_value || ''}
          onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
          helperText={
            formData.discount_type === 'free_nights'
              ? 'e.g., 1 for "Book 3 Get 1 Free"'
              : undefined
          }
          required
          fullWidth
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Minimum Nights"
          type="number"
          min={1}
          value={formData.min_nights || ''}
          onChange={(e) => setFormData({ ...formData, min_nights: e.target.value ? parseInt(e.target.value) : null })}
          helperText="Required stay length to use code"
          fullWidth
        />
        <Input
          label="Maximum Uses"
          type="number"
          min={1}
          value={formData.max_uses || ''}
          onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
          helperText="Leave empty for unlimited"
          fullWidth
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DateInput
          label="Valid From"
          value={formData.start_date || ''}
          onChange={(value) => setFormData({ ...formData, start_date: value || null })}
          placeholder="Select start date"
        />
        <DateInput
          label="Valid Until"
          value={formData.end_date || ''}
          onChange={(value) => setFormData({ ...formData, end_date: value || null })}
          placeholder="Select end date"
          minDate={formData.start_date ? new Date(formData.start_date) : undefined}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="promo-active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="promo-active" className="text-sm text-gray-700 dark:text-gray-300">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {promotion ? 'Save Changes' : 'Add Promotion'}
        </Button>
      </div>
    </form>
  );
};

// ============================================================================
// MarketingStep Component
// ============================================================================

export const MarketingStep: React.FC<MarketingStepProps & { showOnly?: 'seasonal_rates' | 'payment_rules' | 'promotions' }> = memo(({
  data,
  currency,
  onChange,
  onSubmit,
  onBack,
  isLoading,
  showOnly,
}) => {
  const [editingRate, setEditingRate] = useState<SeasonalRateFormData | null>(null);
  const [editingRateIndex, setEditingRateIndex] = useState<number | null>(null);
  const [showRateEditor, setShowRateEditor] = useState(false);

  const [editingPromotion, setEditingPromotion] = useState<PromotionFormData | null>(null);
  const [editingPromotionIndex, setEditingPromotionIndex] = useState<number | null>(null);
  const [showPromotionEditor, setShowPromotionEditor] = useState(false);

  const [editingPaymentRule, setEditingPaymentRule] = useState<PaymentRuleFormData | null>(null);
  const [editingPaymentRuleIndex, setEditingPaymentRuleIndex] = useState<number | null>(null);
  const [showPaymentRuleEditor, setShowPaymentRuleEditor] = useState(false);

  // Memoize currency formatter for performance
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 0,
    });
    return (value: number) => formatter.format(value);
  }, [currency]);

  // Seasonal Rates handlers - wrapped with useCallback to prevent re-creation
  const handleAddRate = useCallback(() => {
    setEditingRate(null);
    setEditingRateIndex(null);
    setShowRateEditor(true);
  }, []);

  const handleEditRate = useCallback((rate: SeasonalRateFormData, index: number) => {
    setEditingRate(rate);
    setEditingRateIndex(index);
    setShowRateEditor(true);
  }, []);

  const handleSaveRate = useCallback((rate: SeasonalRateFormData) => {
    const newRates = [...data.seasonal_rates];
    if (editingRateIndex !== null) {
      newRates[editingRateIndex] = rate;
    } else {
      newRates.push(rate);
    }
    onChange({ ...data, seasonal_rates: newRates });
    setShowRateEditor(false);
    setEditingRate(null);
    setEditingRateIndex(null);
  }, [data, editingRateIndex, onChange]);

  const handleDeleteRate = useCallback((index: number) => {
    onChange({
      ...data,
      seasonal_rates: data.seasonal_rates.filter((_, i) => i !== index),
    });
  }, [data, onChange]);

  const handleCancelRate = useCallback(() => {
    setShowRateEditor(false);
    setEditingRate(null);
    setEditingRateIndex(null);
  }, []);

  // Promotions handlers - wrapped with useCallback
  const handleAddPromotion = useCallback(() => {
    setEditingPromotion(null);
    setEditingPromotionIndex(null);
    setShowPromotionEditor(true);
  }, []);

  const handleEditPromotion = useCallback((promotion: PromotionFormData, index: number) => {
    setEditingPromotion(promotion);
    setEditingPromotionIndex(index);
    setShowPromotionEditor(true);
  }, []);

  const handleSavePromotion = useCallback((promotion: PromotionFormData) => {
    const newPromotions = [...data.promotions];
    if (editingPromotionIndex !== null) {
      newPromotions[editingPromotionIndex] = promotion;
    } else {
      newPromotions.push(promotion);
    }
    onChange({ ...data, promotions: newPromotions });
    setShowPromotionEditor(false);
    setEditingPromotion(null);
    setEditingPromotionIndex(null);
  }, [data, editingPromotionIndex, onChange]);

  const handleDeletePromotion = useCallback((index: number) => {
    onChange({
      ...data,
      promotions: data.promotions.filter((_, i) => i !== index),
    });
  }, [data, onChange]);

  const handleCancelPromotion = useCallback(() => {
    setShowPromotionEditor(false);
    setEditingPromotion(null);
    setEditingPromotionIndex(null);
  }, []);

  // Payment Rules handlers - wrapped with useCallback
  const handleAddPaymentRule = useCallback(() => {
    setEditingPaymentRule(null);
    setEditingPaymentRuleIndex(null);
    setShowPaymentRuleEditor(true);
  }, []);

  const handleEditPaymentRule = useCallback((rule: PaymentRuleFormData, index: number) => {
    setEditingPaymentRule(rule);
    setEditingPaymentRuleIndex(index);
    setShowPaymentRuleEditor(true);
  }, []);

  const handleSavePaymentRule = useCallback((rule: PaymentRuleFormData) => {
    const newRules = [...data.payment_rules];
    if (editingPaymentRuleIndex !== null) {
      newRules[editingPaymentRuleIndex] = rule;
    } else {
      newRules.push(rule);
    }
    onChange({ ...data, payment_rules: newRules });
    setShowPaymentRuleEditor(false);
    setEditingPaymentRule(null);
    setEditingPaymentRuleIndex(null);
  }, [data, editingPaymentRuleIndex, onChange]);

  const handleDeletePaymentRule = useCallback((index: number) => {
    onChange({
      ...data,
      payment_rules: data.payment_rules.filter((_, i) => i !== index),
    });
  }, [data, onChange]);

  const handleCancelPaymentRule = useCallback(() => {
    setShowPaymentRuleEditor(false);
    setEditingPaymentRule(null);
    setEditingPaymentRuleIndex(null);
  }, []);

  // Determine title and description based on showOnly prop
  const getHeaderContent = () => {
    if (showOnly === 'seasonal_rates') {
      return {
        title: 'Seasonal Rates',
        description: 'Configure seasonal pricing to charge different rates during peak and off-peak periods.',
      };
    }
    if (showOnly === 'payment_rules') {
      return {
        title: 'Payment Rules',
        description: 'Define deposit requirements and payment schedules for bookings.',
      };
    }
    if (showOnly === 'promotions') {
      return {
        title: 'Promo Codes',
        description: 'Create promotional codes to offer discounts and special offers to guests.',
      };
    }
    return {
      title: 'Marketing',
      description: 'Configure seasonal rates and promotional codes to attract more bookings.',
    };
  };

  const headerContent = getHeaderContent();
  const shouldShowSeasonalRates = !showOnly || showOnly === 'seasonal_rates';
  const shouldShowPromotions = !showOnly || showOnly === 'promotions';
  const shouldShowPaymentRules = !showOnly || showOnly === 'payment_rules';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{headerContent.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {headerContent.description}
        </p>
      </div>

      {/* Seasonal Rates */}
      {shouldShowSeasonalRates && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Seasonal Rates</h3>
          </div>
          {!showRateEditor && (
            <Button variant="outline" size="sm" onClick={handleAddRate}>
              <HiOutlinePlus className="w-4 h-4 mr-1" />
              Add Season
            </Button>
          )}
        </div>

        {showRateEditor ? (
          <SeasonalRateEditor
            rate={editingRate || undefined}
            currency={currency}
            onSave={handleSaveRate}
            onCancel={handleCancelRate}
          />
        ) : data.seasonal_rates.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No seasonal rates configured. Seasonal rates let you charge different prices during high or low seasons.
          </p>
        ) : (
          <div className="space-y-2">
            {data.seasonal_rates.map((rate, index) => (
              <MarketingFeatureCard
                key={index}
                title={
                  <span className="font-medium text-gray-900 dark:text-white">
                    {rate.name}
                  </span>
                }
                subtitle={`${rate.start_date} to ${rate.end_date} • ${formatCurrency(rate.price_per_night)}/night`}
                isActive={rate.is_active}
                onEdit={() => handleEditRate(rate, index)}
                onDelete={() => handleDeleteRate(index)}
              />
            ))}
          </div>
        )}
      </div>
      )}

      {/* Promotions */}
      {shouldShowPromotions && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineTag className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Promotional Codes</h3>
          </div>
          {!showPromotionEditor && (
            <Button variant="outline" size="sm" onClick={handleAddPromotion}>
              <HiOutlinePlus className="w-4 h-4 mr-1" />
              Add Promo Code
            </Button>
          )}
        </div>

        {showPromotionEditor ? (
          <PromotionEditor
            promotion={editingPromotion || undefined}
            currency={currency}
            onSave={handleSavePromotion}
            onCancel={handleCancelPromotion}
          />
        ) : data.promotions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No promotional codes configured. Create promo codes to offer discounts to guests.
          </p>
        ) : (
          <div className="space-y-2">
            {data.promotions.map((promotion, index) => {
              const discountText = promotion.discount_type === 'percentage'
                ? `${promotion.discount_value}% off`
                : `${formatCurrency(promotion.discount_value)} off`;

              const details = [
                discountText,
                promotion.min_nights ? `Min ${promotion.min_nights} nights` : null,
                promotion.max_uses ? `Max ${promotion.max_uses} uses` : null,
              ].filter(Boolean).join(' • ');

              return (
                <MarketingFeatureCard
                  key={index}
                  title={
                    <>
                      <code className="px-2 py-0.5 bg-gray-100 dark:bg-dark-sidebar rounded text-sm font-mono">
                        {promotion.code}
                      </code>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {promotion.name}
                      </span>
                    </>
                  }
                  subtitle={details}
                  isActive={promotion.is_active}
                  onEdit={() => handleEditPromotion(promotion, index)}
                  onDelete={() => handleDeletePromotion(index)}
                />
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Payment Rules */}
      {shouldShowPaymentRules && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineCash className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Payment Rules</h3>
          </div>
          {!showPaymentRuleEditor && (
            <Button variant="outline" size="sm" onClick={handleAddPaymentRule}>
              <HiOutlinePlus className="w-4 h-4 mr-1" />
              Add Payment Rule
            </Button>
          )}
        </div>

        {showPaymentRuleEditor ? (
          <PaymentRuleEditorInline
            rule={editingPaymentRule || undefined}
            onSave={handleSavePaymentRule}
            onCancel={handleCancelPaymentRule}
          />
        ) : data.payment_rules.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No payment rules configured. Payment rules define deposit requirements and payment schedules for bookings.
          </p>
        ) : (
          <div className="space-y-2">
            {data.payment_rules.map((rule, index) => {
              // Build subtitle with rule details
              let subtitle = '';
              if (rule.rule_type === 'deposit') {
                subtitle = `${rule.deposit_amount}${rule.deposit_type === 'percentage' ? '%' : ' ZAR'} deposit at booking, balance ${rule.balance_due === 'on_checkin' ? 'on check-in' : 'before check-in'}`;
              } else if (rule.rule_type === 'payment_schedule') {
                const milestoneCount = rule.schedule_config?.length || 0;
                subtitle = `${milestoneCount} payment milestone${milestoneCount !== 1 ? 's' : ''}`;
              } else if (rule.rule_type === 'flexible') {
                subtitle = 'Flexible payment (no requirements)';
              }

              // Add description if present
              if (rule.description) {
                subtitle = `${rule.description} • ${subtitle}`;
              }

              return (
                <MarketingFeatureCard
                  key={rule.id || index}
                  title={
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rule.rule_name}
                      </span>
                      <Badge variant="info" size="sm">
                        {PAYMENT_RULE_TYPE_LABELS[rule.rule_type]}
                      </Badge>
                      {rule.applies_to_dates && (
                        <Badge variant="warning" size="sm">
                          Seasonal
                        </Badge>
                      )}
                    </div>
                  }
                  subtitle={subtitle}
                  isActive={rule.is_active}
                  onEdit={() => handleEditPaymentRule(rule, index)}
                  onDelete={() => handleDeletePaymentRule(index)}
                />
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onSubmit} isLoading={isLoading}>
          {showOnly === 'promotions' ? 'Save and Activate Room' : showOnly ? 'Continue' : 'Save and Activate Room'}
        </Button>
      </div>
    </div>
  );
});
