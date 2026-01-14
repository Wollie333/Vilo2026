/**
 * Review Management Feature Page
 * Feature page for the Reviews & Ratings System
 */

import React from 'react';
import { FeaturePage } from '@/pages/features';
import { reviewManagementContent } from '@/data/features/reviewManagement';

export const ReviewManagementFeaturePage: React.FC = () => {
  return <FeaturePage content={reviewManagementContent} />;
};
