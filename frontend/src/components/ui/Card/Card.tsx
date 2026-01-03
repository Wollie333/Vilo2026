import {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
} from './Card.types';

const variantStyles = {
  default: 'bg-white dark:bg-dark-card',
  bordered:
    'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border',
  elevated: 'bg-white dark:bg-dark-card shadow-sm border border-gray-100 dark:border-dark-border',
};

const paddingStyles = {
  none: '',
  sm: 'p-2.5',
  md: 'p-3',
  lg: 'p-4',
};

function CardComponent({
  children,
  variant = 'bordered',
  padding = 'none',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-md overflow-hidden
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div
      className={`px-4 py-2.5 border-b border-gray-200 dark:border-dark-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className = '', ...props }: CardBodyProps) {
  return (
    <div className={`p-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div
      className={`px-4 py-2.5 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-sidebar ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Compound component pattern
export const Card = Object.assign(CardComponent, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
