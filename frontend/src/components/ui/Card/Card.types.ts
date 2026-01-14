import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Content inside the card */
  children: ReactNode;
  /** Visual style variant */
  variant?: 'default' | 'bordered' | 'elevated' | 'highlight' | 'feature' | 'gradient';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether the card is interactive (adds hover effects) */
  interactive?: boolean;
  /** Whether the card is currently selected/active */
  selected?: boolean;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
