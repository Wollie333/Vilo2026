/**
 * PromoCodesStep Component
 *
 * Step for managing promo codes.
 */

import React from 'react';
import type { PromoCodesStepProps } from './RoomWizard.types';
import { MarketingStep } from './MarketingStep';

export const PromoCodesStep: React.FC<PromoCodesStepProps> = (props) => {
  return <MarketingStep {...props} showOnly="promotions" />;
};
