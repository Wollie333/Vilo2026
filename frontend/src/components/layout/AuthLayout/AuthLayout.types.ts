import { ReactNode } from 'react';

export interface AuthLayoutProps {
  /** Content of the auth page */
  children: ReactNode;
  /** Title displayed above the form */
  title: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Show the logo */
  showLogo?: boolean;
}
