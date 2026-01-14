/**
 * ListingDetailsTab Component
 *
 * Displays the guest-facing listing details with 12 sections organized
 * into 4 categories: Essentials, Showcase, Stay Details, and Marketing.
 * Uses AdminDetailLayout for consistent 3-column layout.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AdminDetailLayout } from '@/components/layout/AdminDetailLayout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout';
import {
  Card,
  Input,
  Textarea,
  Select,
  Button,
  Switch,
  GalleryUpload,
  LocationSelector,
  CancellationPolicyEditor,
  PromotionEditor,
} from '@/components/ui';
import type { LocationData } from '@/components/ui';
import { useHashTab } from '@/hooks';
import type { PropertyWithCompany, UpdatePropertyData } from '@/types/property.types';
import { ListingPreviewCard } from './ListingPreviewCard';
import { propertyService } from '@/services/property.service';

// ============================================================================
// CIRCULAR PROGRESS COMPONENT
// ============================================================================

const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
}> = ({ percentage, size = 80, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-dark-border"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

// ============================================================================
// TYPES
// ============================================================================

interface ListingDetailsTabProps {
  property: PropertyWithCompany | null;
  formData: UpdatePropertyData;
  onFieldChange: (field: keyof UpdatePropertyData, value: UpdatePropertyData[keyof UpdatePropertyData]) => void;
  onSave: (sectionName?: string) => Promise<void>;
  isSaving: boolean;
  hasChanges: boolean;
  onCancel: () => void;
  onGalleryUpload: (file: File) => Promise<string>;
  isUploadingGallery?: boolean;
  onFeaturedImageSave?: (url: string) => Promise<void>;
  onUpdate?: () => Promise<void>;
}

type ListingViewType =
  | 'listing-property-type'
  | 'listing-location'
  | 'listing-categories'
  | 'listing-gallery'
  | 'listing-video'
  | 'listing-description'
  | 'listing-highlights'
  | 'listing-check-in-out'
  | 'listing-cancellation'
  | 'listing-amenities'
  | 'listing-house-rules'
  | 'listing-whats-included'
  | 'listing-promotions'
  | 'listing-seo'
  | 'listing-visibility';

// ============================================================================
// CONSTANTS
// ============================================================================

const LISTING_VIEWS = [
  'listing-property-type', 'listing-location', 'listing-categories', 'listing-gallery', 'listing-video', 'listing-description',
  'listing-highlights', 'listing-check-in-out', 'listing-cancellation', 'listing-amenities', 'listing-house-rules',
  'listing-whats-included', 'listing-promotions', 'listing-seo', 'listing-visibility',
] as const;

// Helper to get the next section
const getNextSection = (currentSection: ListingViewType): ListingViewType | null => {
  const currentIndex = LISTING_VIEWS.indexOf(currentSection);
  if (currentIndex === -1 || currentIndex === LISTING_VIEWS.length - 1) {
    return null; // No next section (visibility is last)
  }
  return LISTING_VIEWS[currentIndex + 1];
};

// Property Types
const propertyTypeOptions = [
  { value: '', label: 'Select property type' },
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'guesthouse', label: 'Guest House' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'bnb', label: 'Bed & Breakfast' },
];

// Common Categories
const commonCategories = [
  'Beachfront', 'Mountain view', 'City center', 'Countryside',
  'Pet-friendly', 'Family-friendly', 'Romantic getaway', 'Business travel',
  'Luxury', 'Budget-friendly', 'Eco-friendly', 'Historic',
  'Ski-in/Ski-out', 'Lakefront', 'Poolside', 'Garden view',
];

// Amenity Groups
const amenityGroups = {
  essentials: {
    label: 'Essentials',
    items: ['WiFi', 'Air conditioning', 'Heating', 'Kitchen', 'Washer', 'Dryer', 'Iron', 'Hair dryer'],
  },
  outdoor: {
    label: 'Outdoor',
    items: ['Pool', 'Hot tub', 'BBQ grill', 'Patio', 'Garden', 'Beach access', 'Balcony', 'Deck'],
  },
  safety: {
    label: 'Safety',
    items: ['Smoke alarm', 'Carbon monoxide alarm', 'Fire extinguisher', 'First aid kit', 'Security cameras', 'Safe'],
  },
  parking: {
    label: 'Parking',
    items: ['Free parking', 'Paid parking', 'Garage', 'Street parking', 'EV charger'],
  },
  entertainment: {
    label: 'Entertainment',
    items: ['TV', 'Cable', 'Streaming services', 'Game console', 'Board games', 'Books', 'Sound system'],
  },
  family: {
    label: 'Family',
    items: ['Crib', 'High chair', 'Kids toys', 'Baby monitor', 'Child safety gates'],
  },
};

// Common House Rules
const commonHouseRules = [
  'No smoking',
  'No pets',
  'No parties or events',
  'Quiet hours after 10 PM',
  'Check-in after 3 PM',
  'Check-out before 11 AM',
  'No unregistered guests',
  'Remove shoes indoors',
];

// Common Inclusions
const commonInclusions = [
  'Linens provided',
  'Towels provided',
  'Toiletries',
  'Welcome basket',
  'Coffee/tea',
  'Breakfast included',
  'Airport pickup',
  'Daily cleaning',
  'Concierge service',
  'Bottled water',
];

// ============================================================================
// ICONS
// ============================================================================

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const MapIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChecklistIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const RulesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const GiftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const SEOIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PromotionIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const VisibilityIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const ListingDetailsTab: React.FC<ListingDetailsTabProps> = ({
  property,
  formData,
  onFieldChange,
  onSave,
  isSaving,
  hasChanges,
  onCancel,
  onGalleryUpload,
  isUploadingGallery = false,
  onFeaturedImageSave,
  onUpdate,
}) => {
  // Hash-based section navigation
  const [activeView, setActiveView] = useHashTab(LISTING_VIEWS, 'listing-property-type');

  // Local state for adding new items
  const [newHighlight, setNewHighlight] = useState('');
  const [newHouseRule, setNewHouseRule] = useState('');

  // Listing readiness state
  const [listingReadiness, setListingReadiness] = useState<{
    ready: boolean;
    missing: string[];
  } | null>(null);
  const [isCheckingReadiness, setIsCheckingReadiness] = useState(false);
  const [isTogglingListing, setIsTogglingListing] = useState(false);

  // Fetch listing readiness when property changes or when viewing visibility section
  useEffect(() => {
    if (property?.id && activeView === 'listing-visibility') {
      loadListingReadiness();
    }
  }, [property?.id, activeView]);

  const loadListingReadiness = async () => {
    if (!property?.id) return;

    setIsCheckingReadiness(true);
    try {
      const readiness = await propertyService.checkListingReadiness(property.id);
      setListingReadiness(readiness);
    } catch (error) {
      console.error('Failed to check listing readiness:', error);
    } finally {
      setIsCheckingReadiness(false);
    }
  };

  const handleToggleListing = async () => {
    if (!property?.id) return;

    const newState = !property.is_listed_publicly;

    setIsTogglingListing(true);
    try {
      await propertyService.togglePublicListing(property.id, newState);

      // Refresh property data
      if (onUpdate) {
        await onUpdate();
      }

      // Reload readiness
      await loadListingReadiness();
    } catch (error: any) {
      console.error('Failed to toggle listing:', error);
      alert(error.message || 'Failed to update listing status');
    } finally {
      setIsTogglingListing(false);
    }
  };

  // Save and navigate to next section
  const handleSaveAndNext = async () => {
    try {
      // Call the parent save handler with the current section name
      await onSave(activeView);

      // Navigate to next section (unless we're on visibility, which is last)
      if (activeView !== 'listing-visibility') {
        const nextSection = getNextSection(activeView);
        if (nextSection) {
          // Small delay to let the user see the save success
          setTimeout(() => {
            setActiveView(nextSection);
          }, 300);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
      // Error already handled by parent
    }
  };

  // Section weights based on importance (from documentation)
  const SECTION_WEIGHTS: Record<string, number> = {
    'listing-property-type': 10,
    'listing-location': 15,
    'listing-categories': 10,
    'listing-gallery': 20,
    'listing-video': 0,       // Optional - doesn't affect score
    'listing-description': 15,
    'listing-highlights': 5,
    'listing-check-in-out': 5,
    'listing-cancellation': 5,
    'listing-amenities': 5,
    'listing-house-rules': 5,
    'listing-whats-included': 5,
    'listing-promotions': 0,  // Optional - doesn't affect score
    'listing-seo': 0,         // Not part of core listing
    'listing-visibility': 0,  // Not part of completion score
  };

  // Completion status for each section with specific criteria
  const completionStatus = useMemo((): Record<ListingViewType, boolean> => {
    return {
      // Property Type: must be set
      'listing-property-type': Boolean(formData.property_type),
      // Location: hierarchical selection complete (or lat/lng for backwards compat)
      'listing-location': Boolean(
        (formData.country_id && formData.province_id && formData.city_id) ||
        (formData.location_lat && formData.location_lng)
      ),
      // Categories: at least 1 selected
      'listing-categories': (formData.categories || []).length >= 1,
      // Gallery: 3+ images AND featured image set
      'listing-gallery': (formData.gallery_images || []).length >= 3 && Boolean(property?.featured_image_url),
      // Video: optional (always shows checkmark)
      'listing-video': true,
      // Description: listing_description has 100+ characters
      'listing-description': (formData.listing_description || '').length >= 100,
      // Highlights: 2+ highlights
      'listing-highlights': (formData.highlights || []).length >= 2,
      // Check-in/out: both times set
      'listing-check-in-out': Boolean(formData.check_in_time && formData.check_out_time),
      // Cancellation: policy selected
      'listing-cancellation': Boolean(formData.cancellation_policy),
      // Amenities: 3+ selected
      'listing-amenities': (formData.amenities || []).length >= 3,
      // House Rules: at least 1 set
      'listing-house-rules': (formData.house_rules || []).length >= 1,
      // What's Included: at least 1 set
      'listing-whats-included': (formData.whats_included || []).length >= 1,
      // Promotions: optional (always shows checkmark if not empty)
      'listing-promotions': true, // Always complete since it's optional
      // SEO: optional
      'listing-seo': Boolean(formData.listing_title && formData.listing_description),
      // Visibility: always accessible (not part of completion)
      'listing-visibility': true,
    };
  }, [formData, property?.featured_image_url]);

  // Calculate weighted completion percentage
  const completionPercentage = useMemo(() => {
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const [sectionId, weight] of Object.entries(SECTION_WEIGHTS)) {
      if (weight > 0) {
        totalWeight += weight;
        if (completionStatus[sectionId as ListingViewType]) {
          earnedWeight += weight;
        }
      }
    }

    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  }, [completionStatus]);

  // Navigation sections with completion status
  const navSections: AdminNavSection[] = useMemo(() => [
    {
      title: 'ESSENTIALS',
      items: [
        { id: 'listing-property-type', label: 'Property Type', icon: <BuildingIcon />, isComplete: completionStatus['listing-property-type'] },
        { id: 'listing-location', label: 'Location', icon: <MapIcon />, isComplete: completionStatus['listing-location'] },
        { id: 'listing-categories', label: 'Categories', icon: <TagIcon />, isComplete: completionStatus['listing-categories'] },
      ],
    },
    {
      title: 'SHOWCASE',
      items: [
        { id: 'listing-gallery', label: 'Gallery', icon: <ImageIcon />, isComplete: completionStatus['listing-gallery'] },
        { id: 'listing-video', label: 'Video', icon: <VideoIcon />, isComplete: completionStatus['listing-video'] },
        { id: 'listing-description', label: 'Description', icon: <DocumentIcon />, isComplete: completionStatus['listing-description'] },
        { id: 'listing-highlights', label: 'Highlights', icon: <StarIcon />, isComplete: completionStatus['listing-highlights'] },
      ],
    },
    {
      title: 'STAY DETAILS',
      items: [
        { id: 'listing-check-in-out', label: 'Check-in/out', icon: <ClockIcon />, isComplete: completionStatus['listing-check-in-out'] },
        { id: 'listing-cancellation', label: 'Cancellation', icon: <CalendarIcon />, isComplete: completionStatus['listing-cancellation'] },
        { id: 'listing-amenities', label: 'Amenities', icon: <ChecklistIcon />, isComplete: completionStatus['listing-amenities'] },
        { id: 'listing-house-rules', label: 'House Rules', icon: <RulesIcon />, isComplete: completionStatus['listing-house-rules'] },
        { id: 'listing-whats-included', label: "What's Included", icon: <GiftIcon />, isComplete: completionStatus['listing-whats-included'] },
      ],
    },
    {
      title: 'MARKETING',
      items: [
        { id: 'listing-promotions', label: 'Promotions', icon: <PromotionIcon />, isComplete: completionStatus['listing-promotions'] },
        { id: 'listing-seo', label: 'SEO', icon: <SEOIcon />, isComplete: completionStatus['listing-seo'] },
        { id: 'listing-visibility', label: 'Public Listing', icon: <VisibilityIcon />, isComplete: completionStatus['listing-visibility'] },
      ],
    },
  ], [completionStatus]);

  // Navigation header with completion indicator
  const navHeader = (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded-lg">
      <CircularProgress
        percentage={completionPercentage}
        size={48}
        strokeWidth={4}
      />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Listing Completion
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {Object.values(completionStatus).filter(Boolean).length} of 12 sections
        </p>
      </div>
    </div>
  );

  // Helper to toggle array items
  const toggleArrayItem = useCallback(
    (field: 'categories' | 'amenities' | 'house_rules' | 'whats_included', item: string) => {
      const currentArray = (formData[field] as string[]) || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      onFieldChange(field, newArray);
    },
    [formData, onFieldChange]
  );

  // Helper to add item to array
  const addToArray = useCallback(
    (field: 'highlights' | 'house_rules', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
      if (!value.trim()) return;
      const currentArray = (formData[field] as string[]) || [];
      if (!currentArray.includes(value.trim())) {
        onFieldChange(field, [...currentArray, value.trim()]);
      }
      setter('');
    },
    [formData, onFieldChange]
  );

  // Helper to remove item from array
  const removeFromArray = useCallback(
    (field: 'highlights' | 'house_rules', index: number) => {
      const currentArray = (formData[field] as string[] | undefined) || [];
      onFieldChange(field, currentArray.filter((_, i) => i !== index));
    },
    [formData, onFieldChange]
  );

  // Right sidebar with preview
  const rightSidebar = (
    <div className="space-y-4">
      {/* Public Listing Link Card - Always show if property has a slug */}
      {property?.slug && (
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                property?.is_listed_publicly
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <svg
                  className={`w-5 h-5 ${
                    property?.is_listed_publicly
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {property?.is_listed_publicly ? (
                    <>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </>
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {property?.is_listed_publicly ? 'Your property is live on Vilo' : 'Preview your listing page'}
                </h3>
                {property?.is_listed_publicly && property?.listed_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Listed since: {new Date(property.listed_at).toLocaleDateString()}
                  </p>
                )}
                {!property?.is_listed_publicly && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Not visible to the public yet
                  </p>
                )}
              </div>
            </div>
            <Button
              variant={property?.is_listed_publicly ? "primary" : "outline"}
              className="w-full"
              onClick={() => window.open(`/accommodation/${property?.slug}`, '_blank')}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {property?.is_listed_publicly ? 'View Public Page' : 'Preview Listing Page'}
            </Button>
          </div>
        </Card>
      )}

      {/* Listing Preview Card */}
      <ListingPreviewCard
        property={{
          ...property,
          ...formData,
        }}
        loading={false}
      />
    </div>
  );

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      // ========================================
      // ESSENTIALS
      // ========================================
      case 'listing-property-type':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Property Type
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select the type of property you're listing
                </p>
              </div>

              <Select
                label="Type"
                value={formData.property_type || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onFieldChange('property_type', e.target.value || undefined)
                }
                options={propertyTypeOptions}
                fullWidth
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-location':
        const handleLocationChange = (location: LocationData) => {
          if (location.countryId !== formData.country_id) {
            onFieldChange('country_id', location.countryId);
          }
          if (location.provinceId !== formData.province_id) {
            onFieldChange('province_id', location.provinceId);
          }
          if (location.cityId !== formData.city_id) {
            onFieldChange('city_id', location.cityId);
          }
          if (location.lat !== formData.location_lat) {
            onFieldChange('location_lat', location.lat);
          }
          if (location.lng !== formData.location_lng) {
            onFieldChange('location_lng', location.lng);
          }
        };

        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Location
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set your property's location for guests to find you
                </p>
              </div>

              <LocationSelector
                selectedCountryId={formData.country_id || undefined}
                selectedProvinceId={formData.province_id || undefined}
                selectedCityId={formData.city_id || undefined}
                lat={formData.location_lat || undefined}
                lng={formData.location_lng || undefined}
                onLocationChange={handleLocationChange}
                disabled={isSaving}
                showCoordinates={true}
                helperText="Select your country, province, and city. Coordinates are optional but help with map display."
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-categories':
        const selectedCategoriesCount = (formData.categories || []).length;
        const maxCategories = 3;
        const isMaxCategoriesReached = selectedCategoriesCount >= maxCategories;

        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Categories
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tag your property for search filters (maximum {maxCategories})
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {commonCategories.map((category) => {
                  const isSelected = (formData.categories || []).includes(category);
                  const isDisabled = !isSelected && isMaxCategoriesReached;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleArrayItem('categories', category)}
                      disabled={isDisabled}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : isDisabled
                          ? 'bg-gray-100 dark:bg-dark-card text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              {selectedCategoriesCount > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCategoriesCount} of {maxCategories} categories selected
                  </p>
                  {isMaxCategoriesReached && (
                    <p className="text-xs text-primary font-medium">
                      Maximum reached
                    </p>
                  )}
                </div>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      // ========================================
      // SHOWCASE
      // ========================================
      case 'listing-gallery':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gallery
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload photos of your property. Click the star to set the featured image.
                </p>
              </div>

              <GalleryUpload
                images={formData.gallery_images || []}
                featuredImageUrl={property?.featured_image_url || null}
                onImagesChange={(images) => onFieldChange('gallery_images', images)}
                onFeaturedChange={(url) => onFieldChange('featured_image_url', url)}
                onUpload={onGalleryUpload}
                onFeaturedSave={onFeaturedImageSave}
                maxImages={20}
                isUploading={isUploadingGallery}
                disabled={isSaving}
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-video':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Property Video
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add a YouTube or Vimeo video to showcase your property (optional)
                </p>
              </div>

              <Input
                label="Video URL"
                value={formData.video_url || ''}
                onChange={(e) => onFieldChange('video_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                helperText="Paste a YouTube or Vimeo video URL. The video will be displayed on your listing page."
                fullWidth
              />

              {/* Video Preview */}
              {formData.video_url && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preview
                  </label>
                  <div className="aspect-video bg-gray-100 dark:bg-dark-border rounded-lg overflow-hidden">
                    {(() => {
                      const url = formData.video_url;
                      let embedUrl = '';

                      // YouTube
                      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                      if (youtubeMatch) {
                        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                      }

                      // Vimeo
                      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                      if (vimeoMatch) {
                        embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                      }

                      if (embedUrl) {
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Property video"
                          />
                        );
                      }

                      return (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
                          Invalid video URL. Please use a YouTube or Vimeo link.
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Show Video Toggle */}
              {formData.video_url && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border">
                  <div>
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Display video on property page
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Control whether the video is visible to guests viewing your property
                    </p>
                  </div>
                  <Switch
                    checked={formData.show_video !== false}
                    onCheckedChange={(checked) => onFieldChange('show_video', checked)}
                  />
                </div>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Supported Video Platforms
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>YouTube: https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>Vimeo: https://vimeo.com/VIDEO_ID</li>
                </ul>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-description':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Listing Description
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Write the title and description guests will see
                </p>
              </div>

              <Input
                label="Listing Title"
                value={formData.listing_title || ''}
                onChange={(e) => onFieldChange('listing_title', e.target.value)}
                placeholder="Stunning beachfront villa with ocean views"
                helperText="A catchy title that highlights your property's best features"
                fullWidth
              />

              <Textarea
                label="Listing Description"
                value={formData.listing_description || ''}
                onChange={(e) => onFieldChange('listing_description', e.target.value)}
                placeholder="Describe your property in detail. Include information about the space, the neighborhood, and what makes it special..."
                helperText="This is the main description guests will read when viewing your listing"
                rows={8}
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-highlights':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Highlights
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  List standout features that make your property special
                </p>
              </div>

              {/* Add new highlight */}
              <div className="flex gap-2">
                <Input
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="e.g., Private infinity pool with sunset views"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('highlights', newHighlight, setNewHighlight);
                    }
                  }}
                  fullWidth
                />
                <Button
                  variant="outline"
                  onClick={() => addToArray('highlights', newHighlight, setNewHighlight)}
                  disabled={!newHighlight.trim()}
                >
                  <PlusIcon />
                  <span className="ml-1">Add</span>
                </Button>
              </div>

              {/* List of highlights */}
              {(formData.highlights || []).length > 0 ? (
                <ul className="space-y-2">
                  {(formData.highlights || []).map((highlight, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-card rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <StarIcon />
                        <span className="text-gray-900 dark:text-white">{highlight}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromArray('highlights', index)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No highlights added yet
                </p>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      // ========================================
      // STAY DETAILS
      // ========================================
      case 'listing-check-in-out':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Check-in / Check-out Times
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set your standard check-in and check-out times
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Check-in Time"
                  type="time"
                  value={formData.check_in_time || '15:00'}
                  onChange={(e) => onFieldChange('check_in_time', e.target.value)}
                />
                <Input
                  label="Check-out Time"
                  type="time"
                  value={formData.check_out_time || '11:00'}
                  onChange={(e) => onFieldChange('check_out_time', e.target.value)}
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Standard times:</strong> Most properties use 3:00 PM check-in and 11:00 AM check-out.
                </p>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-cancellation':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cancellation Policy
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose how refunds are handled for cancellations. Clear policies build trust with guests.
                </p>
              </div>

              <CancellationPolicyEditor
                value={formData.cancellation_policy}
                onChange={(policy) => onFieldChange('cancellation_policy', policy)}
                disabled={isSaving}
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-amenities':
        return (
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Amenities
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select all amenities available at your property
                </p>
              </div>

              {Object.entries(amenityGroups).map(([key, group]) => (
                <div key={key}>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {group.label}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((amenity) => {
                      const isSelected = (formData.amenities || []).includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleArrayItem('amenities', amenity)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {(formData.amenities || []).length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(formData.amenities || []).length} amenities selected
                </p>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-house-rules':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  House Rules
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set rules for guests staying at your property
                </p>
              </div>

              {/* Common rules as toggles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Common Rules
                </h4>
                <div className="flex flex-wrap gap-2">
                  {commonHouseRules.map((rule) => {
                    const isSelected = (formData.house_rules || []).includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => toggleArrayItem('house_rules', rule)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {rule}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom rule input */}
              <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Add Custom Rule
                </h4>
                <div className="flex gap-2">
                  <Input
                    value={newHouseRule}
                    onChange={(e) => setNewHouseRule(e.target.value)}
                    placeholder="e.g., No outdoor shoes inside"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addToArray('house_rules', newHouseRule, setNewHouseRule);
                      }
                    }}
                    fullWidth
                  />
                  <Button
                    variant="outline"
                    onClick={() => addToArray('house_rules', newHouseRule, setNewHouseRule)}
                    disabled={!newHouseRule.trim()}
                  >
                    <PlusIcon />
                    <span className="ml-1">Add</span>
                  </Button>
                </div>
              </div>

              {/* Selected rules count */}
              {(formData.house_rules || []).length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(formData.house_rules || []).length} rules set
                </p>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-whats-included':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  What's Included
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Specify what comes with the stay
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {commonInclusions.map((item) => {
                  const isSelected = (formData.whats_included || []).includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleArrayItem('whats_included', item)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-dark-card text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {(formData.whats_included || []).length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(formData.whats_included || []).length} items included
                </p>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      // ========================================
      // MARKETING
      // ========================================
      case 'listing-promotions':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Promotions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create discounts and special offers to attract more bookings
                </p>
              </div>

              <PromotionEditor
                promotions={formData.promotions || []}
                onPromotionsChange={(promotions) => onFieldChange('promotions', promotions)}
                disabled={isSaving}
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-seo':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  SEO Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Optimize your listing for search engines
                </p>
              </div>

              <Input
                label="SEO Title"
                value={formData.listing_title || ''}
                onChange={(e) => onFieldChange('listing_title', e.target.value)}
                placeholder="Stunning Beachfront Villa | 4BR | Cape Town"
                helperText={`${(formData.listing_title || '').length}/60 characters recommended for search engines`}
                maxLength={70}
                fullWidth
              />

              <Textarea
                label="Meta Description"
                value={formData.listing_description || ''}
                onChange={(e) => onFieldChange('listing_description', e.target.value)}
                placeholder="Experience luxury beachfront living in this stunning 4-bedroom villa. Features private pool, ocean views, and modern amenities..."
                helperText={`${(formData.listing_description || '').length}/160 characters recommended for search engines`}
                rows={3}
              />

              <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Search Preview
                </h4>
                <div className="space-y-1">
                  <p className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer">
                    {formData.listing_title || 'Your Property Title'}
                  </p>
                  <p className="text-green-700 dark:text-green-500 text-sm">
                    yoursite.com/properties/{property?.slug || 'property-slug'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {formData.listing_description || 'Add a meta description to see how your listing will appear in search results...'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  SEO Tips
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Include your location and property type in the title</li>
                  <li>Use keywords guests might search for</li>
                  <li>Keep titles under 60 characters for best display</li>
                  <li>Write compelling descriptions under 160 characters</li>
                </ul>
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAndNext}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'listing-visibility':
        const isListed = property?.is_listed_publicly === true;

        return (
          <Card>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Public Listing Visibility
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Control whether your property appears in the public directory
                </p>
              </div>

              {/* Readiness Checklist */}
              <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Recommended for Better Visibility
                  </h4>
                  {isCheckingReadiness ? (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Checking...</span>
                  ) : (
                    <button
                      onClick={loadListingReadiness}
                      className="text-sm text-primary hover:underline"
                    >
                      Refresh
                    </button>
                  )}
                </div>

                {listingReadiness ? (
                  <div className="space-y-2">
                    {listingReadiness.ready ? (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckIcon />
                        <span className="font-medium">All recommendations completed</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          Consider completing these for a better listing:
                        </p>
                        <ul className="space-y-1">
                          {listingReadiness.missing.map((item, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span className="text-gray-400 dark:text-gray-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click refresh to see recommendations
                  </p>
                )}
              </div>

              {/* Toggle Section */}
              <div className="p-4 border border-gray-200 dark:border-dark-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      List Property Publicly
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Make your property visible in the public directory
                    </p>
                  </div>

                  <button
                    onClick={handleToggleListing}
                    disabled={isTogglingListing}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isListed
                        ? 'bg-primary'
                        : 'bg-gray-200 dark:bg-gray-700'
                    } ${
                      isTogglingListing
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isListed ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {listingReadiness && !listingReadiness.ready && isListed && (
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    💡 Tip: Complete the recommendations above to improve your listing's visibility
                  </p>
                )}
              </div>

              {/* Listing Status */}
              {isListed && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckIcon />
                    <span className="text-sm font-medium text-green-900 dark:text-green-300">
                      Your property is live on Vilo
                    </span>
                  </div>

                  {property?.listed_at && (
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Listed since: {new Date(property.listed_at).toLocaleDateString()}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (property?.slug) {
                        window.open(`/accommodation/${property.slug}`, '_blank');
                      }
                    }}
                    disabled={!property?.slug}
                    className="w-full"
                  >
                    View Public Listing →
                  </Button>
                </div>
              )}

              {/* Info Note */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  About Public Listings
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Your property will appear in search results</li>
                  <li>Guests can view details and book directly</li>
                  <li>You can disable listing anytime</li>
                  <li>Only active rooms with availability will be shown</li>
                </ul>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <AdminDetailLayout
      navSections={navSections}
      activeId={activeView}
      onNavChange={(id) => setActiveView(id as ListingViewType)}
      rightSidebar={rightSidebar}
      showRightSidebar
      navHeader={navHeader}
    >
      {renderContent()}
    </AdminDetailLayout>
  );
};

export default ListingDetailsTab;
