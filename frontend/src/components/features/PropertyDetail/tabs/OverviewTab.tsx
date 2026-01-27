/**
 * OverviewTab Component (Polished Modern Design)
 *
 * Professional, clean design with subtle elevation and great typography
 */

import React, { useState } from 'react';
import {
  HiCheck,
  HiClock,
  HiUsers,
  HiX,
  HiSparkles,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { TermsModal } from '@/components/features';
import type { OverviewTabProps } from './OverviewTab.types';

export const OverviewTab: React.FC<OverviewTabProps> = ({
  description,
  longDescription,
  excerpt,
  videoUrl,
  showVideo,
  highlights,
  amenities,
  houseRules,
  whatsIncluded,
  checkInTime,
  checkOutTime,
  cancellationPolicy,
  cancellationPolicyDetail,
  termsAndConditions,
  propertyName,
  propertyId,
  maxGuests,
}) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const displayDescription = longDescription || description || excerpt;

  // Helper function to extract video embed URL
  const getEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="space-y-8">
      {/* About Section */}
      {displayDescription && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            About this property
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base whitespace-pre-line">
            {displayDescription}
          </p>
        </div>
      )}

      {/* Video Section */}
      {embedUrl && showVideo && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Property video
          </h2>
          <div className="aspect-video bg-gray-100 dark:bg-dark-border rounded-lg overflow-hidden shadow-md">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Property video"
            />
          </div>
        </div>
      )}

      {/* Quick Info Grid */}
      {(checkInTime || checkOutTime || maxGuests) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {checkInTime && (
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <HiClock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Check-in</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{checkInTime}</div>
                </div>
              </div>
            </div>
          )}
          {checkOutTime && (
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <HiClock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Check-out</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">{checkOutTime}</div>
                </div>
              </div>
            </div>
          )}
          {maxGuests && (
            <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                  <HiUsers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Capacity</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">Up to {maxGuests}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HiSparkles className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Property highlights
            </h2>
          </div>
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <HiCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-base text-gray-700 dark:text-gray-300">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Amenities
          </h2>
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
              {amenities.map((amenity, index) => (
                <div key={index} className="flex items-center gap-2">
                  <HiCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-base text-gray-700 dark:text-gray-300">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* What's Included */}
      {whatsIncluded.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            What's included
          </h2>
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {whatsIncluded.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <HiCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-base text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* House Rules */}
      {houseRules.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            House rules
          </h2>
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
            <div className="space-y-3">
              {houseRules.map((rule, index) => (
                <div key={index} className="flex items-start gap-3">
                  <HiX className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-base text-gray-700 dark:text-gray-300">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Policy */}
      {cancellationPolicyDetail && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Cancellation policy
          </h2>
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
            {/* Policy Name */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {cancellationPolicyDetail.name}
            </h3>

            {/* Policy Description */}
            {cancellationPolicyDetail.description && (
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4 whitespace-pre-line">
                {cancellationPolicyDetail.description}
              </p>
            )}

            {/* Policy Tiers */}
            {cancellationPolicyDetail.tiers && cancellationPolicyDetail.tiers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Refund Schedule:
                </h4>
                <ul className="space-y-2">
                  {cancellationPolicyDetail.tiers
                    .sort((a, b) => b.days - a.days)
                    .map((tier, index) => {
                      // Color based on refund percentage
                      const getColorForRefund = (refund: number): string => {
                        if (refund >= 80) return 'bg-green-500';
                        if (refund >= 50) return 'bg-yellow-500';
                        return 'bg-red-500';
                      };

                      return (
                        <li key={index} className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${getColorForRefund(tier.refund)} flex-shrink-0`} />
                          <span className="text-base text-gray-700 dark:text-gray-300">
                            {tier.days > 0 ? (
                              <>
                                <span className="font-medium">{tier.days}+ days</span> before check-in: <span className="font-medium">{tier.refund}%</span> refund
                              </>
                            ) : (
                              <>
                                <span className="font-medium">Less than {Math.abs(tier.days)} days</span> before check-in: <span className="font-medium">{tier.refund}%</span> refund
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {termsAndConditions && propertyName && propertyId && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            Terms & Conditions
          </h2>
          <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-6">
            <p className="text-base text-gray-700 dark:text-gray-300 mb-3">
              Please review our terms and conditions before making a booking.
            </p>
            <button
              onClick={() => setShowTermsModal(true)}
              className="text-base text-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              View Terms & Conditions
              <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {termsAndConditions && propertyName && propertyId && (
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          termsHtml={termsAndConditions}
          propertyName={propertyName}
          propertyId={propertyId}
        />
      )}
    </div>
  );
};
