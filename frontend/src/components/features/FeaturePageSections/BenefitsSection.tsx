/**
 * BenefitsSection Component
 * Shows measurable benefits with stats and testimonials
 */

import React from 'react';
import { BenefitsSectionProps } from '@/pages/features/FeaturePage.types';

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({
  sectionTitle,
  type,
  stats,
  testimonial,
}) => {
  return (
    <section className="py-28 md:py-32 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {sectionTitle}
          </h2>
        </div>

        {/* Stats */}
        {(type === 'stats-only' || type === 'stats-and-testimonial') && stats && (
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white dark:bg-dark-card rounded-2xl p-8 text-center shadow-lg border border-gray-200 dark:border-dark-border hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {stat.label}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Testimonial */}
        {(type === 'testimonial-only' || type === 'stats-and-testimonial') && testimonial && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-dark-card rounded-2xl p-10 shadow-xl border border-gray-200 dark:border-dark-border">
              {/* Quote Icon */}
              <svg
                className="w-12 h-12 text-primary/20 mb-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-gray-700 dark:text-gray-200 mb-8 leading-relaxed italic">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {testimonial.authorImage && (
                  <img
                    src={testimonial.authorImage}
                    alt={testimonial.author}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.authorTitle}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
