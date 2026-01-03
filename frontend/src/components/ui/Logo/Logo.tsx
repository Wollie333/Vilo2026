import { useId } from 'react';
import type { LogoProps, LogoIconProps, LogoVariant } from './Logo.types';

const sizeClasses = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  hero: 'w-32 h-32',
};

// Text font sizes (increased for better visibility)
const textSizes = {
  xs: { fontSize: 14 },
  sm: { fontSize: 18 },
  md: { fontSize: 22 },
  lg: { fontSize: 28 },
  xl: { fontSize: 36 },
  hero: { fontSize: 56 },
};

/**
 * SVG logo with optional shine animation
 * Variants:
 * - static: No animation (favicons, print, small sizes)
 * - glossy-fast: 3s shine animation (buttons, nav, general use)
 * - glossy-slow: 6s shine animation (hero, premium, dashboard)
 */
function LogoSVG({
  size,
  variant = 'static',
  className = ''
}: {
  size: string;
  variant: LogoVariant;
  className?: string;
}) {
  // Generate unique IDs for this instance to avoid conflicts with multiple logos
  const uniqueId = useId();
  const bgId = `logo-bg-${uniqueId}`;
  const shineId = `logo-shine-${uniqueId}`;
  const clipId = `logo-clip-${uniqueId}`;

  // Animation duration based on variant
  const animationDuration = variant === 'glossy-fast' ? '3s' : '6s';
  const animationPercent = variant === 'glossy-fast' ? '20%' : '10%';
  const isAnimated = variant !== 'static';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${size} ${className}`}
    >
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        {isAnimated && (
          <>
            <linearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="40%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.22" />
              <stop offset="60%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              <rect width="100" height="100" rx="22" />
            </clipPath>
            <style>
              {`
                @keyframes shine-${uniqueId.replace(/:/g, '')} {
                  0% { transform: translateX(-100%) translateY(-100%); }
                  ${animationPercent} { transform: translateX(100%) translateY(100%); }
                  100% { transform: translateX(100%) translateY(100%); }
                }
                .shine-rect-${uniqueId.replace(/:/g, '')} {
                  animation: shine-${uniqueId.replace(/:/g, '')} ${animationDuration} ease-in-out infinite;
                }
              `}
            </style>
          </>
        )}
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill={`url(#${bgId})`} />

      {/* Stacked V layers */}
      <path d="M50 76L20 32H36L50 56L64 32H80L50 76Z" fill="white" opacity="0.4" />
      <path d="M50 66L26 32H38L50 50L62 32H74L50 66Z" fill="white" opacity="0.7" />
      <path d="M50 56L32 32H40L50 46L60 32H68L50 56Z" fill="white" />

      {/* Shine overlay (animated variants only) */}
      {isAnimated && (
        <g clipPath={`url(#${clipId})`}>
          <rect
            className={`shine-rect-${uniqueId.replace(/:/g, '')}`}
            x="-50"
            y="-50"
            width="200"
            height="200"
            fill={`url(#${shineId})`}
          />
        </g>
      )}
    </svg>
  );
}

/**
 * SVG text component for "Vilo" brand name
 * - Dark mode: white text
 * - Light mode: black text
 */
function LogoText({ size }: { size: keyof typeof textSizes }) {
  const { fontSize } = textSizes[size];
  // Width is approximately 2.2x the font size for "Vilo"
  const width = Math.round(fontSize * 2.2);
  // Height matches font size (no extra line height)
  const height = fontSize;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <text
        x="0"
        y={fontSize * 0.78}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        className="fill-black dark:fill-white"
      >
        Vilo
      </text>
    </svg>
  );
}

export function Logo({
  size = 'md',
  iconSize,
  variant = 'static',
  showText = true,
  className = ''
}: LogoProps) {
  const showSubtext = size !== 'xs' && size !== 'sm';
  const effectiveIconSize = iconSize || size;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoSVG
        size={sizeClasses[effectiveIconSize]}
        variant={variant}
      />
      {showText && (
        showSubtext ? (
          <div className="flex flex-col">
            <LogoText size={size} />
            <span className="text-2xs text-gray-500 dark:text-gray-400 -mt-0.5">
              Booking Management
            </span>
          </div>
        ) : (
          <LogoText size={size} />
        )
      )}
    </div>
  );
}

export function LogoIcon({
  size = 'md',
  variant = 'static',
  className = ''
}: LogoIconProps) {
  return (
    <LogoSVG
      size={sizeClasses[size]}
      variant={variant}
      className={className}
    />
  );
}

// Export standalone SVG for use in external contexts
export { LogoSVG };
