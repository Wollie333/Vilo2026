/**
 * PropertyDetailPage Component
 *
 * View and edit property details with 3-column layout and manual save.
 * Matches the UserDetailPage layout pattern.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Globe } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout';
import { AdminDetailLayout } from '@/components/layout/AdminDetailLayout';
import type { AdminNavSection } from '@/components/layout/AdminDetailLayout';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Input,
  Textarea,
  Badge,
  Select,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  PhoneInput,
} from '@/components/ui';
import { useHashTab } from '@/hooks';
import { propertyService, companyService } from '@/services';
import type { PropertyWithCompany, UpdatePropertyData } from '@/types/property.types';
import type { CompanyWithPropertyCount } from '@/types/company.types';
import { PropertyPreviewCard, ListingDetailsTab, PropertyLegalTab, QuoteRequestsManagementTab } from './components';

// Types
type ViewType = 'property-overview' | 'property-info' | 'property-description' | 'property-address' | 'property-contact' | 'property-settings';

// View configuration for hash tab
const PROPERTY_VIEWS = ['property-overview', 'property-info', 'property-description', 'property-address', 'property-contact', 'property-settings'];

// Currency options
const currencyOptions = [
  { value: '', label: 'Inherit from company' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
];

// Icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const CogIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ImagePlaceholderIcon = () => (
  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// Circular Progress Component
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
}> = ({ percentage, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-dark-border"
        />
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Default hash values for each main tab
  const DEFAULT_TAB_HASHES = {
    property: 'property-overview',
    listing: 'listing-property-type',
    legal: 'legal-overview',
    quotes: 'quotes-overview',
  };

  // Helper function to determine main tab from hash
  const getMainTabFromHash = useCallback((hash: string): 'property' | 'listing' | 'legal' | 'quotes' => {
    const cleanHash = hash.replace('#', '');
    if (cleanHash.startsWith('listing-')) return 'listing';
    if (cleanHash.startsWith('legal-')) return 'legal';
    if (cleanHash.startsWith('quotes-')) return 'quotes';
    if (cleanHash.startsWith('property-')) return 'property';
    // Default to property if no prefix or unrecognized hash
    return 'property';
  }, []);

  // Main tab state (property vs listing vs legal vs quotes)
  const [mainTab, setMainTab] = useState<'property' | 'listing' | 'legal' | 'quotes'>(() => {
    return getMainTabFromHash(location.hash);
  });

  // Hash-based tab navigation for property details
  const [activeView, setActiveView] = useHashTab(PROPERTY_VIEWS, 'property-overview');

  // Listen for hash changes to update main tab (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const newMainTab = getMainTabFromHash(window.location.hash);
      if (newMainTab !== mainTab) {
        setMainTab(newMainTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [mainTab, getMainTabFromHash]);

  // Set initial hash if none exists or if it doesn't match any tab prefix
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    const hasValidPrefix = currentHash.startsWith('property-') ||
                           currentHash.startsWith('listing-') ||
                           currentHash.startsWith('legal-') ||
                           currentHash.startsWith('quotes-');

    if (!currentHash || !hasValidPrefix) {
      const newUrl = `${window.location.pathname}${window.location.search}#${DEFAULT_TAB_HASHES.property}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, []);

  // Handler for main tab changes
  const handleMainTabChange = useCallback((newTab: 'property' | 'listing' | 'legal' | 'quotes') => {
    setMainTab(newTab);
    // Update URL hash to default for this tab
    const newUrl = `${window.location.pathname}${window.location.search}#${DEFAULT_TAB_HASHES[newTab]}`;
    window.history.replaceState(null, '', newUrl);
  }, []);

  // State
  const [property, setProperty] = useState<PropertyWithCompany | null>(null);
  const [companies, setCompanies] = useState<CompanyWithPropertyCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdatePropertyData>({});
  const [listingFormData, setListingFormData] = useState<UpdatePropertyData>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [listingHasChanges, setListingHasChanges] = useState(false);
  const [isListingSaving, setIsListingSaving] = useState(false);
  const [originalData, setOriginalData] = useState<UpdatePropertyData>({});
  const [originalListingData, setOriginalListingData] = useState<UpdatePropertyData>({});

  // File input ref for banner image upload
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Fetch property data
  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [propertyData, companiesData] = await Promise.all([
        propertyService.getProperty(id),
        companyService.getMyCompanies({ is_active: true }),
      ]);

      setProperty(propertyData);
      setCompanies(companiesData.companies);
      const initialData = {
        name: propertyData.name,
        slug: propertyData.slug,
        description: propertyData.description || '',
        long_description: propertyData.long_description || '',
        excerpt: propertyData.excerpt || '',
        company_id: propertyData.company_id || '',
        address_street: propertyData.address_street || '',
        address_city: propertyData.address_city || '',
        address_state: propertyData.address_state || '',
        address_postal_code: propertyData.address_postal_code || '',
        address_country: propertyData.address_country || '',
        phone: propertyData.phone || '',
        email: propertyData.email || '',
        website: propertyData.website || '',
        currency: propertyData.currency || '',
        is_active: propertyData.is_active,
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);

      // Set listing form data
      const initialListingData = {
        property_type: propertyData.property_type || '',
        categories: propertyData.categories || [],
        // Location fields
        country_id: propertyData.country_id ?? undefined,
        province_id: propertyData.province_id ?? undefined,
        city_id: propertyData.city_id ?? undefined,
        location_lat: propertyData.location_lat ?? undefined,
        location_lng: propertyData.location_lng ?? undefined,
        listing_title: propertyData.listing_title || '',
        listing_description: propertyData.listing_description || '',
        highlights: propertyData.highlights || [],
        gallery_images: propertyData.gallery_images || [],
        video_url: propertyData.video_url || null,
        show_video: propertyData.show_video !== undefined ? propertyData.show_video : true,
        featured_image_url: propertyData.featured_image_url || null,
        check_in_time: propertyData.check_in_time || '15:00',
        check_out_time: propertyData.check_out_time || '11:00',
        cancellation_policy: propertyData.cancellation_policy || '',
        amenities: propertyData.amenities || [],
        house_rules: propertyData.house_rules || [],
        whats_included: propertyData.whats_included || [],
        promotions: propertyData.promotions || [],
      };
      setListingFormData(initialListingData);
      setOriginalListingData(initialListingData);
      setListingHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle field change (just update state)
  const handleFieldChange = useCallback(
    (field: keyof UpdatePropertyData, value: UpdatePropertyData[keyof UpdatePropertyData]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setHasChanges(true);
    },
    []
  );

  // Handle listing field change (just update state)
  const handleListingFieldChange = useCallback(
    (field: keyof UpdatePropertyData, value: UpdatePropertyData[keyof UpdatePropertyData]) => {
      setListingFormData((prev) => ({ ...prev, [field]: value }));
      setListingHasChanges(true);
    },
    []
  );

  // Handle listing save
  const handleListingSave = useCallback(async (sectionName?: string) => {
    if (!id) return;

    setIsListingSaving(true);
    setError(null);

    try {
      // Clean up the data - remove undefined values and convert empty strings to null for UUIDs
      const cleanedData = { ...listingFormData };

      // Convert empty string UUIDs to null
      if (cleanedData.country_id === '') cleanedData.country_id = undefined;
      if (cleanedData.province_id === '') cleanedData.province_id = undefined;
      if (cleanedData.city_id === '') cleanedData.city_id = undefined;

      await propertyService.updateProperty(id, cleanedData);
      setOriginalListingData(listingFormData);

      // Show section-specific success message
      const sectionMessages: Record<string, string> = {
        'listing-property-type': 'Property type saved',
        'listing-location': 'Location saved',
        'listing-categories': 'Categories saved',
        'listing-gallery': 'Gallery saved',
        'listing-description': 'Listing description saved',
        'listing-highlights': 'Highlights saved',
        'listing-checkin-checkout': 'Check-in/out details saved',
        'listing-cancellation': 'Cancellation policy saved',
        'listing-amenities': 'Amenities saved',
        'listing-house-rules': 'House rules saved',
        'listing-whats-included': "What's included saved",
        'listing-promotions': 'Promotions saved',
        'listing-seo': 'SEO settings saved',
        'listing-visibility': 'Public listing settings saved',
      };

      const successMessage = sectionName && sectionMessages[sectionName]
        ? sectionMessages[sectionName]
        : 'Listing details saved successfully';

      setSuccess(successMessage);
      setListingHasChanges(false);
      // Refresh property data to get updated timestamps and sync state
      const updatedProperty = await propertyService.getProperty(id);
      setProperty(updatedProperty);

      // Update listingFormData with fresh values from server
      const refreshedListingData = {
        property_type: updatedProperty.property_type || '',
        categories: updatedProperty.categories || [],
        country_id: updatedProperty.country_id ?? undefined,
        province_id: updatedProperty.province_id ?? undefined,
        city_id: updatedProperty.city_id ?? undefined,
        location_lat: updatedProperty.location_lat ?? undefined,
        location_lng: updatedProperty.location_lng ?? undefined,
        listing_title: updatedProperty.listing_title || '',
        listing_description: updatedProperty.listing_description || '',
        highlights: updatedProperty.highlights || [],
        gallery_images: updatedProperty.gallery_images || [],
        video_url: updatedProperty.video_url || null,
        show_video: updatedProperty.show_video !== undefined ? updatedProperty.show_video : true,
        featured_image_url: updatedProperty.featured_image_url || null,
        check_in_time: updatedProperty.check_in_time || '15:00',
        check_out_time: updatedProperty.check_out_time || '11:00',
        cancellation_policy: updatedProperty.cancellation_policy || '',
        amenities: updatedProperty.amenities || [],
        house_rules: updatedProperty.house_rules || [],
        whats_included: updatedProperty.whats_included || [],
        promotions: updatedProperty.promotions || [],
      };
      setListingFormData(refreshedListingData);
      setOriginalListingData(refreshedListingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save listing details');
    } finally {
      setIsListingSaving(false);
    }
  }, [id, listingFormData]);

  // Handle listing cancel - reset form to original values
  const handleListingCancel = useCallback(() => {
    setListingFormData(originalListingData);
    setListingHasChanges(false);
  }, [originalListingData]);

  // Handle gallery image upload
  const handleGalleryUpload = useCallback(async (file: File): Promise<string> => {
    if (!id) throw new Error('No property ID');
    setIsUploadingGallery(true);
    try {
      const imageUrl = await propertyService.uploadGalleryImage(id, file);
      setListingHasChanges(true);
      return imageUrl;
    } finally {
      setIsUploadingGallery(false);
    }
  }, [id]);

  // Handle featured image auto-save from gallery
  const handleFeaturedImageSave = useCallback(async (url: string) => {
    if (!id) return;
    try {
      await propertyService.updateProperty(id, { featured_image_url: url });
      // Update local state to reflect saved value
      setListingFormData(prev => ({ ...prev, featured_image_url: url }));
      setOriginalListingData(prev => ({ ...prev, featured_image_url: url }));
      // Update property state
      setProperty(prev => prev ? { ...prev, featured_image_url: url } : prev);
      setSuccess('Featured image updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update featured image');
      throw err; // Re-throw so GalleryUpload can show error
    }
  }, [id]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!id) return;

    setIsSaving(true);
    setError(null);

    try {
      await propertyService.updateProperty(id, formData);
      setOriginalData(formData);
      setSuccess('Property updated successfully');
      setHasChanges(false);
      // Refresh property data to get updated timestamps
      const updatedProperty = await propertyService.getProperty(id);
      setProperty(updatedProperty);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    } finally {
      setIsSaving(false);
    }
  }, [id, formData]);

  // Handle cancel - reset form to original values
  const handleCancel = useCallback(() => {
    setFormData(originalData);
    setHasChanges(false);
  }, [originalData]);

  // Image upload handlers
  const handleUploadFeaturedImage = async (file: File) => {
    if (!id) return;
    setIsUploadingImage(true);
    try {
      const imageUrl = await propertyService.uploadFeaturedImage(id, file);
      setProperty((prev) => (prev ? { ...prev, featured_image_url: imageUrl } : prev));
      setSuccess('Featured image uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteFeaturedImage = async () => {
    if (!id) return;
    setIsUploadingImage(true);
    try {
      await propertyService.deleteFeaturedImage(id);
      setProperty((prev) => (prev ? { ...prev, featured_image_url: null } : prev));
      setSuccess('Featured image deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    if (!id) return;
    setIsUploadingImage(true);
    try {
      const imageUrl = await propertyService.uploadLogo(id, file);
      setProperty((prev) => (prev ? { ...prev, logo_url: imageUrl } : prev));
      setSuccess('Logo uploaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!id) return;
    setIsUploadingImage(true);
    try {
      await propertyService.deleteLogo(id);
      setProperty((prev) => (prev ? { ...prev, logo_url: null } : prev));
      setSuccess('Logo deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete logo');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle banner image file selection
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUploadFeaturedImage(file);
    }
    // Reset input so same file can be selected again
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  // Build company options
  const companyOptions = [
    { value: '', label: 'Select a company' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Completion status for each section
  const completionStatus = useMemo(() => {
    return {
      info: Boolean(formData.name && formData.slug && formData.company_id),
      description: Boolean(formData.description || formData.long_description),
      address: Boolean(formData.address_city && formData.address_country),
      contact: Boolean(formData.email || formData.phone),
      settings: true, // Always complete as it has defaults
      images: Boolean(property?.featured_image_url || property?.logo_url),
    };
  }, [formData, property]);

  // Calculate completion percentage (5 sections)
  const completionPercentage = useMemo(() => {
    const sections = ['info', 'description', 'address', 'contact', 'images'] as const;
    const completed = sections.filter((s) => completionStatus[s]).length;
    return (completed / sections.length) * 100;
  }, [completionStatus]);

  // Navigation sections with completion status
  const navSections: AdminNavSection[] = useMemo(() => [
    {
      title: 'GENERAL',
      items: [{ id: 'property-overview', label: 'Overview', icon: <GridIcon /> }],
    },
    {
      title: 'DETAILS',
      items: [
        { id: 'property-info', label: 'Basic Info', icon: <InfoIcon />, isComplete: completionStatus.info },
        { id: 'property-description', label: 'Description', icon: <DocumentIcon />, isComplete: completionStatus.description },
        { id: 'property-address', label: 'Address', icon: <HomeIcon />, isComplete: completionStatus.address },
        { id: 'property-contact', label: 'Contact', icon: <PhoneIcon />, isComplete: completionStatus.contact },
      ],
    },
    {
      title: 'SETTINGS',
      items: [{ id: 'property-settings', label: 'Status & Config', icon: <CogIcon />, isComplete: completionStatus.settings }],
    },
  ], [completionStatus]);

  // Navigation header with completion indicator
  const navHeader = (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded-lg">
      <CircularProgress percentage={completionPercentage} />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Property Completion
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {Object.values(completionStatus).filter(Boolean).length - 1} of 5 sections
        </p>
      </div>
    </div>
  );

  // Right sidebar with PropertyPreviewCard
  const rightSidebar = (
    <div className="space-y-4">
      {/* Public Listing Link Card */}
      {property?.is_listed_publicly && property?.slug && (
        <Card>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Your property is live on Vilo
                </h3>
                {property?.listed_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Listed since: {new Date(property.listed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="primary"
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
              View Public Page
            </Button>
          </div>
        </Card>
      )}

      {/* Property Preview Card */}
      <PropertyPreviewCard
        property={property}
        loading={loading}
        onUploadFeaturedImage={handleUploadFeaturedImage}
        onDeleteFeaturedImage={handleDeleteFeaturedImage}
        onUploadLogo={handleUploadLogo}
        onDeleteLogo={handleDeleteLogo}
        isUploadingImage={isUploadingImage}
        editable={true}
      />
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout title="Property Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error && !property) {
    return (
      <AuthenticatedLayout title="Property Details" subtitle="Error">
        <div className="max-w-2xl mx-auto">
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
          <Button variant="outline" onClick={() => navigate('/manage/properties')}>
            <ArrowLeftIcon />
            <span className="ml-2">Back to Properties</span>
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!property) {
    return null;
  }

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'property-overview':
        return (
          <div className="space-y-6">
            {/* Featured Image Banner */}
            <div className="relative group">
              {/* Hidden file input */}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerFileChange}
                className="hidden"
              />

              {property.featured_image_url ? (
                // Banner with image
                <div className="relative h-48 sm:h-56 md:h-64 rounded-lg overflow-hidden">
                  <img
                    src={property.featured_image_url}
                    alt={`${property.name} featured image`}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Property name overlay */}
                  <div className="absolute bottom-4 left-4">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      {property.name}
                    </h2>
                    {property.address_city && (
                      <p className="text-white/90 text-sm">
                        {property.address_city}{property.address_country ? `, ${property.address_country}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Action buttons - visible on hover */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                    >
                      <CameraIcon />
                      <span className="ml-2">Change</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleDeleteFeaturedImage}
                      disabled={isUploadingImage}
                      className="bg-white/90 hover:bg-red-50 text-red-600 shadow-lg"
                    >
                      <TrashIcon />
                    </Button>
                  </div>

                  {/* Loading overlay */}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Spinner size="lg" className="text-white" />
                    </div>
                  )}
                </div>
              ) : (
                // Empty state placeholder
                <div
                  className="h-48 sm:h-56 md:h-64 rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-card flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {isUploadingImage ? (
                    <Spinner size="lg" />
                  ) : (
                    <>
                      <ImagePlaceholderIcon />
                      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                        Add a featured image
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        Click to upload a banner image for your property
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          bannerInputRef.current?.click();
                        }}
                      >
                        <CameraIcon />
                        <span className="ml-2">Upload Image</span>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Property Overview
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <Badge variant={property.is_active ? 'success' : 'default'}>
                      {property.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {property.company_name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(property.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Currency</p>
                    <p className="text-gray-900 dark:text-white">
                      {property.currency || 'Inherited from company'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick stats */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Completion Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Basic Info</span>
                    <Badge variant={formData.name && formData.slug ? 'success' : 'warning'} size="sm">
                      {formData.name && formData.slug ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
                    <Badge variant={formData.description || formData.long_description ? 'success' : 'warning'} size="sm">
                      {formData.description || formData.long_description ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Images</span>
                    <Badge variant={property.featured_image_url || property.logo_url ? 'success' : 'warning'} size="sm">
                      {property.featured_image_url || property.logo_url ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address</span>
                    <Badge variant={formData.address_city ? 'success' : 'warning'} size="sm">
                      {formData.address_city ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Contact</span>
                    <Badge variant={formData.email || formData.phone ? 'success' : 'warning'} size="sm">
                      {formData.email || formData.phone ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'property-info':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Basic Information
              </h3>

              <Input
                label="Property Name"
                value={formData.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                required
                fullWidth
              />

              <Input
                label="Slug"
                value={formData.slug || ''}
                onChange={(e) => handleFieldChange('slug', e.target.value)}
                placeholder="property-slug"
                helperText="URL-friendly identifier for the property"
                fullWidth
              />

              <Select
                label="Company"
                value={formData.company_id || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleFieldChange('company_id', e.target.value || undefined)
                }
                options={companyOptions}
                fullWidth
              />

              <Select
                label="Currency"
                value={formData.currency || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleFieldChange('currency', e.target.value || undefined)
                }
                options={currencyOptions}
                helperText="Leave empty to use company's currency"
                fullWidth
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'property-description':
        return (
          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Description
                </h3>

                <Input
                  label="Excerpt"
                  value={formData.excerpt || ''}
                  onChange={(e) => handleFieldChange('excerpt', e.target.value)}
                  placeholder="A short summary for listings and cards"
                  helperText={`${(formData.excerpt || '').length}/500 characters`}
                  maxLength={500}
                  fullWidth
                />

                <Textarea
                  label="Short Description"
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Brief description of your property..."
                  helperText="Used in search results and property cards"
                  rows={3}
                />

                <Textarea
                  label="Full Description"
                  value={formData.long_description || ''}
                  onChange={(e) => handleFieldChange('long_description', e.target.value)}
                  placeholder="Detailed description of your property including amenities, location highlights, and unique features..."
                  helperText="Displayed on the property detail page"
                  rows={8}
                />

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving || !hasChanges}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'property-address':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h3>

              <Input
                label="Street Address"
                value={formData.address_street || ''}
                onChange={(e) => handleFieldChange('address_street', e.target.value)}
                placeholder="123 Main Street"
                fullWidth
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.address_city || ''}
                  onChange={(e) => handleFieldChange('address_city', e.target.value)}
                  placeholder="Cape Town"
                />
                <Input
                  label="State/Province"
                  value={formData.address_state || ''}
                  onChange={(e) => handleFieldChange('address_state', e.target.value)}
                  placeholder="Western Cape"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Postal Code"
                  value={formData.address_postal_code || ''}
                  onChange={(e) => handleFieldChange('address_postal_code', e.target.value)}
                  placeholder="8001"
                />
                <Input
                  label="Country"
                  value={formData.address_country || ''}
                  onChange={(e) => handleFieldChange('address_country', e.target.value)}
                  placeholder="South Africa"
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'property-contact':
        return (
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h3>

              <PhoneInput
                label="Phone"
                value={formData.phone || ''}
                onChange={(value) => handleFieldChange('phone', value)}
                placeholder="+27 21 123 4567"
                defaultCountry="ZA"
              />

              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="bookings@property.com"
                leftIcon={<Mail className="w-5 h-5" />}
                fullWidth
              />

              <Input
                label="Website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                placeholder="https://www.yourproperty.com"
                leftIcon={<Globe className="w-5 h-5" />}
                fullWidth
              />

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSaving}
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'property-settings':
        return (
          <div className="space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Status & Configuration
                </h3>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-dark-border">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Active Status</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Deactivate this property to hide it from listings
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active ?? true}
                    onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
                  />
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving || !hasChanges}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Property Details
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Property ID</span>
                    <code className="bg-gray-100 dark:bg-dark-card px-2 py-1 rounded text-sm">
                      {property.id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Created</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(property.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(property.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout title={property.name} subtitle="Property Details">
      {/* Alerts */}
      {error && (
        <Alert variant="error" className="mb-4" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate('/manage/properties')} className="mb-6">
        <ArrowLeftIcon />
        <span className="ml-2">Back to Properties</span>
      </Button>

      {/* Top-level tabs: Property Details / Listing Details / Legal / Quote Requests */}
      <Tabs value={mainTab} onValueChange={(value) => handleMainTabChange(value as 'property' | 'listing' | 'legal' | 'quotes')}>
        <div className="border-b border-gray-200 dark:border-dark-border mb-6">
          <TabsList variant="underline">
            <TabsTrigger value="property" variant="underline">
              Property Details
            </TabsTrigger>
            <TabsTrigger value="listing" variant="underline">
              Listing Details
            </TabsTrigger>
            <TabsTrigger value="legal" variant="underline">
              Legal
            </TabsTrigger>
            <TabsTrigger value="quotes" variant="underline">
              Quote Requests
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Property Details Tab */}
        <TabsContent value="property" className="mt-0">
          <AdminDetailLayout
            navSections={navSections}
            activeId={activeView}
            onNavChange={(id) => setActiveView(id as ViewType)}
            rightSidebar={rightSidebar}
            navHeader={navHeader}
          >
            {renderContent()}
          </AdminDetailLayout>
        </TabsContent>

        {/* Listing Details Tab */}
        <TabsContent value="listing" className="mt-0">
          <ListingDetailsTab
            property={property}
            formData={listingFormData}
            onFieldChange={handleListingFieldChange}
            onSave={handleListingSave}
            isSaving={isListingSaving}
            hasChanges={listingHasChanges}
            onCancel={handleListingCancel}
            onGalleryUpload={handleGalleryUpload}
            isUploadingGallery={isUploadingGallery}
            onFeaturedImageSave={handleFeaturedImageSave}
            onUpdate={fetchData}
          />
        </TabsContent>

        {/* Legal Tab */}
        <TabsContent value="legal" className="mt-0">
          <PropertyLegalTab propertyId={id!} />
        </TabsContent>

        {/* Quote Requests Tab */}
        <TabsContent value="quotes" className="mt-0">
          <QuoteRequestsManagementTab propertyId={id!} />
        </TabsContent>
      </Tabs>
    </AuthenticatedLayout>
  );
};
