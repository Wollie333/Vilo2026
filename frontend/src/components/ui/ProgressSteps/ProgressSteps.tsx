import {
  ProgressStepsProps,
  ProgressStep,
  ProgressStepStatus,
} from './ProgressSteps.types';

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const sizeStyles = {
  sm: {
    indicator: 'w-6 h-6 text-2xs',
    connector: 'h-0.5',
    connectorVertical: 'w-0.5 h-6',
    label: 'text-xs',
    description: 'text-2xs',
    iconSize: 'w-3 h-3',
  },
  md: {
    indicator: 'w-8 h-8 text-xs',
    connector: 'h-0.5',
    connectorVertical: 'w-0.5 h-8',
    label: 'text-sm',
    description: 'text-xs',
    iconSize: 'w-4 h-4',
  },
  lg: {
    indicator: 'w-10 h-10 text-sm',
    connector: 'h-1',
    connectorVertical: 'w-1 h-10',
    label: 'text-base',
    description: 'text-sm',
    iconSize: 'w-5 h-5',
  },
};

function getStepStatus(
  stepIndex: number,
  currentStep: number
): ProgressStepStatus {
  if (stepIndex < currentStep) return 'completed';
  if (stepIndex === currentStep) return 'current';
  return 'upcoming';
}

function StepIndicator({
  step,
  stepIndex,
  status,
  variant,
  size,
  clickable,
  disabled,
  onClick,
}: {
  step: ProgressStep;
  stepIndex: number;
  status: ProgressStepStatus;
  variant: 'dots' | 'numbers' | 'icons';
  size: 'sm' | 'md' | 'lg';
  clickable: boolean;
  disabled: boolean;
  onClick?: () => void;
}) {
  const styles = sizeStyles[size];

  const baseClasses = `
    ${styles.indicator}
    rounded-full
    flex items-center justify-center
    font-medium
    transition-all duration-200
    shrink-0
  `;

  const statusClasses = {
    completed:
      'bg-primary text-brand-black ring-2 ring-primary/20',
    current:
      'bg-primary text-brand-black ring-4 ring-primary/30 shadow-md',
    upcoming:
      'bg-gray-200 text-gray-500 dark:bg-dark-border dark:text-gray-400',
  };

  const interactiveClasses =
    clickable && !disabled
      ? 'cursor-pointer hover:scale-110 hover:ring-primary/40'
      : disabled
      ? 'cursor-not-allowed opacity-50'
      : '';

  const handleClick = () => {
    if (clickable && !disabled && onClick) {
      onClick();
    }
  };

  const renderContent = () => {
    if (status === 'completed' && variant !== 'icons') {
      return <CheckIcon className={styles.iconSize} />;
    }

    if (variant === 'icons' && step.icon) {
      return step.icon;
    }

    if (variant === 'numbers' || variant === 'icons') {
      return stepIndex + 1;
    }

    // dots variant
    if (status === 'current') {
      return <span className="w-2 h-2 bg-brand-black rounded-full" />;
    }

    return null;
  };

  return (
    <div
      className={`${baseClasses} ${statusClasses[status]} ${interactiveClasses}`}
      onClick={handleClick}
      role={clickable && !disabled ? 'button' : undefined}
      tabIndex={clickable && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && clickable && !disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-current={status === 'current' ? 'step' : undefined}
    >
      {renderContent()}
    </div>
  );
}

function StepConnector({
  status,
  orientation,
  size,
}: {
  status: 'completed' | 'upcoming';
  orientation: 'horizontal' | 'vertical';
  size: 'sm' | 'md' | 'lg';
}) {
  const styles = sizeStyles[size];

  const baseClasses =
    orientation === 'horizontal'
      ? `flex-1 ${styles.connector}`
      : `${styles.connectorVertical} mx-auto`;

  const colorClasses =
    status === 'completed'
      ? 'bg-primary'
      : 'bg-gray-200 dark:bg-dark-border';

  return (
    <div
      className={`${baseClasses} ${colorClasses} transition-colors duration-200`}
      aria-hidden="true"
    />
  );
}

export function ProgressSteps({
  steps,
  currentStep,
  orientation = 'horizontal',
  variant = 'numbers',
  size = 'md',
  clickable = false,
  onStepClick,
  showDescriptions = true,
  className = '',
}: ProgressStepsProps) {
  const styles = sizeStyles[size];

  const containerClasses =
    orientation === 'horizontal'
      ? 'flex items-start w-full'
      : 'flex flex-col';

  return (
    <nav
      className={`${containerClasses} ${className}`}
      aria-label="Progress steps"
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index, currentStep);
        const isLast = index === steps.length - 1;

        if (orientation === 'horizontal') {
          return (
            <div
              key={step.id}
              className={`flex items-start ${isLast ? '' : 'flex-1'}`}
            >
              <div className="flex flex-col items-center">
                <StepIndicator
                  step={step}
                  stepIndex={index}
                  status={status}
                  variant={variant}
                  size={size}
                  clickable={clickable}
                  disabled={step.disabled ?? false}
                  onClick={() => onStepClick?.(index, step)}
                />
                <div className="mt-2 text-center">
                  <p
                    className={`
                      ${styles.label}
                      font-medium
                      ${
                        status === 'current'
                          ? 'text-gray-900 dark:text-white'
                          : status === 'completed'
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  {showDescriptions && step.description && (
                    <p
                      className={`
                        ${styles.description}
                        mt-0.5
                        text-gray-500 dark:text-gray-400
                        max-w-[120px]
                      `}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className="flex-1 mt-3 mx-2">
                  <StepConnector
                    status={status === 'completed' ? 'completed' : 'upcoming'}
                    orientation="horizontal"
                    size={size}
                  />
                </div>
              )}
            </div>
          );
        }

        // Vertical orientation
        return (
          <div key={step.id} className="flex">
            <div className="flex flex-col items-center">
              <StepIndicator
                step={step}
                stepIndex={index}
                status={status}
                variant={variant}
                size={size}
                clickable={clickable}
                disabled={step.disabled ?? false}
                onClick={() => onStepClick?.(index, step)}
              />
              {!isLast && (
                <div className="py-1">
                  <StepConnector
                    status={status === 'completed' ? 'completed' : 'upcoming'}
                    orientation="vertical"
                    size={size}
                  />
                </div>
              )}
            </div>
            <div className="ml-3 pb-6">
              <p
                className={`
                  ${styles.label}
                  font-medium
                  ${
                    status === 'current'
                      ? 'text-gray-900 dark:text-white'
                      : status === 'completed'
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {step.label}
              </p>
              {showDescriptions && step.description && (
                <p
                  className={`
                    ${styles.description}
                    mt-0.5
                    text-gray-500 dark:text-gray-400
                  `}
                >
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
