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
  QuoteRequestTab,
} from '@/components/features';
import { StartChatModal } from '@/components/features/Chat';
import { Tabs, TabsList, TabsTrigger, TabsContent, Spinner, Alert, Button } from '@/components/ui';
import { discoveryService, wishlistService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { PublicPropertyDetail } from '@/types';

export const PublicPropertyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // State
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatModal, setShowChatModal] = useState(false);

  // Ref for scrolling to tabs section
  const tabsRef = React.useRef<HTMLDivElement>(null);

  // Load property data
  useEffect(() => {
    if (slug) {
      loadProperty();
    }
  }, [slug]);

  // Sync tab with URL hash and scroll to tabs
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['overview', 'rooms', 'rates', 'reviews', 'location', 'promotions', 'quote'].includes(hash)) {
      setActiveTab(hash);

      // Scroll to tabs section after a short delay to ensure content is rendered
      setTimeout(() => {
        if (tabsRef.current) {
          const headerOffset = 80; // Offset for sticky header
          const elementPosition = tabsRef.current.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [location.hash]);

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

      console.log('🏠 Loaded property data:', {
        rooms: data.rooms?.length || 0,
        reviews: data.recent_reviews?.length || 0,
        location: { lat: data.location_lat, lng: data.location_lng },
        currency: data.currency,
      });

      setProperty(data);
      setIsInWishlist(data.is_in_wishlist || false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load property';
      setError(message);
      setProperty(null);
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

  // Handler: Message host - open chat modal
  const handleMessageHost = () => {
    console.log('[PublicPropertyDetailPage] Opening chat modal');
    setShowChatModal(true);
  };

  // Handler: Chat started - navigate to conversation
  const handleChatStarted = (conversationId: string) => {
    console.log('[PublicPropertyDetailPage] Chat started:', conversationId);
    navigate(`/manage/chat/conversations/${conversationId}`);
  };

  // Handler: Request quote
  const handleRequestQuote = () => {
    setActiveTab('quote');
    window.location.hash = 'quote';

    // Scroll to the tabs section, not the top of the page
    if (tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    ...(property.gallery_images || []),
  ];

  const fullAddress = [
    property.address_city || property.city_name,
    property.address_state || property.province_name,
    property.address_country || property.country_name,
  ].filter(Boolean).join(', ');

  // Calculate total property capacity by summing all room capacities
  const maxGuests = (property.rooms || []).reduce((sum, room) => sum + room.max_guests, 0);

  // Prepare SEO data
  const currentUrl = window.location.href;
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
    {
      name: property.city_name || property.address_city || 'Property',
      url: `/search?city=${property.city_name || property.address_city}`,
    },
    { name: property.listing_title || property.name },
  ];

  // Prepare property data for Schema.org (map field names)
  const propertyForSchema = {
    ...property,
    name: property.name,
    listing_title: property.listing_title,
    listing_description: property.listing_description,
    excerpt: property.excerpt,
    description: property.long_description,
    property_type: property.property_type,
    photos: allImages,
    address: {
      street: property.address_street || '',
      city: property.address_city || property.city_name || '',
      state: property.address_state || property.province_name || '',
      postal_code: property.address_postal_code || '',
      country: property.address_country || property.country_name || 'ZA',
    },
    latitude: property.location_lat,
    longitude: property.location_lng,
    rating_overall: property.overall_rating,
    review_count: property.review_count,
    min_price_per_night: property.min_price,
    max_price_per_night: property.max_price,
    currency: property.currency,
    total_rooms: property.rooms?.length || 0,
    bedrooms: property.rooms?.reduce((sum, room) => sum + (room.bedrooms || 0), 0) || 0,
    bathrooms: property.rooms?.reduce((sum, room) => sum + (room.bathrooms || 0), 0) || 0,
    max_guests: maxGuests,
    amenities: property.amenities || [],
    check_in_time: property.check_in_time,
    check_out_time: property.check_out_time,
    pets_allowed: property.pets_allowed,
    smoking_allowed: property.smoking_allowed,
    is_published: property.is_published !== false,
  };

  // Map recent reviews for schema
  const reviewsForSchema = property.recent_reviews?.map(review => ({
    id: review.id,
    guest_name: review.guest_name || 'Anonymous Guest',
    rating_overall: review.rating_overall,
    review_text: review.review_text || '',
    created_at: review.created_at,
  })) || [];

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
          <div className="lg:col-span-2 lg:mt-0" ref={tabsRef}>
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
                <TabsTrigger value="quote" variant="underline">Request Quote</TabsTrigger>
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

              <TabsContent value="quote">
                {activeTab === 'quote' && (
                  <QuoteRequestTab
                    propertyId={property.id}
                    propertyName={property.listing_title || property.name}
                    propertyCurrency={property.currency}
                    propertyImage={property.featured_image_url}
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
              onRequestQuote={handleRequestQuote}
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

      {/* Start Chat Modal */}
      {property && (
        <StartChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          propertyId={property.id}
          propertyName={property.name}
          propertyOwnerId={property.owner_id}
          isAuthenticated={isAuthenticated}
          currentUserId={user?.id}
          onChatStarted={handleChatStarted}
        />
      )}
    </PublicLayout>
  );
};
