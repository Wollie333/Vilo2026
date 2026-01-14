/**
 * PropertyBrandingHeader Component
 *
 * Displays property branding and booking progress on the left sidebar
 */

import React from 'react';
import { HiStar, HiCheckCircle } from 'react-icons/hi';
import type { PropertyBranding, BookingWizardStep } from '@/types/booking-wizard.types';

interface PropertyBrandingHeaderProps {
  property: PropertyBranding;
  steps: BookingWizardStep[];
}

export const PropertyBrandingHeader: React.FC<PropertyBrandingHeaderProps> = ({
  property,
  steps,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Property Image Background */}
      <div className="relative h-64 lg:h-80 overflow-hidden">
        {property.featured_image_url ? (
          <>
            <img
              src={property.featured_image_url}
              alt={property.listing_title || property.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/80 to-gray-950"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-900"></div>
        )}

        {/* Property Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Vilo Verified Badge */}
          <div className="inline-flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-xs">V</span>
            </div>
            Vilo Verified
          </div>

          {/* Property Name */}
          <h1 className="text-2xl font-bold text-white mb-2 line-clamp-2">
            {property.listing_title || property.name}
          </h1>

          {/* Property Type & Location */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-200 mb-2">
            <span className="px-2 py-1 bg-white/20 rounded-md backdrop-blur-sm">
              {property.property_type}
            </span>
            <span>•</span>
            <span>
              {[property.city_name, property.province_name, property.country_name]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>

          {/* Rating */}
          {property.overall_rating != null && (
            <div className="flex items-center gap-1.5">
              <HiStar className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">
                {property.overall_rating.toFixed(1)}
              </span>
              {property.review_count > 0 && (
                <span className="text-gray-300 text-sm">
                  ({property.review_count} {property.review_count === 1 ? 'review' : 'reviews'})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">
            Complete Your Booking
          </h2>
          <p className="text-sm text-gray-400">
            Follow the steps below to reserve your stay
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-start gap-4 ${
                step.isActive
                  ? 'opacity-100'
                  : step.isComplete
                  ? 'opacity-100'
                  : 'opacity-50'
              }`}
            >
              {/* Step Indicator */}
              <div className="flex-shrink-0">
                {step.isComplete ? (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <HiCheckCircle className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step.isActive
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {step.number}
                  </div>
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 pt-1">
                <h3
                  className={`font-semibold ${
                    step.isActive || step.isComplete
                      ? 'text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
