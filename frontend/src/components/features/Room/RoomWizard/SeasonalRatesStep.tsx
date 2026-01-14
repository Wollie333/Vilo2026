/**
 * SeasonalRatesStep Component
 *
 * Step for managing seasonal rates.
 */

import React from 'react';
import type { SeasonalRatesStepProps } from './RoomWizard.types';
import { MarketingStep } from './MarketingStep';

export const SeasonalRatesStep: React.FC<SeasonalRatesStepProps> = (props) => {
  return <MarketingStep {...props} onSubmit={props.onNext} showOnly="seasonal_rates" />;
};
