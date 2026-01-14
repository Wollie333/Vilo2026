/**
 * FeatureShowcaseSection Component
 * Deep-dive feature sections with alternating image/content layout
 * Pattern: Large headline + description + 2x2 grid of sub-features + visual demo
 * Enhanced with scroll-triggered animations
 */

import React, { useEffect, useRef, useState } from 'react';
import { FeatureDeepDive } from '@/pages/features/FeaturePage.types';

interface FeatureShowcaseSectionProps {
  deepDive: FeatureDeepDive;
  index: number;
}

export const FeatureShowcaseSection: React.FC<FeatureShowcaseSectionProps> = ({
  deepDive,
  index,
}) => {
  const { headline, description, subFeatures, illustration, imagePosition } = deepDive;
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Determine if content should be on left or right
  const contentOnLeft = imagePosition === 'right';

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-white dark:bg-dark-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 items-center ${contentOnLeft ? '' : 'lg:grid-flow-dense'}`}>
          {/* Content Column */}
          <div
            className={`${contentOnLeft ? '' : 'lg:col-start-2'} transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {headline}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {description}
            </p>

            {/* 2x2 Grid of Sub-Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {subFeatures.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${400 + idx * 100}ms` }}
                >
                  <div className="flex items-start gap-3 mb-2 group">
                    {/* Icon with hover animation */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:bg-primary/20">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration Column with animation */}
          <div
            className={`relative ${contentOnLeft ? 'lg:col-start-2' : 'lg:col-start-1 lg:row-start-1'} transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${contentOnLeft ? 'translate-x-8' : '-translate-x-8'}`
            }`}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:shadow-3xl transition-shadow duration-300">
              {/* Add glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              {illustration}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
