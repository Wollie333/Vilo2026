/**
 * SearchModal Component
 * Global search modal for searching properties by keyword
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import { discoveryService } from '@/services';
import type { PublicPropertySummary } from '@/types';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicPropertySummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('global-search-input');
      input?.focus();
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await discoveryService.searchPublicProperties({
        keyword: query,
        limit: 20,
      });

      setSearchResults(response.properties || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handlePropertyClick = (slug: string) => {
    navigate(`/accommodation/${slug}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-dark-border">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search properties by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              {isSearching && (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-hover rounded-md transition-colors"
                aria-label="Close search"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {!hasSearched && !searchQuery && (
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Start typing to search properties
                  </p>
                </div>
              )}

              {hasSearched && searchResults.length === 0 && !isSearching && (
                <div className="py-12 text-center">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    No properties found
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Try searching with different keywords
                  </p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="py-2">
                  {searchResults.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertyClick(property.slug)}
                      className="w-full flex items-start gap-4 px-4 py-3 hover:bg-gray-200/50 dark:hover:bg-dark-hover transition-colors text-left"
                    >
                      {/* Property Image */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-border">
                        {property.featured_image_url || property.gallery_images?.[0]?.url ? (
                          <img
                            src={property.featured_image_url || property.gallery_images?.[0]?.url}
                            alt={property.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Property Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 mb-1">
                          {property.listing_title || property.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {property.city_name || property.address_city}
                            {(property.province_name || property.address_state) && (
                              <>, {property.province_name || property.address_state}</>
                            )}
                          </span>
                        </div>
                        {property.listing_description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {property.listing_description}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      {property.min_price && (
                        <div className="flex-shrink-0 text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            R{property.min_price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            / night
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            {searchResults.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {searchResults.length} {searchResults.length === 1 ? 'property' : 'properties'} found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
