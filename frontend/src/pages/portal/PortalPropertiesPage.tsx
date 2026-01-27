/**
 * PortalPropertiesPage
 *
 * Guest portal page for browsing and searching properties
 * Routes: /portal/properties
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, MapPin, TrendingUp, Search, Filter, X } from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout';
import { PropertyCard } from '@/components/directory';
import { Input, Button, Spinner, Tabs, TabsList, TabsTrigger, TabsContent, Card, Select } from '@/components/ui';
import { discoveryService } from '@/services';
import type { PublicPropertySummary } from '@/types';

const FEATURED_CATEGORIES = [
  { name: 'Beachfront', slug: 'beachfront', icon: '🏖️' },
  { name: 'Mountain view', slug: 'mountain-view', icon: '⛰️' },
  { name: 'Luxury', slug: 'luxury', icon: '💎' },
  { name: 'Family-friendly', slug: 'family-friendly', icon: '👨‍👩‍👧‍👦' },
  { name: 'Pet-friendly', slug: 'pet-friendly', icon: '🐾' },
  { name: 'Countryside', slug: 'countryside', icon: '🌾' },
];

export const PortalPropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [featuredProperties, setFeaturedProperties] = useState<PublicPropertySummary[]>([]);
  const [recentProperties, setRecentProperties] = useState<PublicPropertySummary[]>([]);
  const [searchResults, setSearchResults] = useState<PublicPropertySummary[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadFeaturedProperties();
    loadRecentProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    setIsLoadingFeatured(true);
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
      setIsLoadingFeatured(false);
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

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setIsSearching(true);
    setActiveTab('search');
    try {
      const response = await discoveryService.searchPublicProperties({
        query: searchQuery || undefined,
        categories: selectedCategory ? [selectedCategory] : undefined,
        sortBy: sortBy as any,
        limit: 20,
      });
      if (response && response.properties) {
        setSearchResults(response.properties);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to search properties:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSortBy('featured');
  };

  const handleCategoryClick = (categorySlug: string) => {
    setSearchParams({ categories: categorySlug });
    setActiveTab('search');
    loadCategoryProperties(categorySlug);
  };

  const loadCategoryProperties = async (categorySlug: string) => {
    setIsSearching(true);
    try {
      const response = await discoveryService.searchPublicProperties({
        categories: [categorySlug],
        limit: 20,
      });
      if (response && response.properties) {
        setSearchResults(response.properties);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to load category properties:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Custom handler for property card clicks - opens property detail within portal
  const handlePropertyClick = (property: PublicPropertySummary) => {
    // Navigate to portal property detail page (stays within portal context)
    navigate(`/portal/properties/${property.slug}`);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header with Filter Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Browse Properties
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Find your perfect stay
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>

            {/* Quick Search Field */}
            <div className="w-80">
              <Input
                type="text"
                placeholder="Quick search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSearching}
                leftIcon={<Search className="w-5 h-5" />}
                isLoading={isSearching}
              />
            </div>

            {/* Search Action Button */}
            <Button
              variant="primary"
              onClick={() => handleSearch()}
              disabled={isSearching}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {showFilters && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Search Input */}
              <div>
                <Input
                  label="Search"
                  type="text"
                  placeholder="Search by location, property name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-5 h-5" />}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Select
                  options={[
                    { value: '', label: 'All Categories' },
                    ...FEATURED_CATEGORIES.map((cat) => ({
                      value: cat.slug,
                      label: `${cat.icon} ${cat.name}`,
                    })),
                  ]}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <Select
                  options={[
                    { value: 'featured', label: 'Featured' },
                    { value: 'newest', label: 'Recently Added' },
                    { value: 'price_low', label: 'Price: Low to High' },
                    { value: 'price_high', label: 'Price: High to Low' },
                    { value: 'rating', label: 'Highest Rated' },
                  ]}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                />
              </div>

              {/* Quick Category Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Filter by Category
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {FEATURED_CATEGORIES.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => {
                        setSelectedCategory(category.slug);
                        handleCategoryClick(category.slug);
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        selectedCategory === category.slug
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-dark-border hover:border-primary dark:hover:border-primary'
                      }`}
                    >
                      <span className="text-2xl">{category.icon}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                <Button variant="primary" onClick={() => handleSearch()} disabled={isSearching}>
                  {isSearching ? <Spinner size="sm" /> : 'Apply Filters'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Property Listings */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="underline">
            <TabsTrigger value="featured" variant="underline">
              <Sparkles className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="recent" variant="underline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Recently Added
            </TabsTrigger>
            {activeTab === 'search' && (
              <TabsTrigger value="search" variant="underline">
                <Search className="h-4 w-4 mr-2" />
                Search Results
              </TabsTrigger>
            )}
          </TabsList>

          {/* Featured Tab */}
          <TabsContent value="featured">
            {isLoadingFeatured ? (
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
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onCardClick={handlePropertyClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No properties available yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back soon for amazing stays
                </p>
              </div>
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent">
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
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onCardClick={handlePropertyClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No recent properties
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back soon for new listings
                </p>
              </div>
            )}
          </TabsContent>

          {/* Search Results Tab */}
          <TabsContent value="search">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onCardClick={handlePropertyClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No properties found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or browse our featured properties
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default PortalPropertiesPage;
