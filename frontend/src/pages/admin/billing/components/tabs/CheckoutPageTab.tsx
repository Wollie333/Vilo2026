/**
 * CheckoutPageTab Component
 *
 * Tab for customizing individual plan checkout pages (/plans/:slug)
 * Allows super admin to customize headlines, features, CTAs, and branding
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

interface CheckoutPageTabProps {
  formData: PlanFormData;
  onChange: (data: Partial<PlanFormData>) => void;
}

export const CheckoutPageTab: React.FC<CheckoutPageTabProps> = ({ formData, onChange }) => {
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
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Customize how this plan appears on its individual checkout page at{' '}
          <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">
            /plans/{formData.slug || ':slug'}
          </code>
        </p>
      </div>

      {/* URL Slug */}
      <div>
        <Input
          label="URL Slug"
          value={formData.slug}
          onChange={(e) => {
            // Auto-format: lowercase, alphanumeric and hyphens only
            const formatted = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, '');
            onChange({ slug: formatted });
          }}
          placeholder="starter-plan"
          helperText="URL-friendly identifier (lowercase letters, numbers, and hyphens only)"
          required
        />
      </div>

      {/* Custom Headline */}
      <div>
        <Input
          label="Custom Headline"
          value={formData.custom_headline}
          onChange={(e) => onChange({ custom_headline: e.target.value })}
          placeholder="Start Growing Your Business Today"
          helperText="Optional: Override the display name with a custom headline"
        />
      </div>

      {/* Custom Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Custom Description
        </label>
        <textarea
          value={formData.custom_description}
          onChange={(e) => onChange({ custom_description: e.target.value })}
          placeholder="Perfect for small teams getting started with vacation rental management..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md
                     bg-white dark:bg-dark-card text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Optional: Detailed description for the checkout page
        </p>
      </div>

      {/* Custom Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Custom Features List
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Optional: Add custom features to display. If empty, features will be auto-generated from plan
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
      <div>
        <Input
          label="CTA Button Text"
          value={formData.custom_cta_text}
          onChange={(e) => onChange({ custom_cta_text: e.target.value })}
          placeholder="Get Started"
          helperText="Text shown on the main call-to-action button"
        />
      </div>

      {/* Checkout Badge */}
      <div>
        <Input
          label="Badge Text"
          value={formData.checkout_badge}
          onChange={(e) => onChange({ checkout_badge: e.target.value })}
          placeholder="Most Popular"
          helperText="Optional: Display a badge at the top (e.g., 'Most Popular', 'Best Value')"
        />
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
              // Validate hex color format
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
  );
};
