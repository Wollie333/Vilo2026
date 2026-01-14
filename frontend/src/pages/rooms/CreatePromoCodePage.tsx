/**
 * CreatePromoCodePage
 *
 * Page for creating a new promo code at property level.
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { PromoCodeForm } from '@/components/features/PromoCodeForm';
import { promotionsService } from '@/services/promotions.service';
import { PromoCodeFormData } from '@/components/features/PromoCodeForm';

export const CreatePromoCodePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property_id');

  // If no property_id, redirect to management page
  useEffect(() => {
    if (!propertyId) {
      navigate('/manage/rooms/promo-codes');
    }
  }, [propertyId, navigate]);

  if (!propertyId) {
    return null;
  }

  const handleSubmit = async (data: PromoCodeFormData) => {
    await promotionsService.createPromotion({
      ...data,
      property_id: propertyId,
    });
    navigate('/manage/rooms/promo-codes');
  };

  const handleCancel = () => {
    navigate('/manage/rooms/promo-codes');
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Promo Code
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create a new promotional code for your property
          </p>
        </div>

        <PromoCodeForm
          mode="create"
          propertyId={propertyId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
