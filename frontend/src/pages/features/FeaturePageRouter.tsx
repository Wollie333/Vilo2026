/**
 * Feature Page Router
 * Routes to the correct feature page based on URL slug
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { FeaturePage } from './FeaturePage';
import { bookingManagementContent } from '@/data/features/bookingManagement.tsx';
import { reviewManagementContent } from '@/data/features/reviewManagement.tsx';
import { propertyManagementContent } from '@/data/features/propertyManagement.tsx';
import { calendarContent } from '@/data/features/calendar.tsx';
import { paymentRulesContent } from '@/data/features/paymentRules.tsx';
import { zeroCommissionContent } from '@/data/features/zeroCommission.tsx';
import { invoicingContent } from '@/data/features/invoicing.tsx';
import { refundManagementContent } from '@/data/features/refundManagement.tsx';
import { analyticsContent } from '@/data/features/analytics.tsx';
import { guestPortalContent } from '@/data/features/guestPortal.tsx';
import { chatContent } from '@/data/features/chat.tsx';
import { promotionsContent } from '@/data/features/promotions.tsx';
import type { FeaturePageContent } from './FeaturePage.types';

// Map slugs to feature content
const featureContentMap: Record<string, FeaturePageContent> = {
  'booking-management': bookingManagementContent,
  'property-management': propertyManagementContent,
  'calendar': calendarContent,
  'payment-rules': paymentRulesContent,
  'zero-commission': zeroCommissionContent,
  'invoicing': invoicingContent,
  'refund-management': refundManagementContent,
  'analytics': analyticsContent,
  'guest-portal': guestPortalContent,
  'reviews': reviewManagementContent,
  'chat': chatContent,
  'promotions': promotionsContent,
};

export const FeaturePageRouter: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug || !featureContentMap[slug]) {
    // Redirect to for-hosts page if feature not found
    return <Navigate to="/for-hosts" replace />;
  }

  const content = featureContentMap[slug];
  return <FeaturePage content={content} />;
};
