/**
 * PropertyPreviewCard Component
 *
 * Displays a preview card for a property with featured image, logo, and key details.
 * Used in the right sidebar of property detail/create pages.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, ImageUpload, Spinner } from '@/components/ui';
import type { PropertyWithCompany } from '@/types/property.types';

// Icons
const BuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
    />
  </svg>
);

const CurrencyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

interface PropertyPreviewCardProps {
  /** Property data */
  property: Partial<PropertyWithCompany> | null;
  /** Whether the card is loading */
  loading?: boolean;
  /** Callback when featured image is uploaded */
  onUploadFeaturedImage?: (file: File) => Promise<void>;
  /** Callback when featured image is deleted */
  onDeleteFeaturedImage?: () => Promise<void>;
  /** Callback when logo is uploaded */
  onUploadLogo?: (file: File) => Promise<void>;
  /** Callback when logo is deleted */
  onDeleteLogo?: () => Promise<void>;
  /** Whether image uploads are in progress */
  isUploadingImage?: boolean;
  /** Show edit mode (with upload buttons) */
  editable?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const PropertyPreviewCard: React.FC<PropertyPreviewCardProps> = ({
  property,
  loading = false,
  onUploadFeaturedImage,
  onDeleteFeaturedImage,
  onUploadLogo,
  onDeleteLogo,
  isUploadingImage = false,
  editable = true,
  className = '',
}) => {
  const navigate = useNavigate();

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get location string
  const getLocationString = () => {
    const parts = [property?.address_city, property?.address_state, property?.address_country].filter(Boolean);
    return parts.join(', ') || 'No location set';
  };

  if (loading) {
    return (
      <Card variant="bordered" className={`overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Preview Card */}
      <Card variant="bordered" className="overflow-hidden">
        {/* Featured Image Banner */}
        <div className="relative h-32 bg-gradient-to-br from-primary to-primary-600">
          {property?.featured_image_url ? (
            <img
              src={property.featured_image_url}
              alt={property.name || 'Property'}
              className="w-full h-full object-cover"
            />
          ) : null}

          {/* Logo positioned at bottom center */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            {editable && onUploadLogo ? (
              <ImageUpload
                value={property?.logo_url}
                onUpload={onUploadLogo}
                onDelete={onDeleteLogo}
                shape="circle"
                size="lg"
                placeholder="Logo"
                loading={isUploadingImage}
                showDelete={!!property?.logo_url}
              />
            ) : property?.logo_url ? (
              <img
                src={property.logo_url}
                alt={`${property.name || 'Property'} logo`}
                className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-dark-card shadow-lg bg-white"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white dark:border-dark-card shadow-lg">
                <BuildingIcon className="w-8 h-8 text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Identity */}
        <div className="pt-12 pb-4 px-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {property?.name || 'New Property'}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant={property?.is_active ? 'success' : 'default'} size="sm">
              {property?.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {property?.slug && (
              <span className="text-sm text-gray-500 dark:text-gray-400">/{property.slug}</span>
            )}
          </div>
          {property?.excerpt && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {property.excerpt}
            </p>
          )}
        </div>
      </Card>

      {/* Featured Image Upload (if editable) */}
      {editable && onUploadFeaturedImage && (
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Featured Image
            </h3>
          </Card.Header>
          <Card.Body>
            <ImageUpload
              value={property?.featured_image_url}
              onUpload={onUploadFeaturedImage}
              onDelete={onDeleteFeaturedImage}
              shape="rectangle"
              size="xl"
              placeholder="Upload a featured image for your property"
              helperText="Recommended size: 1200x630px"
              loading={isUploadingImage}
              showDelete={!!property?.featured_image_url}
            />
          </Card.Body>
        </Card>
      )}

      {/* Property Info Card */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Property Info
          </h3>
        </Card.Header>
        <Card.Body className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 dark:text-gray-500">
              <LocationIcon className="w-4 h-4" />
            </span>
            <span className="text-gray-900 dark:text-white truncate">{getLocationString()}</span>
          </div>
          {property?.email && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 dark:text-gray-500">
                <MailIcon className="w-4 h-4" />
              </span>
              <span className="text-gray-900 dark:text-white truncate">{property.email}</span>
            </div>
          )}
          {property?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 dark:text-gray-500">
                <PhoneIcon className="w-4 h-4" />
              </span>
              <span className="text-gray-900 dark:text-white">{property.phone}</span>
            </div>
          )}
          {property?.website && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 dark:text-gray-500">
                <GlobeIcon className="w-4 h-4" />
              </span>
              <a
                href={property.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {property.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {property?.currency && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 dark:text-gray-500">
                <CurrencyIcon className="w-4 h-4" />
              </span>
              <span className="text-gray-900 dark:text-white">{property.currency}</span>
            </div>
          )}
          {property?.created_at && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-400 dark:text-gray-500">
                <CalendarIcon className="w-4 h-4" />
              </span>
              <span className="text-gray-900 dark:text-white">Created {formatDate(property.created_at)}</span>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Company Link */}
      {property?.company_name && property?.company_id && (
        <Card variant="bordered">
          <Card.Header>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Company
            </h3>
          </Card.Header>
          <Card.Body>
            <button
              onClick={() => navigate(`/companies/${property.company_id}`)}
              className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors text-left"
            >
              {property.company_logo_url ? (
                <img
                  src={property.company_logo_url}
                  alt={property.company_name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <BuildingIcon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{property.company_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View company</p>
              </div>
            </button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};
