/**
 * SearchResultsPage
 * Property search results with filters, sorting, and pagination
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Grid, List, Map as MapIcon, SlidersHorizontal, X, ChevronRight, Moon, Sun, User } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { SearchBar, PropertyCard, FilterSidebar } from '@/components/directory';
import { discoveryService } from '@/services';
import { Button, Select, ThemeToggle, Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import type { PropertySearchFilters, PublicPropertySummary } from '@/types';

type ViewMode = 'grid' | 'list';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [properties, setProperties] = useState<PublicPropertySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage or default to 'list'
    const saved = localStorage.getItem('vilo_view_mode');
    return (saved as ViewMode) || 'list';
  });
  const [showFilters, setShowFilters] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [listingType, setListingType] = useState<'property' | 'room'>(() => {
    // Load from URL hash first, then localStorage, or default to 'property'
    const hash = window.location.hash.replace('#', '');
    if (hash === 'property' || hash === 'rooms') {
      return hash === 'rooms' ? 'room' : 'property';
    }
    const saved = localStorage.getItem('vilo_listing_type');
    return (saved as 'property' | 'room') || 'property';
  });

  // Parse filters from URL
  const [filters, setFilters] = useState<PropertySearchFilters>(() => ({
    keyword: searchParams.get('location') || undefined,
    checkIn: searchParams.get('checkIn') || undefined,
    checkOut: searchParams.get('checkOut') || undefined,
    guests: searchParams.get('guests')
      ? parseInt(searchParams.get('guests')!)
      : undefined,
    categories: searchParams.getAll('categories'),
    amenities: searchParams.getAll('amenities'),
    priceMin: searchParams.get('priceMin')
      ? parseInt(searchParams.get('priceMin')!)
      : undefined,
    priceMax: searchParams.get('priceMax')
      ? parseInt(searchParams.get('priceMax')!)
      : undefined,
    sortBy: (searchParams.get('sortBy') as any) || 'popular',
    page: searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1,
    limit: 20,
  }));

  useEffect(() => {
    loadProperties();
  }, [filters, listingType]);

  // Set initial hash if not present
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash || (hash !== 'property' && hash !== 'rooms')) {
      // Set hash based on current listingType
      window.location.hash = listingType === 'room' ? 'rooms' : 'property';
    }
  }, []); // Run once on mount

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'property' || hash === 'rooms') {
        const newType = hash === 'rooms' ? 'room' : 'property';
        if (newType !== listingType) {
          setListingType(newType);
          localStorage.setItem('vilo_listing_type', newType);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [listingType]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsScrolled(scrolled);

      // Hide/show main header
      const header = document.querySelector('header');
      if (header) {
        if (scrolled) {
          header.style.transform = 'translateY(-100%)';
          header.style.transition = 'transform 0.3s ease-in-out';
        } else {
          header.style.transform = 'translateY(0)';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Reset header on unmount
      const header = document.querySelector('header');
      if (header) {
        header.style.transform = 'translateY(0)';
      }
    };
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      if (listingType === 'room') {
        // Search rooms
        const response = await discoveryService.searchPublicRooms(filters);

        // Transform rooms to look like properties for display
        const roomsAsProperties = response.rooms?.map((room: any) => ({
          id: room.id,
          slug: room.properties.slug,
          name: room.name,
          listing_title: `${room.name} at ${room.properties.listing_title || room.properties.name}`,
          listing_description: room.description,
          property_type: room.properties.property_type,
          address_city: room.properties.address_city,
          address_state: room.properties.address_state,
          address_country: room.properties.address_country,
          city_name: room.properties.address_city,
          province_name: room.properties.address_state,
          country_name: room.properties.address_country,
          featured_image_url: room.featured_image_url,
          gallery_images: room.gallery_images || [],
          categories: room.properties.categories || [],
          amenities: room.amenities || [],
          currency: room.currency,
          min_price: room.base_price_per_night,
          room_count: 1,
          total_max_guests: room.max_guests,
          overall_rating: null,
          review_count: 0,
        })) || [];

        setProperties(roomsAsProperties);
        setTotalResults(response.total || 0);
        setCurrentPage(response.page || 1);
        setTotalPages(response.total_pages || 1);
      } else {
        // Search properties
        const response = await discoveryService.searchPublicProperties(filters);
        setProperties(response.properties || []);
        setTotalResults(response.total || 0);
        setCurrentPage(response.page || 1);
        setTotalPages(response.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      // Set empty results on error
      setProperties([]);
      setTotalResults(0);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: PropertySearchFilters) => {
    // Update filters state
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.keyword) params.set('location', newFilters.keyword);
    if (newFilters.checkIn) params.set('checkIn', newFilters.checkIn);
    if (newFilters.checkOut) params.set('checkOut', newFilters.checkOut);
    if (newFilters.guests) params.set('guests', newFilters.guests.toString());
    if (newFilters.categories) {
      newFilters.categories.forEach((cat) => params.append('categories', cat));
    }
    if (newFilters.amenities) {
      newFilters.amenities.forEach((amenity) =>
        params.append('amenities', amenity)
      );
    }
    if (newFilters.priceMin)
      params.set('priceMin', newFilters.priceMin.toString());
    if (newFilters.priceMax)
      params.set('priceMax', newFilters.priceMax.toString());
    if (newFilters.sortBy) params.set('sortBy', newFilters.sortBy);
    if (newFilters.page) params.set('page', newFilters.page.toString());

    setSearchParams(params);
  };

  const handleSortChange = (sortBy: string) => {
    handleFilterChange({ ...filters, sortBy: sortBy as any });
  };

  const handlePageChange = (page: number) => {
    handleFilterChange({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('vilo_view_mode', mode);
  };

  const handleListingTypeChange = (type: 'property' | 'room') => {
    setListingType(type);
    localStorage.setItem('vilo_listing_type', type);
    // Update URL hash
    window.location.hash = type === 'room' ? 'rooms' : 'property';
  };

  const handleClearFilters = () => {
    const clearedFilters: PropertySearchFilters = {
      keyword: filters.keyword,
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests,
      sortBy: filters.sortBy,
      page: 1,
      limit: 20,
    };
    handleFilterChange(clearedFilters);
  };

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) ||
    (filters.amenities && filters.amenities.length > 0) ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined;

  return (
    <PublicLayout>
      {/* Compact Sticky Header - Shows when scrolled */}
      {isScrolled && (
        <div className="fixed top-0 left-0 right-0 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border z-50 shadow-sm transition-all duration-300">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo - Same position as PublicLayout */}
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">V</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Vilo
                  </span>
                </Link>
              </div>

              {/* Search Bar - Replaces navigation section */}
              <div className="hidden md:flex items-center flex-1 mx-8">
                <SearchBar
                  compact
                  hideLabels
                  initialFilters={filters}
                  onSearch={(newFilters) =>
                    handleFilterChange({ ...filters, ...newFilters })
                  }
                  className="w-full"
                />
              </div>

              {/* Auth Buttons - Same position as PublicLayout */}
              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-card transition-colors"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user?.full_name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                        {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="hidden lg:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.full_name || user?.email?.split('@')[0]}
                    </span>
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300"
              >
                <SlidersHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar - Regular (hidden when scrolled) */}
      <div className={`bg-emerald-50 dark:bg-emerald-950/30 sticky top-16 z-20 transition-all duration-300 ${
        isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar
            compact
            initialFilters={filters}
            onSearch={(newFilters) =>
              handleFilterChange({ ...filters, ...newFilters })
            }
          />
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm" aria-label="Breadcrumb">
            <Link
              to="/"
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400 dark:text-gray-600" />
            <Link
              to="/search"
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
            >
              Search
            </Link>
            {filters.keyword && (
              <>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400 dark:text-gray-600" />
                <span className="text-primary font-semibold">
                  {filters.keyword}
                </span>
              </>
            )}
            {!filters.keyword && (
              <>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400 dark:text-gray-600" />
                <span className="text-primary font-semibold">
                  All Properties
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 dark:bg-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-32">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </aside>

            {/* Results */}
            <main className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              {/* Results Count */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? (
                    'Searching...'
                  ) : (
                    <>
                      {totalResults} {listingType === 'property'
                        ? (totalResults === 1 ? 'Property' : 'Properties')
                        : (totalResults === 1 ? 'Room' : 'Rooms')
                      }
                    </>
                  )}
                </h1>
                {/* Search Summary */}
                {!isLoading && (filters.keyword || filters.checkIn || filters.checkOut || filters.guests) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    {filters.keyword && (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-medium">Location:</span>
                        <span>{filters.keyword}</span>
                      </span>
                    )}
                    {(filters.checkIn || filters.checkOut) && (
                      <>
                        {filters.keyword && <span>•</span>}
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Dates:</span>
                          <span>
                            {filters.checkIn && new Date(filters.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {filters.checkIn && filters.checkOut && ' - '}
                            {filters.checkOut && new Date(filters.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </span>
                      </>
                    )}
                    {filters.guests && (
                      <>
                        {(filters.keyword || filters.checkIn || filters.checkOut) && <span>•</span>}
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium">Guests:</span>
                          <span>{filters.guests}</span>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-4">
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      Active
                    </span>
                  )}
                </Button>

                {/* Property/Room Filter Toggle */}
                <Tabs
                  value={listingType}
                  onValueChange={(value) => handleListingTypeChange(value as 'property' | 'room')}
                >
                  <TabsList variant="underline">
                    <TabsTrigger value="property" variant="underline">
                      Properties
                    </TabsTrigger>
                    <TabsTrigger value="room" variant="underline">
                      Rooms
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Sort Dropdown */}
                <Select
                  value={filters.sortBy || 'popular'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="min-w-[180px]"
                  options={[
                    { value: 'popular', label: 'Most Popular' },
                    { value: 'price_asc', label: 'Price: Low to High' },
                    { value: 'price_desc', label: 'Price: High to Low' },
                    { value: 'rating', label: 'Highest Rated' },
                    { value: 'newest', label: 'Newest' },
                  ]}
                />

                {/* View Mode Toggle */}
                <Tabs
                  value={viewMode}
                  onValueChange={(value) => handleViewModeChange(value as ViewMode)}
                  className="hidden sm:block"
                >
                  <TabsList variant="default">
                    <TabsTrigger value="list" variant="default" title="List View">
                      <List className="h-5 w-5" />
                    </TabsTrigger>
                    <TabsTrigger value="grid" variant="default" title="Grid View">
                      <Grid className="h-5 w-5" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Active Filters Pills */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-gray-600 dark:text-white-secondary">
                  Active filters:
                </span>
                {filters.categories?.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      handleFilterChange({
                        ...filters,
                        categories: filters.categories?.filter(
                          (c) => c !== category
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20"
                  >
                    {category}
                    <X className="h-4 w-4" />
                  </button>
                ))}
                {filters.amenities?.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() =>
                      handleFilterChange({
                        ...filters,
                        amenities: filters.amenities?.filter(
                          (a) => a !== amenity
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20"
                  >
                    {amenity}
                    <X className="h-4 w-4" />
                  </button>
                ))}
                {(filters.priceMin || filters.priceMax) && (
                  <button
                    onClick={() =>
                      handleFilterChange({
                        ...filters,
                        priceMin: undefined,
                        priceMax: undefined,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20"
                  >
                    Price: R{filters.priceMin || 0} - R
                    {filters.priceMax || '∞'}
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Property Grid/List */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
                {[...Array(6)].map((_, i) => (
                  viewMode === 'list' ? (
                    // List View Skeleton
                    <div
                      key={i}
                      className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                        {/* Image Skeleton - 1/3 width */}
                        <div className="aspect-[16/10] md:aspect-auto bg-gray-200 dark:bg-dark-border animate-pulse md:col-span-1 md:h-64" />

                        {/* Content Skeleton - 2/3 width */}
                        <div className="p-5 md:col-span-2 space-y-3">
                          {/* Location & Title */}
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-dark-border rounded w-1/3 animate-pulse" />
                            <div className="h-5 bg-gray-200 dark:bg-dark-border rounded w-3/4 animate-pulse" />
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 dark:bg-dark-border rounded w-full animate-pulse" />
                            <div className="h-3 bg-gray-200 dark:bg-dark-border rounded w-5/6 animate-pulse" />
                          </div>

                          {/* Room/Guest info */}
                          <div className="flex gap-4">
                            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-20 animate-pulse" />
                            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-24 animate-pulse" />
                          </div>

                          {/* Pills */}
                          <div className="flex flex-wrap gap-2">
                            <div className="h-6 bg-gray-200 dark:bg-dark-border rounded-full w-16 animate-pulse" />
                            <div className="h-6 bg-gray-200 dark:bg-dark-border rounded-full w-20 animate-pulse" />
                            <div className="h-6 bg-gray-200 dark:bg-dark-border rounded-full w-24 animate-pulse" />
                          </div>

                          {/* Price footer */}
                          <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                            <div className="h-6 bg-gray-200 dark:bg-dark-border rounded w-32 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Grid View Skeleton
                    <div
                      key={i}
                      className="h-96 bg-gray-200 dark:bg-dark-border rounded-lg animate-pulse"
                    />
                  )
                ))}
              </div>
            ) : properties.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                      : 'space-y-6'
                  }
                >
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      compact={viewMode === 'list'}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>

                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        // Show first, last, current, and 2 pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 2 && page <= currentPage + 2)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'primary' : 'outline'}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Button>
                          );
                        } else if (
                          page === currentPage - 3 ||
                          page === currentPage + 3
                        ) {
                          return <span key={page}>...</span>;
                        }
                        return null;
                      })}

                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-dark-border rounded-full flex items-center justify-center">
                  <MapIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  No {listingType === 'property' ? 'properties' : 'rooms'} found
                </h3>
                <p className="text-gray-600 dark:text-white-secondary mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <Button variant="primary" onClick={handleClearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-dark-card overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar
                filters={filters}
                onFilterChange={(newFilters) => {
                  handleFilterChange(newFilters);
                  setShowFilters(false);
                }}
                onClearFilters={() => {
                  handleClearFilters();
                  setShowFilters(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};
