/**
 * Feature Page Types
 * TypeScript interfaces for StoryBrand framework feature pages
 */

// CTA (Call to Action) button configuration
export interface CTAButton {
  text: string;
  href: string;
}

// Hero Section
export interface HeroSectionProps {
  featureName?: string; // Optional feature name pill above headline
  headline: string;
  subheadline: string;
  primaryCTA: CTAButton;
  secondaryCTA?: CTAButton;
  trustBadge?: string;
  illustration: React.ReactNode;
}

// Problem/Solution Section - Simplified
export interface ProblemSolutionSectionProps {
  problem: {
    title: string;
    subtitle?: string; // Optional subtitle below title
    painPoints: string[];
  };
  solution: {
    before: string;
    after: string;
  };
}

// Key Features Section
export interface KeyFeature {
  icon: string; // Icon name
  name: string;
  description: string;
}

export interface KeyFeaturesSectionProps {
  title: string;
  features: KeyFeature[];
}

// Benefits Section - Simplified
export interface BenefitStat {
  value: string;
  label: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  business: string; // Changed from authorTitle to business
  rating: number;
  authorImage?: string;
}

export interface BenefitsSectionProps {
  title: string;
  stats: BenefitStat[];
  testimonial: Testimonial;
}

// CTA Section
export interface CTASectionProps {
  headline: string;
  subtext: string;
  primaryCTA: CTAButton;
  secondaryCTA?: CTAButton;
}

// Feature Deep Dive Section (like "Accept payments directly" section)
export interface FeatureDeepDive {
  headline: string;
  description: string;
  subFeatures: {
    icon: string;
    title: string;
    description: string;
  }[];
  illustration: React.ReactNode;
  imagePosition: 'left' | 'right'; // Alternating layout
}

// Full Feature Page Content Configuration
export interface FeaturePageContent {
  metadata: {
    title: string;
    description: string;
    slug: string;
  };
  hero: HeroSectionProps;
  problemSolution: ProblemSolutionSectionProps;
  featureShowcase?: FeatureDeepDive[]; // NEW: Optional deep-dive sections
  keyFeatures: KeyFeaturesSectionProps;
  benefits: BenefitsSectionProps;
  cta: CTASectionProps;
}
