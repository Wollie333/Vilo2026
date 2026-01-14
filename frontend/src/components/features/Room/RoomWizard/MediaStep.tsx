/**
 * MediaStep Component
 *
 * Step 2 of the Room Wizard: Featured image and gallery.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { GalleryUpload } from '@/components/ui/GalleryUpload';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { MediaStepProps } from './RoomWizard.types';
import type { GalleryImage } from '@/types/room.types';
import { roomService } from '@/services';

// ============================================================================
// MediaStep Component
// ============================================================================

export const MediaStep: React.FC<MediaStepProps> = ({
  data,
  roomId,
  onChange,
  onNext,
  onBack,
  isLoading,
}) => {
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeaturedImageUpload = async (file: File) => {
    if (!roomId) {
      // In create mode, we'll store the file locally
      // and upload it after the room is created
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange({ ...data, featured_image: e.target?.result as string });
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setUploadingFeatured(true);
      setError(null);
      const imageUrl = await roomService.uploadFeaturedImage(roomId, file);
      onChange({ ...data, featured_image: imageUrl });
    } catch (err) {
      setError('Failed to upload featured image');
      console.error(err);
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleFeaturedImageRemove = async () => {
    if (roomId && data.featured_image) {
      try {
        setUploadingFeatured(true);
        await roomService.deleteFeaturedImage(roomId);
      } catch (err) {
        console.error('Failed to delete featured image:', err);
      } finally {
        setUploadingFeatured(false);
      }
    }
    onChange({ ...data, featured_image: null });
  };

  const handleGalleryImageUpload = async (file: File): Promise<string> => {
    if (!roomId) {
      // In create mode, store as data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const newImage: GalleryImage = {
            url,
            order: data.gallery_images.length,
          };
          onChange({
            ...data,
            gallery_images: [...data.gallery_images, newImage],
          });
          resolve(url);
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      setUploadingGallery(true);
      setError(null);
      const imageUrl = await roomService.uploadGalleryImage(roomId, file);
      const newImage: GalleryImage = {
        url: imageUrl,
        order: data.gallery_images.length,
      };
      onChange({
        ...data,
        gallery_images: [...data.gallery_images, newImage],
      });
      return imageUrl;
    } catch (err) {
      setError('Failed to upload gallery image');
      console.error(err);
      throw err;
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryReorder = (images: GalleryImage[]) => {
    onChange({
      ...data,
      gallery_images: images.map((img, i) => ({ ...img, order: i })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Media</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Add photos to showcase your room to potential guests.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Featured Image */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Featured Image
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This will be the main image shown in listings and search results.
        </p>
        <ImageUpload
          value={data.featured_image}
          onUpload={handleFeaturedImageUpload}
          onDelete={handleFeaturedImageRemove}
          loading={uploadingFeatured}
          placeholder="Click or drag to upload featured image"
        />
      </div>

      {/* Gallery Images */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gallery Images
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Add additional photos of the room. Click the star to set featured image.
        </p>
        <GalleryUpload
          images={data.gallery_images}
          featuredImageUrl={data.featured_image}
          onImagesChange={handleGalleryReorder}
          onFeaturedChange={(url) => onChange({ ...data, featured_image: url })}
          onUpload={handleGalleryImageUpload}
          isUploading={uploadingGallery}
          maxImages={20}
        />
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          Tips for great photos
        </h4>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Use natural lighting when possible</li>
          <li>Show the entire room from multiple angles</li>
          <li>Highlight unique features and amenities</li>
          <li>Keep the room clean and styled before taking photos</li>
          <li>Use landscape orientation for the best display</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={onNext} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  );
};
