/**
 * PortalPropertyDetailPage
 *
 * Property detail page within the portal context
 * Shows property information while keeping user in the portal
 * Routes: /portal/properties/:slug
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  PropertyHero,
  PropertyHeader,
  BookingSidebar,
  OverviewTab,
  RoomsTab,
  RatesTab,
  ReviewsTab,
  LocationTab,
  PromotionsTab,
  ImageLightbox,
} from '@/components/features';
import { StartChatModal } from '@/components/features/Chat';
import { Tabs, TabsList, TabsTrigger, TabsContent, Spinner, Alert, Button } from '@/components/ui';
import { discoveryService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { PublicPropertyDetail } from '@/types';

export const PortalPropertyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatModal, setShowChatModal] = useState(false);

  // Load property data
  useEffect(() => {
    if (slug) {
      loadProperty();
    }
  }, [slug]);

  const loadProperty = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await discoveryService.getPublicPropertyDetail(slug);

      // Check if the response is a valid property (has an id)
      if (!data || !data.id || (data as any).error) {
        setError((data as any)?.error || 'Property not found or not publicly listed');
        setProperty(null);
        return;
      }

      console.log('🏠 [Portal] Loaded property data:', {
        rooms: data.rooms?.length || 0,
        reviews: data.recent_reviews?.length || 0,
        location: { lat: data.location_lat, lng: data.location_lng },
        currency: data.currency,
      });

      setProperty(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load property';
      setError(message);
      setProperty(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Handler: View all photos
  const handleViewAllPhotos = (index: number = 0) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  // Handler: Share property
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.listing_title || property?.name,
          text: property?.listing_description || property?.excerpt || '',
          url: `${window.location.origin}/accommodation/${property?.slug}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/accommodation/${property?.slug}`);
      alert('Link copied to clipboard!');
    }
  };

  // Handler: Reserve (navigate to booking wizard)
  const handleReserve = (roomId?: string) => {
    const query = roomId ? `?room=${roomId}` : '';
    navigate(`/accommodation/${slug}/book${query}`);
  };

  // Handler: Date selection from rates calendar
  const handleDateSelect = (date: Date, roomId: string) => {
    const checkInDate = date.toISOString().split('T')[0];
    navigate(`/accommodation/${slug}/book?room=${roomId}&checkIn=${checkInDate}`);
  };

  // Handler: Message host - open chat modal
  const handleMessageHost = () => {
    console.log('[PortalPropertyDetailPage] Opening chat modal');
    setShowChatModal(true);
  };

  // Handler: Chat started - navigate to conversation
  const handleChatStarted = (conversationId: string) => {
    console.log('[PortalPropertyDetailPage] Chat started:', conversationId);
    navigate(`/manage/chat/conversations/${conversationId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <AuthenticatedLayout title="Loading Property...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <AuthenticatedLayout title="Property Not Found">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {error ? 'Error Loading Property' : 'Property Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The property you're looking for doesn't exist or is no longer available."}
          </p>
          <Button variant="primary" onClick={() => navigate('/portal/properties')}>
            Back to Properties
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Prepare data for components
  const allImages = [
    ...(property.featured_image_url ? [{ url: property.featured_image_url, order: 0 }] : []),
    ...(property.gallery_images || []),
  ];

  const fullAddress = [
    property.address_city || property.city_name,
    property.address_state || property.province_name,
    property.address_country || property.country_name,
  ].filter(Boolean).join(', ');

  // Calculate total property capacity by summing all room capacities
  const maxGuests = (property.rooms || []).reduce((sum, room) => sum + room.max_guests, 0);

  return (
    <AuthenticatedLayout
      title={property.listing_title || property.name}
      subtitle={fullAddress}
    >
      <div className="space-y-6">
        {/* Hero Section */}
        <PropertyHero
          images={allImages}
          featuredImage={property.featured_image_url}
          propertyName={property.listing_title || property.name}
          onViewAllPhotos={() => handleViewAllPhotos(0)}
          onShare={handleShare}
        />

        {/* Property Header */}
        <PropertyHeader
          name={property.name}
          listingTitle={property.listing_title}
          propertyType={property.property_type}
          city={property.city_name || property.address_city}
          province={property.province_name || property.address_state}
          country={property.country_name || property.address_country}
          overallRating={property.overall_rating}
          reviewCount={property.review_count}
          categories={property.categories}
        />

        {/* Grid Layout: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList variant="underline">
                <TabsTrigger value="overview" variant="underline">Overview</TabsTrigger>
                <TabsTrigger value="rooms" variant="underline">
                  Rooms ({property.rooms?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="rates" variant="underline">Rates</TabsTrigger>
                <TabsTrigger value="reviews" variant="underline">
                  Reviews ({property.review_count})
                </TabsTrigger>
                <TabsTrigger value="location" variant="underline">Location</TabsTrigger>
                <TabsTrigger value="promotions" variant="underline">Promotions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {activeTab === 'overview' && (
                  <OverviewTab
                    description={property.listing_description}
                    longDescription={property.long_description}
                    excerpt={property.excerpt}
                    videoUrl={property.video_url}
                    showVideo={property.show_video !== false}
                    highlights={property.highlights}
                    amenities={property.amenities}
                    houseRules={property.house_rules}
                    whatsIncluded={property.whats_included}
                    checkInTime={property.check_in_time}
                    checkOutTime={property.check_out_time}
                    cancellationPolicy={property.cancellation_policy}
                    cancellationPolicyDetail={property.cancellation_policy_detail}
                    termsAndConditions={property.terms_and_conditions}
                    propertyName={property.listing_title || property.name}
                    propertyId={property.id}
                    maxGuests={maxGuests}
                  />
                )}
              </TabsContent>

              <TabsContent value="rooms">
                {activeTab === 'rooms' && (
                  <RoomsTab
                    rooms={property.rooms}
                    currency={property.currency}
                    onReserve={handleReserve}
                  />
                )}
              </TabsContent>

              <TabsContent value="rates">
                {activeTab === 'rates' && (
                  <RatesTab
                    rooms={property.rooms}
                    currency={property.currency}
                    onDateSelect={handleDateSelect}
                  />
                )}
              </TabsContent>

              <TabsContent value="reviews">
                {activeTab === 'reviews' && (
                  <ReviewsTab
                    overallRating={property.overall_rating}
                    reviewCount={property.review_count}
                    ratingBreakdown={property.rating_breakdown}
                    reviews={property.recent_reviews}
                  />
                )}
              </TabsContent>

              <TabsContent value="location">
                {activeTab === 'location' && (
                  <LocationTab
                    lat={property.location_lat}
                    lng={property.location_lng}
                    address={fullAddress}
                    propertyName={property.listing_title || property.name}
                  />
                )}
              </TabsContent>

              <TabsContent value="promotions">
                {activeTab === 'promotions' && (
                  <PromotionsTab
                    rooms={property.rooms}
                    currency={property.currency}
                    propertyId={property.id}
                    propertyName={property.listing_title || property.name}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <BookingSidebar
                minPrice={property.min_price}
                currency={property.currency}
                rating={property.overall_rating}
                reviewCount={property.review_count}
                companyName={property.company_name}
                companyLogo={property.company_logo}
                onReserve={() => handleReserve()}
                onMessageHost={handleMessageHost}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}

      {/* Start Chat Modal */}
      {property && (
        <StartChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          propertyId={property.id}
          propertyName={property.name}
          propertyOwnerId={property.owner_id}
          isAuthenticated={true}
          currentUserId={user?.id}
          onChatStarted={handleChatStarted}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default PortalPropertyDetailPage;
