/**
 * EditPromoCodePage
 *
 * Page for editing an existing promo code.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { PromoCodeForm } from '@/components/features/PromoCodeForm';
import { promotionsService } from '@/services/promotions.service';
import { PromoCodeFormData } from '@/components/features/PromoCodeForm';
import { RoomPromotion } from '@/types/room.types';

export const EditPromoCodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState<RoomPromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromo = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const promo = await promotionsService.getPromotionById(id);
        setPromoCode(promo);
      } catch (err: any) {
        setError(err.message || 'Failed to load promo code');
      } finally {
        setLoading(false);
      }
    };

    fetchPromo();
  }, [id]);

  const handleSubmit = async (data: PromoCodeFormData) => {
    if (!id) return;

    await promotionsService.updatePromotion(id, data);
    navigate('/manage/rooms/promo-codes');
  };

  const handleCancel = () => {
    navigate('/manage/rooms/promo-codes');
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !promoCode) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400">
              {error || 'Promo code not found'}
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Promo Code
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update promotional code details
          </p>
        </div>

        <PromoCodeForm
          mode="edit"
          promoCode={promoCode}
          propertyId={promoCode.property_id || ''}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
