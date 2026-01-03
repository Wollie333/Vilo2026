import { ReactNode } from 'react';

export type ProgressStepStatus = 'completed' | 'current' | 'upcoming';

export interface ProgressStep {
  /** Unique identifier for the step */
  id: string | number;
  /** Label displayed for the step */
  label: string;
  /** Optional description shown below the label */
  description?: string;
  /** Optional custom icon for the step */
  icon?: ReactNode;
  /** Whether the step is disabled (non-clickable) */
  disabled?: boolean;
}

export interface ProgressStepsProps {
  /** Array of steps to display */
  steps: ProgressStep[];
  /** Current active step index (0-based) */
  currentStep: number;
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Visual variant style */
  variant?: 'dots' | 'numbers' | 'icons';
  /** Size of the step indicators */
  size?: 'sm' | 'md' | 'lg';
  /** Whether steps are clickable for navigation */
  clickable?: boolean;
  /** Callback when a step is clicked (only if clickable) */
  onStepClick?: (stepIndex: number, step: ProgressStep) => void;
  /** Whether to show step descriptions */
  showDescriptions?: boolean;
  /** Additional CSS classes */
  className?: string;
}
