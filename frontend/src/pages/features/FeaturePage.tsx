/**
 * FeaturePage Template Component
 * Reusable template for all feature pages following StoryBrand framework
 */

import React, { useEffect } from 'react';
import { PublicLayout } from '@/components/layout';
import {
  HeroSection,
  ProblemSolutionSection,
  FeatureShowcaseSection,
  KeyFeaturesSection,
  BenefitsSection,
  CTASection,
} from '@/components/features/FeaturePageSections';
import { FeaturePageContent } from './FeaturePage.types';

interface FeaturePageProps {
  content: FeaturePageContent;
}

export const FeaturePage: React.FC<FeaturePageProps> = ({ content }) => {
  // Set page metadata
  useEffect(() => {
    document.title = `${content.metadata.title} | Vilo`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', content.metadata.description);
    }
  }, [content]);

  return (
    <PublicLayout transparentHeader menuType="for-hosts">
      <HeroSection {...content.hero} />
      <ProblemSolutionSection {...content.problemSolution} />

      {/* Feature Showcase Deep-Dive Sections */}
      {content.featureShowcase && content.featureShowcase.map((deepDive, index) => (
        <FeatureShowcaseSection key={index} deepDive={deepDive} index={index} />
      ))}

      <KeyFeaturesSection {...content.keyFeatures} />
      <BenefitsSection {...content.benefits} />
      <CTASection {...content.cta} />
    </PublicLayout>
  );
};
