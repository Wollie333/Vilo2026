export type LogoVariant = 'static' | 'glossy-fast' | 'glossy-slow';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface LogoProps {
  size?: LogoSize;
  iconSize?: LogoSize;  // Override icon size independently of text size
  variant?: LogoVariant;
  showText?: boolean;
  className?: string;
}

export interface LogoIconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: LogoVariant;
  className?: string;
}
