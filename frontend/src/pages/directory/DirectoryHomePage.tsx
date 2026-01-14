/**
 * DirectoryHomePage
 * Landing page for public property directory
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, Star, TrendingUp } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { SearchBar, PropertyCard } from '@/components/directory';
import { discoveryService } from '@/services';
import type { PublicPropertySummary } from '@/types';

const FEATURED_CATEGORIES = [
  {
    name: 'Beachfront',
    slug: 'beachfront',
    description: 'Stunning ocean views',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80',
  },
  {
    name: 'Mountain view',
    slug: 'mountain-view',
    description: 'Breathtaking peaks',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  },
  {
    name: 'Luxury',
    slug: 'luxury',
    description: 'Premium experiences',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  },
  {
    name: 'Family-friendly',
    slug: 'family-friendly',
    description: 'Perfect for families',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
  },
  {
    name: 'Pet-friendly',
    slug: 'pet-friendly',
    description: 'Bring your pets',
    image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80',
  },
  {
    name: 'Countryside',
    slug: 'countryside',
    description: 'Rural retreats',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
  },
];

export const DirectoryHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState<
    PublicPropertySummary[]
  >([]);
  const [recentProperties, setRecentProperties] = useState<
    PublicPropertySummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    loadFeaturedProperties();
    loadRecentProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    setIsLoading(true);
    try {
      const response = await discoveryService.getFeaturedProperties(12);
      if (response && response.properties) {
        setFeaturedProperties(response.properties);
      } else {
        setFeaturedProperties([]);
      }
    } catch (error) {
      console.error('Failed to load featured properties:', error);
      setFeaturedProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentProperties = async () => {
    setIsLoadingRecent(true);
    try {
      const response = await discoveryService.searchPublicProperties({
        sortBy: 'newest',
        limit: 12,
      });
      if (response && response.properties) {
        setRecentProperties(response.properties);
      } else {
        setRecentProperties([]);
      }
    } catch (error) {
      console.error('Failed to load recent properties:', error);
      setRecentProperties([]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/search?categories=${categorySlug}`);
  };

  return (
    <PublicLayout transparentHeader>
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center text-white">
        {/* Background Image - Tropical island accommodation */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920&q=80')",
          }}
        />
        {/* Gradient Overlay - Lighter and more subtle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/45" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto">
            Discover unique accommodations and book directly with hosts. Zero
            fees, endless possibilities.
          </p>

          {/* Search Bar */}
          <div className="max-w-5xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-white dark:bg-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Featured Properties
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Handpicked stays you'll love
              </p>
            </div>

            <button
              onClick={() => navigate('/search')}
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 group"
            >
              View all
              <TrendingUp className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No properties available yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for amazing stays
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recently Added */}
      <section className="py-16 bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Recently Added
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Discover the newest properties
              </p>
            </div>

            <button
              onClick={() => navigate('/search?sortBy=newest')}
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 group"
            >
              View all
              <TrendingUp className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {isLoadingRecent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : recentProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No recent properties
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for new listings
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-white dark:bg-dark-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Explore by Category
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Find the perfect accommodation for your next adventure
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_CATEGORIES.map((category) => (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category.slug)}
                className="group relative h-64 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Category Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${category.image})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Category Info */}
                <div className="relative h-full flex flex-col justify-end p-6 text-left text-white">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary-light transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-white/90">{category.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50 dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Popular Destinations
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Explore trending locations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Cape Town',
              'Johannesburg',
              'Durban',
              'Knysna',
              'Stellenbosch',
              'Hermanus',
              'Plettenberg Bay',
              'Franschhoek',
            ].map((destination) => (
              <button
                key={destination}
                onClick={() =>
                  navigate(`/search?location=${encodeURIComponent(destination)}`)
                }
                className="p-6 bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 text-center group"
              >
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {destination}
                </h3>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Star className="h-16 w-16 mx-auto mb-6 fill-yellow-400 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-6">
            Ready to List Your Property?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of hosts earning direct bookings with zero platform
            fees
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Get Started Today
          </button>
        </div>
      </section>
    </PublicLayout>
  );
};
