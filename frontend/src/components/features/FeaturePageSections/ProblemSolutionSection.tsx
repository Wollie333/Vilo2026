/**
 * ProblemSolutionSection Component
 * Enhanced design with better visual hierarchy and illustrations
 */

import React from 'react';
import { ProblemSolutionSectionProps } from '@/pages/features/FeaturePage.types';

const painPointIcons = [
  // Icon 1: Spreadsheet/Document
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  // Icon 2: Clock/Time
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  // Icon 3: Currency/Money
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  // Icon 4: Bell/Notification
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>,
  // Icon 5: Question/Help
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  // Icon 6: Alert/Warning
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>,
];

export const ProblemSolutionSection: React.FC<ProblemSolutionSectionProps> = ({
  problem,
  solution,
}) => {
  return (
    <section className="py-24 bg-white dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
            {problem.title}
          </h2>
          {problem.subtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {problem.subtitle}
            </p>
          )}
        </div>

        {/* Pain Points Grid with Icons */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {problem.painPoints.map((point, index) => (
            <div
              key={index}
              className="group relative bg-gray-50 dark:bg-dark-card rounded-xl p-6 hover:bg-white dark:hover:bg-dark-card-hover border border-transparent hover:border-gray-200 dark:hover:border-dark-border transition-all duration-200 hover:shadow-sm"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex p-3 rounded-lg bg-white dark:bg-dark-bg text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors duration-200">
                {painPointIcons[index % painPointIcons.length]}
              </div>

              {/* Text */}
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {point}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline Comparison */}
        <div className="max-w-6xl mx-auto">
          {/* Without Vilo - Manual Timeline */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Without Vilo</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Manual workflow: ~45 minutes per booking</p>
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />

              <div className="relative grid grid-cols-6 gap-2">
                {solution.before.split('. ').filter(s => s.trim()).map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mb-3 animate-pulse-slow" style={{ animationDelay: `${idx * 200}ms` }}>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{idx + 1}</span>
                    </div>

                    {/* Step Label */}
                    <div className="text-center">
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight mb-2">{step.trim()}</p>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {idx === 0 ? '10m' : idx === 1 ? '8m' : idx === 2 ? '5m' : idx === 3 ? '8m' : idx === 4 ? '7m' : '7m'}
                      </div>
                    </div>

                    {/* Arrow */}
                    {idx < solution.before.split('. ').filter(s => s.trim()).length - 1 && (
                      <svg className="absolute top-6 left-[calc(50%+32px)] w-8 h-8 text-gray-300 dark:text-gray-600 animate-pulse-slow" style={{ animationDelay: `${idx * 200 + 100}ms` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Divider with Time Saved Badge */}
          <div className="flex items-center justify-center my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-full border-2 border-primary/30">
              <svg className="w-5 h-5 text-primary animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-bold text-primary">Save 95% of your time</span>
              <svg className="w-5 h-5 text-primary animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* With Vilo - Automated Timeline */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse-slow">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">With Vilo</h3>
                <p className="text-xs text-primary font-medium">Automated workflow: ~2 minutes per booking</p>
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="relative">
              {/* Timeline Line - Green */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

              <div className="relative grid grid-cols-6 gap-2">
                {solution.after.split('. ').filter(s => s.trim()).map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20 animate-scale-in" style={{ animationDelay: `${idx * 200}ms` }}>
                      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>

                    {/* Step Label */}
                    <div className="text-center">
                      <p className="text-xs text-gray-900 dark:text-white font-medium leading-tight mb-2">{step.trim()}</p>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-xs text-primary font-semibold">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Instant
                      </div>
                    </div>

                    {/* Arrow */}
                    {idx < solution.after.split('. ').filter(s => s.trim()).length - 1 && (
                      <svg className="absolute top-6 left-[calc(50%+32px)] w-8 h-8 text-primary animate-bounce-subtle" style={{ animationDelay: `${idx * 200 + 100}ms` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
