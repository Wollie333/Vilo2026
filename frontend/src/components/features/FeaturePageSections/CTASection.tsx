/**
 * CTASection Component
 * Final call-to-action section for feature pages
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CTASectionProps } from '@/pages/features/FeaturePage.types';

export const CTASection: React.FC<CTASectionProps> = ({
  headline,
  subtext,
  primaryCTA,
  secondaryCTA,
}) => {
  return (
    <section className="py-28 md:py-32 bg-gradient-to-r from-primary to-teal-600 relative overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          {headline}
        </h2>

        <p className="text-lg md:text-xl text-white opacity-90 mb-10">
          {subtext}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={primaryCTA.href}
            className="px-10 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {primaryCTA.text}
          </Link>
          {secondaryCTA && (
            <Link
              to={secondaryCTA.href}
              className="px-10 py-4 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold rounded-lg transition-all border-2 border-white border-opacity-40"
            >
              {secondaryCTA.text}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
