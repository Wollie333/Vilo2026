/**
 * CancellationPolicyForm
 *
 * Shared form component for creating and editing cancellation policies.
 * Uses AdminDetailLayout for consistent styling with other admin forms.
 */

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { Button, Input, Textarea, Alert, Card, Badge, Spinner } from '@/components/ui';
import { AdminDetailLayout } from '@/components/layout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout/AdminDetailLayout.types';
import type { CancellationPolicy, CancellationPolicyTier, CreateCancellationPolicyData } from '@/types/legal.types';
import 'react-quill/dist/quill.snow.css';
import './TermsTab.css'; // Import shared Quill styles

// Lazy load React Quill
const ReactQuill = lazy(() => import('react-quill'));

// ============================================================================
// Types
// ============================================================================

interface CancellationPolicyFormProps {
  mode: 'create' | 'edit';
  policy?: CancellationPolicy | null;
  onSubmit: (data: CreateCancellationPolicyData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormData {
  name: string;
  description: string;
  tiers: CancellationPolicyTier[];
}

type FormSection = 'details' | 'tiers';

// ============================================================================
// Icons
// ============================================================================

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LayersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================================================
// Constants
// ============================================================================

const SECTION_CONFIG = [
  {
    id: 'details' as FormSection,
    label: 'Policy Details',
    icon: <InfoIcon />,
    description: 'Name and description',
  },
  {
    id: 'tiers' as FormSection,
    label: 'Refund Tiers',
    icon: <LayersIcon />,
    description: 'Configure refund percentages',
  },
];

const DEFAULT_TIERS: CancellationPolicyTier[] = [
  { days: 7, refund: 100 },
  { days: 0, refund: 0 },
];

// ============================================================================
// Preview Sidebar Component
// ============================================================================

interface PreviewSidebarProps {
  formData: FormData;
  currentSection: FormSection;
}

const PreviewSidebar: React.FC<PreviewSidebarProps> = ({ formData, currentSection }) => {
  const sortedTiers = [...formData.tiers].sort((a, b) => b.days - a.days);

  const checkDetails = () => !!formData.name.trim();
  const checkTiers = () => formData.tiers.length > 0;

  const sections = [
    { label: 'Policy Details', complete: checkDetails(), id: 'details' as FormSection },
    { label: 'Refund Tiers', complete: checkTiers(), id: 'tiers' as FormSection },
  ];

  const requiredComplete = sections.filter((s) => s.complete).length;
  const totalRequired = 2;
  const progressPercent = Math.round((requiredComplete / totalRequired) * 100);

  return (
    <div className="space-y-4">
      {/* Completion Status */}
      <Card variant="bordered">
        <Card.Header className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Completion Status
            </h3>
            <Badge
              variant={progressPercent === 100 ? 'success' : progressPercent >= 50 ? 'warning' : 'default'}
              size="sm"
            >
              {progressPercent}%
            </Badge>
          </div>
        </Card.Header>
        <Card.Body className="pt-2">
          <div className="mb-4">
            <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {requiredComplete} of {totalRequired} sections complete
            </p>
          </div>

          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.label}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  currentSection === section.id
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-card'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                    section.complete
                      ? 'bg-green-500 text-white'
                      : currentSection === section.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-dark-border text-gray-500'
                  }`}
                >
                  {section.complete ? (
                    <CheckCircleIcon />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-sm ${
                    section.complete
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {section.label}
                </span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Preview Card */}
      <Card variant="bordered">
        <Card.Header className="pb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Preview
            </h3>
          </div>
        </Card.Header>
        <Card.Body className="pt-2">
          {formData.name ? (
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {formData.name}
            </p>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-3">
              No name yet
            </p>
          )}

          {/* Timeline visualization */}
          <div className="flex items-center h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-dark-border">
            {sortedTiers.map((tier, index) => {
              const nextTier = sortedTiers[index + 1];
              const maxDays = 14;
              const startDay = Math.min(tier.days, maxDays);
              const endDay = nextTier?.days ?? 0;
              const width = ((startDay - endDay) / maxDays) * 100;

              if (width <= 0) return null;

              const bgColor =
                tier.refund === 100
                  ? 'bg-green-500'
                  : tier.refund >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500';

              return (
                <div
                  key={index}
                  className={`h-full ${bgColor}`}
                  style={{ width: `${Math.max(width, 5)}%` }}
                  title={`${tier.refund}% refund ${tier.days}+ days before`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            <span>14+ days</span>
            <span>7 days</span>
            <span>Check-in</span>
          </div>

          {/* Tier summary */}
          <div className="mt-3 flex flex-wrap gap-1">
            {sortedTiers.map((tier, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white dark:bg-dark-card text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    tier.refund === 100
                      ? 'bg-green-500'
                      : tier.refund >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
                {tier.days > 0 ? `${tier.days}+d: ${tier.refund}%` : `<1d: ${tier.refund}%`}
              </span>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Quick Tips */}
      <Card variant="gradient">
        <Card.Body className="p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Quick Tips
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Use clear, descriptive policy names</li>
            <li>• Order tiers from most to least lenient</li>
            <li>• Consider guest expectations for refunds</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================================================
// Section Components
// ============================================================================

interface DetailsSectionProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  disabled?: boolean;
}

const DetailsSection: React.FC<DetailsSectionProps> = ({ formData, onChange, disabled }) => (
  <div className="space-y-6">
    <Input
      label="Policy Name"
      value={formData.name}
      onChange={(e) => onChange({ name: e.target.value })}
      placeholder="e.g., Flexible, Moderate, Strict"
      required
      disabled={disabled}
      helperText="Give your policy a clear, recognizable name"
    />

    {/* Rich Text Editor for Description */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Description
        <span className="text-xs text-gray-500 ml-2">(Optional)</span>
      </label>
      <Suspense
        fallback={
          <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
            <Spinner size="sm" />
          </div>
        }
      >
        <div className="quill-wrapper-compact">
          <ReactQuill
            value={formData.description}
            onChange={(content) => onChange({ description: content })}
            theme="snow"
            placeholder="Describe when refunds are available and any conditions... You can paste formatted content from Word!"
            style={{ height: '200px', marginBottom: '50px' }}
            modules={{
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }],
                ['link'],
                ['clean'],
              ],
              clipboard: {
                matchVisual: false,
                matchers: [
                  ['p', (node: any, delta: any) => {
                    const lineHeight = node.style.lineHeight;
                    if (lineHeight) {
                      delta.ops.forEach((op: any) => {
                        if (op.insert && typeof op.insert === 'string') {
                          op.attributes = op.attributes || {};
                          op.attributes.lineHeight = lineHeight;
                        }
                      });
                    }
                    return delta;
                  }],
                ],
              },
            }}
            formats={[
              'header',
              'bold',
              'italic',
              'underline',
              'list',
              'bullet',
              'align',
              'link',
            ]}
          />
        </div>
      </Suspense>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Help guests understand the refund conditions. You can paste formatted content from Microsoft Word.
      </p>
    </div>
  </div>
);

interface TiersSectionProps {
  formData: FormData;
  onChange: (data: Partial<FormData>) => void;
  disabled?: boolean;
}

const TiersSection: React.FC<TiersSectionProps> = ({ formData, onChange, disabled }) => {
  const handleAddTier = () => {
    const maxDays = Math.max(...formData.tiers.map(t => t.days), 0);
    const newDays = maxDays + 7;
    const newTiers = [...formData.tiers, { days: newDays, refund: 100 }].sort((a, b) => b.days - a.days);
    onChange({ tiers: newTiers });
  };

  const handleRemoveTier = (index: number) => {
    if (formData.tiers.length <= 1) return;
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    onChange({ tiers: newTiers });
  };

  const handleTierChange = (index: number, field: 'days' | 'refund', value: number) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    newTiers.sort((a, b) => b.days - a.days);
    onChange({ tiers: newTiers });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Refund Tiers
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Define refund percentages based on days before check-in
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTier}
          leftIcon={<PlusIcon />}
          disabled={disabled}
        >
          Add Tier
        </Button>
      </div>

      <div className="space-y-3">
        {formData.tiers.map((tier, index) => (
          <div
            key={index}
            className="flex items-end gap-3 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border"
          >
            <div className="flex-1">
              <Input
                label="Days before check-in"
                type="number"
                min={0}
                value={tier.days.toString()}
                onChange={(e) => handleTierChange(index, 'days', parseInt(e.target.value) || 0)}
                disabled={disabled}
                fullWidth
              />
            </div>
            <div className="flex-1">
              <div className="relative">
                <Input
                  label="Refund percentage"
                  type="number"
                  min={0}
                  max={100}
                  value={tier.refund.toString()}
                  onChange={(e) => handleTierChange(index, 'refund', parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  fullWidth
                />
                <span className="absolute right-3 top-[38px] text-sm text-gray-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveTier(index)}
              disabled={formData.tiers.length <= 1 || disabled}
              title="Remove tier"
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
            >
              <TrashIcon />
            </Button>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>100% refund</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>50% refund</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>No refund</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const CancellationPolicyForm: React.FC<CancellationPolicyFormProps> = ({
  mode,
  policy,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Initialize form state
  const initialData = useMemo((): FormData => {
    if (mode === 'edit' && policy) {
      return {
        name: policy.name,
        description: policy.description || '',
        tiers: [...policy.tiers].sort((a, b) => b.days - a.days),
      };
    }
    return {
      name: '',
      description: '',
      tiers: [...DEFAULT_TIERS],
    };
  }, [mode, policy]);

  const [currentSection, setCurrentSection] = useState<FormSection>('details');
  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = mode === 'edit';

  // Check section completion
  const getSectionStatus = (section: FormSection): boolean => {
    switch (section) {
      case 'details':
        return !!formData.name.trim();
      case 'tiers':
        return formData.tiers.length > 0;
      default:
        return false;
    }
  };

  // Handle form data changes
  const handleChange = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Validate form
  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Policy name is required';
    }
    if (formData.tiers.length === 0) {
      return 'At least one tier is required';
    }
    for (const tier of formData.tiers) {
      if (tier.days < 0) {
        return 'Days must be 0 or greater';
      }
      if (tier.refund < 0 || tier.refund > 100) {
        return 'Refund percentage must be between 0 and 100';
      }
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        tiers: formData.tiers,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy');
    } finally {
      setIsSaving(false);
    }
  };

  // Build navigation sections
  const navSections: AdminNavSection[] = [
    {
      title: 'POLICY SETUP',
      items: SECTION_CONFIG.map((config) => ({
        id: config.id,
        label: config.label,
        icon: config.icon,
        isComplete: getSectionStatus(config.id),
      })),
    },
  ];

  // Render current section
  const renderSection = () => {
    const sectionConfig = SECTION_CONFIG.find((s) => s.id === currentSection);

    return (
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
          <div className="p-3 bg-primary/10 rounded-xl">
            {sectionConfig?.icon &&
              React.cloneElement(sectionConfig.icon as React.ReactElement, {
                className: 'w-6 h-6 text-primary',
              })}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {sectionConfig?.label}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sectionConfig?.description}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="default" size="sm">
              Section {SECTION_CONFIG.findIndex((s) => s.id === currentSection) + 1} of 2
            </Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Section Content */}
        <Card variant="bordered">
          <Card.Body className="p-6">
            {currentSection === 'details' && (
              <DetailsSection
                formData={formData}
                onChange={handleChange}
                disabled={isLoading}
              />
            )}
            {currentSection === 'tiers' && (
              <TiersSection
                formData={formData}
                onChange={handleChange}
                disabled={isLoading}
              />
            )}
          </Card.Body>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
          <div>
            {currentSection !== 'details' && (
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = SECTION_CONFIG.findIndex((s) => s.id === currentSection);
                  if (currentIndex > 0) {
                    setCurrentSection(SECTION_CONFIG[currentIndex - 1].id);
                  }
                }}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            {currentSection !== 'tiers' ? (
              <Button
                variant="primary"
                onClick={() => {
                  const currentIndex = SECTION_CONFIG.findIndex((s) => s.id === currentSection);
                  if (currentIndex < SECTION_CONFIG.length - 1) {
                    setCurrentSection(SECTION_CONFIG[currentIndex + 1].id);
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSaving || isLoading}
              >
                {isEditing ? 'Save Changes' : 'Create Policy'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Right sidebar
  const rightSidebar = (
    <PreviewSidebar formData={formData} currentSection={currentSection} />
  );

  return (
    <AdminDetailLayout
      navSections={navSections}
      activeId={currentSection}
      onNavChange={(id) => setCurrentSection(id as FormSection)}
      rightSidebar={rightSidebar}
      showRightSidebar={true}
      variant="wide-content"
    >
      {renderSection()}
    </AdminDetailLayout>
  );
};
