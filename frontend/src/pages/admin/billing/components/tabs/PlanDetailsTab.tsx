/**
 * PlanDetailsTab Component
 *
 * Combines basic plan information with checkout page customization
 * for a more intuitive editing experience.
 */

import React, { useState } from 'react';
import { Input, Button } from '@/components/ui';
import type { PlanFormData } from '../SubscriptionPlansTab';

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface PlanDetailsTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
  isCreate: boolean;
}

export const PlanDetailsTab: React.FC<PlanDetailsTabProps> = ({
  formData,
  onChange,
  isCreate,
}) => {
  const [newFeature, setNewFeature] = useState('');

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      onChange({
        custom_features: [...formData.custom_features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    onChange({
      custom_features: formData.custom_features.filter((_, i) => i !== index),
    });
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/plans/${formData.slug}`, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Core plan details visible throughout the platform
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isCreate && (
              <div>
                <Input
                  label="Internal Name"
                  value={formData.name}
                  onChange={(e) => {
                    const formatted = e.target.value
                      .toLowerCase()
                      .replace(/[\s-]+/g, '_')
                      .replace(/[^a-z_]/g, '');
                    onChange({ name: formatted });
                  }}
                  placeholder="e.g., starter_plan"
                  helperText="Unique identifier (lowercase, underscores only)"
                  required
                />
              </div>
            )}
            <div>
              <Input
                label="Display Name"
                value={formData.display_name}
                onChange={(e) => onChange({ display_name: e.target.value })}
                placeholder="e.g., Starter Plan"
                helperText="Public name shown to users"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief description of this plan"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Internal description for admin reference
            </p>
          </div>

          {/* Status Toggle (Edit mode only) */}
          {!isCreate && (
            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Plan Status</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Inactive plans are hidden from public pages
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ is_active: !formData.is_active })}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                    border-2 border-transparent transition-colors duration-200 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    ${formData.is_active ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full
                      bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Page Customization Section */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Checkout Page Customization
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Customize how this plan appears on /plans/:slug
          </p>
        </div>
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
              <InfoIcon />
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Individual Checkout Pages</p>
              <p>
                Each plan gets a dedicated URL at{' '}
                <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded font-mono text-xs">
                  /plans/{formData.slug || ':slug'}
                </code>
              </p>
              <p className="mt-1 text-xs">
                These pages are SEO-friendly, shareable, and fully customizable below.
              </p>
            </div>
          </div>

          {/* URL Slug */}
          <div>
            <Input
              label="URL Slug"
              value={formData.slug}
              onChange={(e) => {
                const formatted = e.target.value
                  .toLowerCase()
                  .replace(/[\s_]+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')
                  .replace(/-+/g, '-')
                  .replace(/^-|-$/g, '');
                console.log('🖊️ [PlanDetailsTab] Slug onChange fired');
                console.log('   - Raw input:', e.target.value);
                console.log('   - Formatted value:', formatted);
                console.log('   - Calling onChange with:', { slug: formatted });
                onChange({ slug: formatted });
              }}
              placeholder="starter-plan"
              helperText="URL-friendly identifier (lowercase, numbers, hyphens)"
              required
            />
          </div>

          {/* Custom Headline */}
          <div>
            <Input
              label="Custom Headline"
              value={formData.custom_headline}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('🖊️ [PlanDetailsTab] Custom Headline onChange fired');
                console.log('   - New value:', newValue);
                console.log('   - Old value:', formData.custom_headline);
                console.log('   - Calling onChange with:', { custom_headline: newValue });
                onChange({ custom_headline: newValue });
              }}
              placeholder="Start Growing Your Business Today"
              helperText="Optional: Override display name with a marketing headline"
            />
          </div>

          {/* Custom Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Description
            </label>
            <textarea
              value={formData.custom_description}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log('🖊️ [PlanDetailsTab] Custom Description onChange fired');
                console.log('   - New value:', newValue);
                console.log('   - Calling onChange with:', { custom_description: newValue });
                onChange({ custom_description: newValue });
              }}
              placeholder="Perfect for small teams getting started with vacation rental management..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md
                         bg-white dark:bg-dark-card text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Detailed marketing description for the checkout page
            </p>
          </div>

          {/* Custom Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Features List
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Add custom marketing features. If empty, features will be auto-generated from plan
              limits.
            </p>

            {/* Existing Features */}
            {formData.custom_features.length > 0 && (
              <ul className="space-y-2 mb-3">
                {formData.custom_features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-dark-bg rounded border border-gray-200 dark:border-dark-border"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-1 text-gray-400 hover:text-error transition-colors"
                      title="Remove feature"
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Feature Input */}
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="e.g., Unlimited properties"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <Button variant="outline" onClick={handleAddFeature} disabled={!newFeature.trim()}>
                <PlusIcon />
                <span className="ml-1">Add</span>
              </Button>
            </div>
          </div>

          {/* CTA Button Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="CTA Button Text"
                value={formData.custom_cta_text}
                onChange={(e) => onChange({ custom_cta_text: e.target.value })}
                placeholder="Get Started"
                helperText="Text shown on the main button"
              />
            </div>

            <div>
              <Input
                label="Badge Text"
                value={formData.checkout_badge}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('🖊️ [PlanDetailsTab] Badge Text onChange fired');
                  console.log('   - New value:', newValue);
                  console.log('   - Calling onChange with:', { checkout_badge: newValue });
                  onChange({ checkout_badge: newValue });
                }}
                placeholder="Most Popular"
                helperText="Optional badge (e.g., 'Best Value')"
              />
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.checkout_accent_color}
                onChange={(e) => onChange({ checkout_accent_color: e.target.value })}
                className="h-10 w-20 rounded border border-gray-300 dark:border-dark-border cursor-pointer"
              />
              <Input
                value={formData.checkout_accent_color}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                    onChange({ checkout_accent_color: value });
                  }
                }}
                placeholder="#047857"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Color used for badges and CTA button
            </p>
          </div>

          {/* Preview Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!formData.slug}
              className="w-full sm:w-auto"
            >
              <ExternalLinkIcon />
              <span className="ml-2">Preview Checkout Page</span>
            </Button>
            {!formData.slug && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Add a URL slug to enable preview
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
