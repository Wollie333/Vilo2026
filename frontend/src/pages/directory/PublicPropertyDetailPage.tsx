/**
 * PublicPropertyDetailPage
 *
 * Modern public property detail page with hero gallery, tabs, and sticky booking sidebar
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';
import {
  ImageLightbox,
  PropertyHero,
  PropertyHeader,
  BookingSidebar,
  OverviewTab,
  RoomsTab,
  RatesTab,
  ReviewsTab,
  LocationTab,
  PromotionsTab,
} from '@/components/features';
import { Tabs, TabsList, TabsTrigger, TabsContent, Spinner, Alert, Button } from '@/components/ui';
import { discoveryService, wishlistService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { PublicPropertyDetail } from '@/types';

export const PublicPropertyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // State
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Load property data
  useEffect(() => {
    if (slug) {
      loadProperty();
    }
  }, [slug]);

  // Sync tab with URL hash
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['overview', 'rooms', 'rates', 'reviews', 'location', 'promotions'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  const loadProperty = async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await discoveryService.getPublicPropertyDetail(slug);
      if (!data) {
        setError('Property not found');
        return;
      }
      setProperty(data);
      setIsInWishlist(data.is_in_wishlist || false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load property';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Tab change (update URL hash)
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
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
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Handler: Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }

    if (!property) return;

    try {
      if (isInWishlist) {
        await wishlistService.removeFromWishlist(property.id);
        setIsInWishlist(false);
      } else {
        await wishlistService.addToWishlist(property.id);
        setIsInWishlist(true);
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
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

  // Handler: Message host
  const handleMessageHost = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
      return;
    }
    navigate(`/chat?property=${property?.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <PublicLayout stickyHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </PublicLayout>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <PublicLayout stickyHeader={false}>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {error ? 'Error Loading Property' : 'Property Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The property you're looking for doesn't exist or is no longer available."}
          </p>
          <Button variant="primary" onClick={() => navigate('/search')}>
            Browse Properties
          </Button>
        </div>
      </PublicLayout>
    );
  }

  // Prepare data for components
  const allImages = [
    ...(property.featured_image_url ? [{ url: property.featured_image_url, order: 0 }] : []),
    ...property.gallery_images,
  ];

  const fullAddress = [
    property.address_city || property.city_name,
    property.address_state || property.province_name,
    property.address_country || property.country_name,
  ].filter(Boolean).join(', ');

  // Calculate total property capacity by summing all room capacities
  const maxGuests = property.rooms.reduce((sum, room) => sum + room.max_guests, 0);

  return (
    <PublicLayout stickyHeader={false}>
      {/* Hero Section */}
      <PropertyHero
        images={allImages}
        featuredImage={property.featured_image_url}
        propertyName={property.listing_title || property.name}
        onViewAllPhotos={() => handleViewAllPhotos(0)}
        onShare={handleShare}
        // Wishlist disabled
        // onWishlistToggle={handleWishlistToggle}
        // isInWishlist={isInWishlist}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 relative">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 lg:mt-0">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList variant="underline">
                <TabsTrigger value="overview" variant="underline">Overview</TabsTrigger>
                <TabsTrigger value="rooms" variant="underline">Rooms</TabsTrigger>
                <TabsTrigger value="rates" variant="underline">Rates</TabsTrigger>
                <TabsTrigger value="reviews" variant="underline">
                  Reviews ({property.review_count})
                </TabsTrigger>
                <TabsTrigger value="location" variant="underline">Location</TabsTrigger>
                <TabsTrigger value="promotions" variant="underline">Promotions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                {/* OPTIMIZED: Only render active tab content to improve initial load */}
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
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Sidebar - 1/3 width */}
          <div className="lg:col-span-1 lg:-mt-[270px]">
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

      {/* Image Lightbox */}
      {showLightbox && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightboxIndex}
          onClose={() => setShowLightbox(false)}
        />
      )}
    </PublicLayout>
  );
};
