/**
 * WishlistPage
 * User's saved properties/favorites
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, Search } from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { PropertyCard } from '@/components/directory';
import { Button } from '@/components/ui';
import { wishlistService } from '@/services';
import { useAuth } from '@/context/AuthContext';
import type { WishlistItem } from '@/services/wishlist.service';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadWishlist();
  }, [isAuthenticated]);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const response = await wishlistService.getUserWishlist();
      setWishlist(response.wishlist);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (propertyId: string) => {
    try {
      await wishlistService.removeFromWishlist(propertyId);
      setWishlist((prev) =>
        prev.filter((item) => item.property_id !== propertyId)
      );
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-dark-border rounded w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-200 dark:bg-dark-border rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Wishlist
            </h1>
          </div>
          <p className="text-gray-600 dark:text-white-secondary">
            {wishlist.length} {wishlist.length === 1 ? 'property' : 'properties'}{' '}
            saved
          </p>
        </div>

        {/* Wishlist Content */}
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="relative group">
                <PropertyCard
                  property={{
                    ...item.property,
                    min_price: item.min_price,
                    max_price: item.max_price,
                    overall_rating: item.overall_rating,
                    review_count: item.review_count,
                    is_in_wishlist: true,
                  }}
                />

                {/* Remove Button Overlay */}
                <button
                  onClick={() => handleRemoveFromWishlist(item.property_id)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white dark:bg-dark-card rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group/remove"
                  title="Remove from wishlist"
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500 group-hover/remove:fill-transparent transition-all" />
                </button>

                {/* Notes Display (if any) */}
                {item.notes && (
                  <div className="mt-2 px-4 py-2 bg-gray-50 dark:bg-dark-border rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-white-secondary line-clamp-2">
                      {item.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            {/* Empty State */}
            <div className="w-32 h-32 bg-gray-100 dark:bg-dark-border rounded-full flex items-center justify-center mb-6">
              <Heart className="h-16 w-16 text-gray-400" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 dark:text-white-secondary mb-8 text-center max-w-md">
              Start adding properties you love by clicking the heart icon on any
              listing
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/search')}
            >
              <Search className="h-5 w-5 mr-2" />
              Browse Properties
            </Button>
          </div>
        )}

        {/* Tips Section */}
        {wishlist.length > 0 && (
          <div className="mt-16 p-6 bg-primary/5 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              💡 Wishlist Tips
            </h3>
            <ul className="space-y-2 text-gray-600 dark:text-white-secondary">
              <li>• Click the heart icon again to remove properties</li>
              <li>• Share your wishlist with travel companions</li>
              <li>• Properties may have limited availability - book early!</li>
            </ul>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
