/**
 * Booking Management Feature Page
 * Feature page for the Booking Management System
 */

import React from 'react';
import { FeaturePage } from '@/pages/features';
import { bookingManagementContent } from '@/data/features/bookingManagement';

export const BookingManagementFeaturePage: React.FC = () => {
  return <FeaturePage content={bookingManagementContent} />;
};
