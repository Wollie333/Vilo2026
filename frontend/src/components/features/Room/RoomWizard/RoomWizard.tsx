/**
 * RoomWizard Component
 *
 * Multi-step wizard for creating and editing rooms.
 * Uses AdminDetailLayout for consistent design system layout.
 * Consists of 8 steps: Basic Info, Media, Pricing, Booking Rules, Seasonal Rates, Payment Rules, Add-ons, Promo Codes.
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card, Select, Alert, Badge, Button, Spinner } from '@/components/ui';
import { AdminDetailLayout } from '@/components/layout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout/AdminDetailLayout.types';
import {
  HiOutlineInformationCircle,
  HiOutlinePhotograph,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlineCash,
  HiOutlineShoppingBag,
  HiOutlineTag,
} from 'react-icons/hi';
import {
  ROOM_WIZARD_STEPS,
  ROOM_WIZARD_STEP_LABELS,
  RoomWizardStep,
  RoomWizardProps,
  RoomFormData,
  DEFAULT_FORM_DATA,
  roomToFormData,
  formDataToCreateRequest,
  formDataToUpdateRequest,
} from './RoomWizard.types';
import {
  useBedManagement,
  useSeasonalRatesManagement,
  usePromotionsManagement,
  usePaymentRulesManagement,
} from '@/hooks';
import { roomService, addonService } from '@/services';
import type { PaymentRule } from '@/types/payment-rules.types';

// Lazy load step components for better initial load performance
const BasicInfoStep = lazy(() => import('./BasicInfoStep').then(m => ({ default: m.BasicInfoStep })));
const MediaStep = lazy(() => import('./MediaStep').then(m => ({ default: m.MediaStep })));
const PricingStep = lazy(() => import('./PricingStep').then(m => ({ default: m.PricingStep })));
const BookingRulesStep = lazy(() => import('./BookingRulesStep').then(m => ({ default: m.BookingRulesStep })));
const SeasonalRatesStep = lazy(() => import('./SeasonalRatesStep').then(m => ({ default: m.SeasonalRatesStep })));
const PaymentRulesStep = lazy(() => import('./PaymentRulesStep').then(m => ({ default: m.PaymentRulesStep })));
const AddonsStep = lazy(() => import('./AddonsStep').then(m => ({ default: m.AddonsStep })));
const PromoCodesStep = lazy(() => import('./PromoCodesStep').then(m => ({ default: m.PromoCodesStep })));

// Loading fallback for lazy-loaded steps
const StepLoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <Spinner size="md" />
  </div>
);

// ============================================================================
// Step Configuration
// ============================================================================

const STEP_CONFIG = [
  {
    id: 'basic-info',
    step: ROOM_WIZARD_STEPS.BASIC_INFO,
    icon: <HiOutlineInformationCircle className="w-5 h-5" />,
    description: 'Name, capacity, amenities',
  },
  {
    id: 'media',
    step: ROOM_WIZARD_STEPS.MEDIA,
    icon: <HiOutlinePhotograph className="w-5 h-5" />,
    description: 'Photos and gallery',
  },
  {
    id: 'pricing',
    step: ROOM_WIZARD_STEPS.PRICING,
    icon: <HiOutlineCurrencyDollar className="w-5 h-5" />,
    description: 'Rates and pricing model',
  },
  {
    id: 'booking-rules',
    step: ROOM_WIZARD_STEPS.BOOKING_RULES,
    icon: <HiOutlineCalendar className="w-5 h-5" />,
    description: 'Stay duration, inventory',
  },
  {
    id: 'seasonal-rates',
    step: ROOM_WIZARD_STEPS.SEASONAL_RATES,
    icon: <HiOutlineCalendar className="w-5 h-5" />,
    description: 'Peak and off-peak pricing',
  },
  {
    id: 'payment-rules',
    step: ROOM_WIZARD_STEPS.PAYMENT_RULES,
    icon: <HiOutlineCash className="w-5 h-5" />,
    description: 'Deposits and payment schedules',
  },
  {
    id: 'addons',
    step: ROOM_WIZARD_STEPS.ADDONS,
    icon: <HiOutlineShoppingBag className="w-5 h-5" />,
    description: 'Optional booking extras',
  },
  {
    id: 'promo-codes',
    step: ROOM_WIZARD_STEPS.PROMO_CODES,
    icon: <HiOutlineTag className="w-5 h-5" />,
    description: 'Promotional discounts',
  },
];

// ============================================================================
// Property Header Component (for left sidebar nav header)
// ============================================================================

interface PropertyHeaderProps {
  property?: {
    name: string;
    featured_image_url?: string | null;
  };
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property }) => {
  if (!property) return null;

  return (
    <div className="p-3 border-b border-gray-200 dark:border-dark-border">
      <div className="flex items-center gap-3">
        {property.featured_image_url ? (
          <img
            src={property.featured_image_url}
            alt={property.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <HiOutlineHome className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">Property</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {property.name}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Completion Status Component (for right sidebar)
// ============================================================================

interface CompletionStatusProps {
  formData: RoomFormData;
  currentStep: RoomWizardStep;
}

const CompletionStatus: React.FC<CompletionStatusProps> = ({
  formData,
  currentStep,
}) => {
  // Calculate completion for each section
  const checkBasicInfo = () => {
    const { basicInfo } = formData;
    return !!(basicInfo.name && basicInfo.max_guests > 0);
  };

  const checkMedia = () => {
    const { media } = formData;
    return !!(media.featured_image || (media.gallery_images && media.gallery_images.length > 0));
  };

  const checkPricing = () => {
    const { pricing } = formData;
    return pricing.base_price_per_night > 0;
  };

  const checkBookingRules = () => {
    const { bookingRules } = formData;
    return bookingRules.min_nights >= 1;
  };

  const checkSeasonalRates = () => {
    // Seasonal Rates is optional, always consider it complete
    return true;
  };

  const checkPaymentRules = () => {
    // Payment Rules is optional, always consider it complete
    return true;
  };

  const checkAddons = () => {
    // Addons is optional, always consider it complete
    return true;
  };

  const checkPromoCodes = () => {
    // Promo Codes is optional, always consider it complete
    return true;
  };

  const sections = [
    { label: 'Basic Info', complete: checkBasicInfo(), step: ROOM_WIZARD_STEPS.BASIC_INFO },
    { label: 'Media', complete: checkMedia(), step: ROOM_WIZARD_STEPS.MEDIA },
    { label: 'Pricing', complete: checkPricing(), step: ROOM_WIZARD_STEPS.PRICING },
    { label: 'Booking Rules', complete: checkBookingRules(), step: ROOM_WIZARD_STEPS.BOOKING_RULES },
    { label: 'Seasonal Rates', complete: checkSeasonalRates(), step: ROOM_WIZARD_STEPS.SEASONAL_RATES },
    { label: 'Payment Rules', complete: checkPaymentRules(), step: ROOM_WIZARD_STEPS.PAYMENT_RULES },
    { label: 'Add-ons', complete: checkAddons(), step: ROOM_WIZARD_STEPS.ADDONS },
    { label: 'Promo Codes', complete: checkPromoCodes(), step: ROOM_WIZARD_STEPS.PROMO_CODES },
  ];

  const totalRequired = 4; // Last 4 steps (Seasonal Rates, Payment Rules, Add-ons, Promo Codes) are optional
  const requiredComplete = sections.slice(0, 4).filter(s => s.complete).length;
  const progressPercent = Math.round((requiredComplete / totalRequired) * 100);

  return (
    <div className="space-y-4">
      {/* Progress Card */}
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
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {requiredComplete} of {totalRequired} required sections complete
            </p>
          </div>

          {/* Section Checklist */}
          <div className="space-y-2">
            {sections.map((section, index) => (
              <div
                key={section.label}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  currentStep === section.step
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50 dark:hover:bg-dark-card'
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  section.complete
                    ? 'bg-green-500 text-white'
                    : currentStep === section.step
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-dark-border text-gray-500'
                }`}>
                  {section.complete ? (
                    <HiOutlineCheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <span className={`text-sm ${
                  section.complete
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {section.label}
                  {index === 4 && <span className="text-xs ml-1">(optional)</span>}
                </span>
              </div>
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
            <li>• Add at least 3 photos for better visibility</li>
            <li>• Set competitive pricing for your area</li>
            <li>• Enable seasonal rates for peak periods</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================================================
// RoomWizard Component
// ============================================================================

export const RoomWizard: React.FC<RoomWizardProps> = ({
  mode,
  property,
  room,
  properties,
  paymentRules,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  // Initialize form data based on mode
  const initialFormData = useMemo((): RoomFormData => {
    if (mode === 'edit' && room) {
      return {
        property_id: room.property_id,
        ...roomToFormData(room),
      };
    }

    return {
      property_id: property?.id || '',
      ...DEFAULT_FORM_DATA,
      pricing: {
        ...DEFAULT_FORM_DATA.pricing,
        currency: property?.currency || 'ZAR',
      },
    };
  }, [mode, room, property]);

  // State
  const [currentStep, setCurrentStep] = useState<RoomWizardStep>(ROOM_WIZARD_STEPS.BASIC_INFO);
  const [formData, setFormData] = useState<RoomFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(mode === 'edit' && room ? room.id : null);
  const [isSaving, setIsSaving] = useState(false);

  // Management hooks - stateless utilities (will use room ID or createdRoomId)
  const effectiveRoomId = mode === 'edit' ? room?.id : createdRoomId ?? undefined;
  const effectivePropertyId = mode === 'edit' ? room?.property_id : formData.property_id || undefined;
  const bedManagement = useBedManagement(effectiveRoomId);
  const seasonalRatesManagement = useSeasonalRatesManagement(effectiveRoomId);
  const promotionsManagement = usePromotionsManagement(effectiveRoomId);
  const paymentRulesManagement = usePaymentRulesManagement(effectiveRoomId, effectivePropertyId);

  // Payment rules state (passed as prop to avoid duplicate fetch)
  const [originalPaymentRules, setOriginalPaymentRules] = useState<PaymentRule[]>([]);

  // Initialize payment rules from prop on mount or when prop changes
  useEffect(() => {
    if (mode === 'edit' && paymentRules) {
      setOriginalPaymentRules(paymentRules);

      // Update form data with payment rules
      setFormData(prev => ({
        ...prev,
        marketing: {
          ...prev.marketing,
          payment_rules: paymentRules.map(rule => {
            // Base fields common to all rule types
            const baseRule = {
              id: rule.id,
              rule_name: rule.rule_name,
              description: rule.description ?? '',
              rule_type: rule.rule_type,
              schedule_config: rule.schedule_config ?? [],
              allowed_payment_methods: rule.allowed_payment_methods ?? [],
              is_active: rule.is_active,
              applies_to_dates: rule.applies_to_dates,
              start_date: rule.start_date ?? '',
              end_date: rule.end_date ?? '',
              priority: rule.priority ?? 0,
            };

            // Add deposit fields ONLY for deposit rules
            if (rule.rule_type === 'deposit') {
              return {
                ...baseRule,
                deposit_type: rule.deposit_type ?? 'percentage',
                deposit_amount: rule.deposit_amount ?? 0,
                deposit_due: rule.deposit_due ?? 'at_booking',
                deposit_due_days: rule.deposit_due_days ?? 0,
                balance_due: rule.balance_due ?? 'on_checkin',
                balance_due_days: rule.balance_due_days ?? 0,
              };
            }

            // For payment_schedule and flexible rules, return base only
            return baseRule;
          }),
        },
      }));
    }
  }, [mode, paymentRules]);

  // Load add-on assignments in edit mode
  useEffect(() => {
    const loadRoomAddons = async () => {
      if (mode === 'edit' && room) {
        try {
          const addons = await addonService.getAddOnsForRoom(room.id, room.property_id);
          const addonIds = addons.map(a => a.id);

          setFormData(prev => ({
            ...prev,
            addonIds,
          }));
        } catch (err) {
          console.error('Failed to load room add-ons:', err);
        }
      }
    };

    loadRoomAddons();
  }, [mode, room]);

  // Get the selected property for display
  const selectedProperty = useMemo(() => {
    if (property) return property;
    if (properties && formData.property_id) {
      return properties.find((p) => p.id === formData.property_id);
    }
    return undefined;
  }, [property, properties, formData.property_id]);

  // Check if each step has been started/completed
  const getStepStatus = (step: RoomWizardStep): boolean => {
    switch (step) {
      case ROOM_WIZARD_STEPS.BASIC_INFO:
        return !!(formData.basicInfo.name && formData.basicInfo.max_guests > 0);
      case ROOM_WIZARD_STEPS.MEDIA:
        return !!(formData.media.featured_image || formData.media.gallery_images?.length);
      case ROOM_WIZARD_STEPS.PRICING:
        return formData.pricing.base_price_per_night > 0;
      case ROOM_WIZARD_STEPS.BOOKING_RULES:
        return formData.bookingRules.min_nights >= 1;
      case ROOM_WIZARD_STEPS.SEASONAL_RATES:
        return true; // Optional
      case ROOM_WIZARD_STEPS.PAYMENT_RULES:
        return true; // Optional
      case ROOM_WIZARD_STEPS.ADDONS:
        return true; // Optional
      case ROOM_WIZARD_STEPS.PROMO_CODES:
        return true; // Optional
      default:
        return false;
    }
  };

  // Step-specific success messages
  const getStepSuccessMessage = (step: RoomWizardStep): string => {
    const messages: Record<RoomWizardStep, string> = {
      [ROOM_WIZARD_STEPS.BASIC_INFO]: 'Basic information saved',
      [ROOM_WIZARD_STEPS.MEDIA]: 'Room media saved',
      [ROOM_WIZARD_STEPS.PRICING]: 'Pricing settings saved',
      [ROOM_WIZARD_STEPS.BOOKING_RULES]: 'Booking rules saved',
      [ROOM_WIZARD_STEPS.SEASONAL_RATES]: 'Seasonal rates saved',
      [ROOM_WIZARD_STEPS.PAYMENT_RULES]: 'Payment rules saved',
      [ROOM_WIZARD_STEPS.ADDONS]: 'Add-ons saved',
      [ROOM_WIZARD_STEPS.PROMO_CODES]: 'Promotional codes saved',
    };
    return messages[step] || 'Step saved successfully';
  };

  // Step navigation
  const goToStep = (step: RoomWizardStep) => {
    setCurrentStep(step);
    setError(null);
    setSuccess(null);
  };

  /**
   * Save current step data before navigating to next step
   * Saves in both CREATE and EDIT modes to ensure data is persisted
   */
  const saveCurrentStep = async (): Promise<boolean> => {
    try {
      setIsSaving(true);
      setError(null);

      if (!createdRoomId && mode === 'create') {
        // First step in create mode - create the room
        const createRequest = formDataToCreateRequest(formData);
        const createdRoom = await roomService.createRoom(createRequest);

        if (createdRoom && createdRoom.id) {
          setCreatedRoomId(createdRoom.id);
        }
      } else if (createdRoomId && mode === 'create') {
        // In create mode after room exists, update it as we go
        const updateRequest = formDataToUpdateRequest(formData);
        await roomService.updateRoom(createdRoomId, updateRequest);

        // Also save management data (beds, rates, etc.) for this step in CREATE mode
        if (currentStep === ROOM_WIZARD_STEPS.BASIC_INFO) {
          await bedManagement.saveBeds(formData.basicInfo.beds, []);
        } else if (currentStep === ROOM_WIZARD_STEPS.SEASONAL_RATES) {
          await seasonalRatesManagement.saveSeasonalRates(formData.marketing.seasonal_rates, []);
        } else if (currentStep === ROOM_WIZARD_STEPS.PAYMENT_RULES) {
          await paymentRulesManagement.savePaymentRules(formData.marketing.payment_rules, originalPaymentRules);
        } else if (currentStep === ROOM_WIZARD_STEPS.PROMO_CODES) {
          await promotionsManagement.savePromotions(formData.marketing.promotions, []);
        } else if (currentStep === ROOM_WIZARD_STEPS.ADDONS) {
          await addonService.syncRoomAddons(createdRoomId, formData.addonIds);
        }
      } else if (mode === 'edit' && room?.id) {
        // In edit mode, save the current step data
        const updateRequest = formDataToUpdateRequest(formData);
        await roomService.updateRoom(room.id, updateRequest);

        // Also save management data (beds, rates, etc.) for this step
        if (currentStep === ROOM_WIZARD_STEPS.BASIC_INFO) {
          await bedManagement.saveBeds(formData.basicInfo.beds, room.beds);
        } else if (currentStep === ROOM_WIZARD_STEPS.SEASONAL_RATES) {
          await seasonalRatesManagement.saveSeasonalRates(formData.marketing.seasonal_rates, room.seasonal_rates);
        } else if (currentStep === ROOM_WIZARD_STEPS.PAYMENT_RULES) {
          await paymentRulesManagement.savePaymentRules(formData.marketing.payment_rules, originalPaymentRules);
        } else if (currentStep === ROOM_WIZARD_STEPS.PROMO_CODES) {
          await promotionsManagement.savePromotions(formData.marketing.promotions, room.promotions);
        } else if (currentStep === ROOM_WIZARD_STEPS.ADDONS) {
          await addonService.syncRoomAddons(room.id, formData.addonIds);
        }
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save step';
      setError(message);
      console.error('Save step error:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < ROOM_WIZARD_STEPS.PROMO_CODES) {
      // Always save current step before navigating (both create and edit modes)
      const saved = await saveCurrentStep();
      if (saved) {
        // Show step-specific success message
        setSuccess(getStepSuccessMessage(currentStep));
        // Navigate to next step after a short delay to show the success message
        setTimeout(() => {
          setSuccess(null);
          goToStep((currentStep + 1) as RoomWizardStep);
        }, 1500);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > ROOM_WIZARD_STEPS.BASIC_INFO) {
      goToStep((currentStep - 1) as RoomWizardStep);
    }
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (mode === 'create') {
        // Room is already created in earlier steps (createdRoomId exists)
        // Sync add-on assignments
        if (createdRoomId && formData.addonIds.length > 0) {
          await addonService.syncRoomAddons(createdRoomId, formData.addonIds);
        }

        // Room was already created during step progression
        // Pass the existing room ID to parent (via a special property)
        const createRequest = formDataToCreateRequest(formData);
        // Add existingRoomId to the request so parent knows not to create again
        (createRequest as any).existingRoomId = createdRoomId;
        await onSubmit(createRequest);
      } else {
        // Edit mode: Run management saves AND room update in parallel for faster performance
        const updateRequest = formDataToUpdateRequest(formData);

        await Promise.all([
          // Management operations (beds, rates, promotions, payment rules, add-ons)
          Promise.all([
            bedManagement.saveBeds(formData.basicInfo.beds, room!.beds),
            seasonalRatesManagement.saveSeasonalRates(formData.marketing.seasonal_rates, room!.seasonal_rates),
            promotionsManagement.savePromotions(formData.marketing.promotions, room!.promotions),
            paymentRulesManagement.savePaymentRules(formData.marketing.payment_rules, originalPaymentRules),
            addonService.syncRoomAddons(room!.id, formData.addonIds),
          ]),
          // Room base data update (runs in parallel with management operations)
          onSubmit(updateRequest),
        ]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save room';
      setError(message);
      // Don't re-throw - parent will handle via its own try/catch
    } finally {
      setSubmitting(false);
    }
  };

  // Property selector (only in create mode without pre-selected property)
  const showPropertySelector = mode === 'create' && !property && properties && properties.length > 1;

  // Memoize navigation sections to prevent unnecessary recalculations
  // Only depends on fields that affect step completion status
  const navSections: AdminNavSection[] = useMemo(() => [
    {
      title: 'ROOM SETUP',
      items: STEP_CONFIG.map((config) => ({
        id: config.id,
        label: ROOM_WIZARD_STEP_LABELS[config.step],
        icon: config.icon,
        isComplete: getStepStatus(config.step),
      })),
    },
  ], [
    formData.basicInfo.name,
    formData.basicInfo.max_guests,
    formData.media.featured_image,
    formData.media.gallery_images?.length,
    formData.pricing.base_price_per_night,
    formData.bookingRules.min_nights,
  ]);

  // Map step ID to step number (static, defined outside render)
  const stepIdToNumber = useMemo(() => ({
    'basic-info': ROOM_WIZARD_STEPS.BASIC_INFO,
    'media': ROOM_WIZARD_STEPS.MEDIA,
    'pricing': ROOM_WIZARD_STEPS.PRICING,
    'booking-rules': ROOM_WIZARD_STEPS.BOOKING_RULES,
    'seasonal-rates': ROOM_WIZARD_STEPS.SEASONAL_RATES,
    'payment-rules': ROOM_WIZARD_STEPS.PAYMENT_RULES,
    'addons': ROOM_WIZARD_STEPS.ADDONS,
    'promo-codes': ROOM_WIZARD_STEPS.PROMO_CODES,
  } as Record<string, RoomWizardStep>), []);

  const currentStepId = useMemo(
    () => STEP_CONFIG.find(s => s.step === currentStep)?.id || 'basic-info',
    [currentStep]
  );

  // Render current step content
  const renderStep = () => {
    const stepConfig = STEP_CONFIG.find(s => s.step === currentStep);

    return (
      <div className="space-y-6">
        {/* Step Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
          <div className="p-3 bg-primary/10 rounded-xl">
            {stepConfig?.icon && React.cloneElement(stepConfig.icon as React.ReactElement, {
              className: 'w-6 h-6 text-primary'
            })}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ROOM_WIZARD_STEP_LABELS[currentStep]}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stepConfig?.description}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="default" size="sm">
              Step {currentStep} of 8
            </Badge>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Card variant="bordered">
          <Card.Body className="p-6">
            <Suspense fallback={<StepLoadingFallback />}>
              {(() => {
                switch (currentStep) {
                  case ROOM_WIZARD_STEPS.BASIC_INFO:
                    return (
                      <BasicInfoStep
                        data={formData.basicInfo}
                        onChange={(basicInfo) => setFormData({ ...formData, basicInfo })}
                        onNext={handleNext}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.MEDIA:
                    return (
                      <MediaStep
                        data={formData.media}
                        roomId={createdRoomId || (mode === 'edit' ? room?.id : undefined)}
                        onChange={(media) => setFormData({ ...formData, media })}
                        onNext={handleNext}
                        onBack={handleBack}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.PRICING:
                    return (
                      <PricingStep
                        data={formData.pricing}
                        currency={selectedProperty?.currency || 'ZAR'}
                        onChange={(pricing) => setFormData({ ...formData, pricing })}
                        onNext={handleNext}
                        onBack={handleBack}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.BOOKING_RULES:
                    return (
                      <BookingRulesStep
                        data={formData.bookingRules}
                        onChange={(bookingRules) => setFormData({ ...formData, bookingRules })}
                        onNext={handleNext}
                        onBack={handleBack}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.SEASONAL_RATES:
                    return (
                      <SeasonalRatesStep
                        data={formData.marketing}
                        currency={formData.pricing.currency || selectedProperty?.currency || 'ZAR'}
                        onChange={(marketing) => setFormData({ ...formData, marketing })}
                        onNext={handleNext}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.PAYMENT_RULES:
                    return (
                      <PaymentRulesStep
                        data={formData.marketing}
                        currency={formData.pricing.currency || selectedProperty?.currency || 'ZAR'}
                        propertyId={formData.property_id}
                        roomId={createdRoomId || (mode === 'edit' ? room?.id : undefined)}
                        onChange={(marketing) => setFormData({ ...formData, marketing })}
                        onNext={handleNext}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.ADDONS:
                    return (
                      <AddonsStep
                        propertyId={formData.property_id}
                        currency={formData.pricing.currency || selectedProperty?.currency || 'ZAR'}
                        selectedAddonIds={formData.addonIds}
                        onChange={(addonIds) => setFormData({ ...formData, addonIds })}
                        onNext={handleNext}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  case ROOM_WIZARD_STEPS.PROMO_CODES:
                    return (
                      <PromoCodesStep
                        data={formData.marketing}
                        currency={formData.pricing.currency || selectedProperty?.currency || 'ZAR'}
                        onChange={(marketing) => setFormData({ ...formData, marketing })}
                        onSubmit={handleSubmit}
                        isLoading={isLoading || submitting || isSaving}
                      />
                    );

                  default:
                    return null;
                }
              })()}
            </Suspense>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Memoize left sidebar nav header (property info with thumbnail)
  const navHeader = useMemo(
    () => selectedProperty ? <PropertyHeader property={selectedProperty} /> : null,
    [selectedProperty]
  );

  // Memoize right sidebar content (completion status)
  const rightSidebar = useMemo(
    () => <CompletionStatus formData={formData} currentStep={currentStep} />,
    [formData, currentStep]
  );

  // If property needs to be selected first
  if (showPropertySelector && !formData.property_id) {
    return (
      <Card variant="bordered">
        <Card.Header>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Property
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose which property this room belongs to
          </p>
        </Card.Header>
        <Card.Body className="p-6">
          <Select
            label="Property"
            value={formData.property_id}
            onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
            options={[
              { value: '', label: 'Select a property...' },
              ...properties!.map((p) => ({ value: p.id, label: p.name })),
            ]}
            required
          />
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <AdminDetailLayout
      navSections={navSections}
      activeId={currentStepId}
      onNavChange={(id) => goToStep(stepIdToNumber[id])}
      navHeader={navHeader}
      rightSidebar={rightSidebar}
      showRightSidebar={true}
      variant="wide-content"
    >
      {renderStep()}
    </AdminDetailLayout>
  );
};
