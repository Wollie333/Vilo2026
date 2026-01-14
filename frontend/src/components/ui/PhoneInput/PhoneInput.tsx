import { forwardRef, useState, useEffect, useRef } from 'react';
import type { PhoneInputProps, CountryCode } from './PhoneInput.types';

// Country codes with flags (emoji) and dial codes
const COUNTRIES: CountryCode[] = [
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', maxDigits: 10, format: 'XXX XXX XXXX' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', maxDigits: 10, format: 'XXXX XXXXXX' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', maxDigits: 11, format: 'XXX XXXXXXXX' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', maxDigits: 9, format: 'X XX XX XX XX' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', maxDigits: 10, format: 'XXX XXX XXXX' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', maxDigits: 9, format: 'XXX XX XX XX' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', maxDigits: 9, format: 'XX XXX XX XX' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', maxDigits: 10, format: 'XXX XXXXXXX' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', maxDigits: 9, format: 'XX XXX XX XX' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', maxDigits: 8, format: 'XXX XX XXX' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', maxDigits: 8, format: 'XX XX XX XX' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', maxDigits: 10, format: 'XX XXX XXXX' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', maxDigits: 10, format: 'XXX XXX XXXX' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', maxDigits: 11, format: 'XX XXXXX XXXX' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', maxDigits: 10, format: 'XXX XXX XXXX' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', maxDigits: 10, format: 'XXXXX XXXXX' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', maxDigits: 11, format: 'XXX XXXX XXXX' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', maxDigits: 10, format: 'XX XXXX XXXX' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', maxDigits: 10, format: 'XX XXXX XXXX' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', maxDigits: 8, format: 'XXXX XXXX' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', maxDigits: 8, format: 'XXXX XXXX' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', maxDigits: 10, format: 'XXX XXX XXXX' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', maxDigits: 10, format: 'XXX XXX XXXX' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼', maxDigits: 9, format: 'XXX XXX XXX' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼', maxDigits: 8, format: 'XX XXX XXX' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿', maxDigits: 9, format: 'XX XXX XXXX' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲', maxDigits: 9, format: 'XX XXX XXXX' },
];

const sizeStyles = {
  sm: 'py-1 text-xs',
  md: 'py-1.5 text-sm',
  lg: 'py-2 text-sm',
};

// Generic format for phone display based on country
const formatPhoneDisplay = (digits: string, maxDigits: number): string => {
  const cleaned = digits.replace(/\D/g, '').slice(0, maxDigits);
  if (cleaned.length === 0) return '';

  // Simple chunking for display (groups of 3-4)
  const chunks: string[] = [];
  let remaining = cleaned;

  while (remaining.length > 0) {
    if (remaining.length <= 4) {
      chunks.push(remaining);
      break;
    }
    chunks.push(remaining.slice(0, 3));
    remaining = remaining.slice(3);
  }

  return chunks.join(' ');
};

// Extract digits only from formatted value
const extractDigits = (value: string, maxDigits: number): string => {
  return value.replace(/\D/g, '').slice(0, maxDigits);
};

// Chevron icon component
const ChevronDownIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// SVG Flag Icons Component
const FlagIcon: React.FC<{ countryCode: string }> = ({ countryCode }) => {
  const flags: Record<string, JSX.Element> = {
    'ZA': ( // South Africa
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        {/* Red top section */}
        <rect width="24" height="6.4" fill="#DE3831" />
        {/* Blue bottom section */}
        <rect y="9.6" width="24" height="6.4" fill="#002395" />

        {/* White Y separators */}
        <path d="M0,6.4 L12,6.4 L24,0 L24,1.6 L12.5,7 L0,7 Z" fill="#FFF" />
        <path d="M0,9.6 L12,9.6 L24,16 L24,14.4 L12.5,9 L0,9 Z" fill="#FFF" />

        {/* Green Y horizontal band */}
        <path d="M0,7 L12.5,7 L24,1.6 L24,3.2 L13.5,8 L24,12.8 L24,14.4 L12.5,9 L0,9 Z" fill="#007A4D" />

        {/* Yellow Y borders */}
        <path d="M0,6.7 L12.3,6.7 L24,1 L24,2.2 L12.7,7.3 L0,7.3 Z" fill="#FFB612" />
        <path d="M0,9.3 L12.3,9.3 L24,15 L24,13.8 L12.7,8.7 L0,8.7 Z" fill="#FFB612" />

        {/* Black Y borders */}
        <path d="M0,7.3 L12.7,7.3 L24,2.2 L24,3 L13,7.7 L0,7.7 Z" fill="#000" />
        <path d="M0,8.7 L12.7,8.7 L24,13.8 L24,13 L13,8.3 L0,8.3 Z" fill="#000" />

        {/* Green triangle on hoist */}
        <path d="M0,0 L0,16 L8,8 Z" fill="#007A4D" />
        {/* Yellow triangle border */}
        <path d="M0,0 L0,16 L6.5,8 Z" fill="#FFB612" />
        {/* Black triangle border */}
        <path d="M0,0 L0,16 L5.5,8 Z" fill="#000" />
        {/* Green triangle center */}
        <path d="M0,0 L0,16 L4.5,8 Z" fill="#007A4D" />
      </svg>
    ),
    'US': ( // United States
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#B22234" />
        <path d="M0,0 h24 v1.23 h-24 z M0,2.46 h24 v1.23 h-24 z M0,4.92 h24 v1.23 h-24 z M0,7.38 h24 v1.23 h-24 z M0,9.84 h24 v1.23 h-24 z M0,12.3 h24 v1.23 h-24 z M0,14.77 h24 v1.23 h-24 z" fill="#FFF" />
        <rect width="9.6" height="8.62" fill="#3C3B6E" />
      </svg>
    ),
    'GB': ( // United Kingdom
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#012169" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#FFF" strokeWidth="3" />
        <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="2" />
        <path d="M12,0 v16 M0,8 h24" stroke="#FFF" strokeWidth="5" />
        <path d="M12,0 v16 M0,8 h24" stroke="#C8102E" strokeWidth="3" />
      </svg>
    ),
    'DE': ( // Germany
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#000" />
        <rect y="5.33" width="24" height="5.33" fill="#D00" />
        <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
      </svg>
    ),
    'FR': ( // France
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="8" height="16" fill="#002395" />
        <rect x="8" width="8" height="16" fill="#FFF" />
        <rect x="16" width="8" height="16" fill="#ED2939" />
      </svg>
    ),
    'IT': ( // Italy
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="8" height="16" fill="#009246" />
        <rect x="8" width="8" height="16" fill="#FFF" />
        <rect x="16" width="8" height="16" fill="#CE2B37" />
      </svg>
    ),
    'ES': ( // Spain
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#AA151B" />
        <rect y="4" width="24" height="8" fill="#F1BF00" />
      </svg>
    ),
    'NL': ( // Netherlands
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#AE1C28" />
        <rect y="5.33" width="24" height="5.33" fill="#FFF" />
        <rect y="10.67" width="24" height="5.33" fill="#21468B" />
      </svg>
    ),
    'BR': ( // Brazil
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#009B3A" />
        <path d="M2,8 L12,2 L22,8 L12,14 Z" fill="#FEDF00" />
        <circle cx="12" cy="8" r="3" fill="#002776" />
      </svg>
    ),
    'CA': ( // Canada
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#FFF" />
        <rect width="6" height="16" fill="#FF0000" />
        <rect x="18" width="6" height="16" fill="#FF0000" />
        <path d="M12,4 l1,2 l2,1 l-1.5,0.5 l0,2 l-1.5,-1.5 l-1.5,1.5 l0,-2 l-1.5,-0.5 l2,-1 Z" fill="#FF0000" />
      </svg>
    ),
    'AU': ( // Australia
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#00008B" />
        <path d="M0,0 L6,4 L0,8 Z" fill="#FFF" />
        <path d="M0,0 L6,4 M0,8 L6,4" stroke="#C8102E" strokeWidth="0.8" />
        <path d="M6,0 v8 M0,4 h6" stroke="#FFF" strokeWidth="1.6" />
        <path d="M6,0 v8 M0,4 h6" stroke="#C8102E" strokeWidth="0.8" />
      </svg>
    ),
    'IN': ( // India
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#FF9933" />
        <rect y="5.33" width="24" height="5.33" fill="#FFF" />
        <rect y="10.67" width="24" height="5.33" fill="#138808" />
        <circle cx="12" cy="8" r="2" fill="none" stroke="#000080" strokeWidth="0.3" />
      </svg>
    ),
    'CN': ( // China
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#DE2910" />
        <path d="M4,4 l0.5,1.5 l1.5,0 l-1.2,0.9 l0.5,1.5 l-1.2,-0.9 l-1.2,0.9 l0.5,-1.5 l-1.2,-0.9 l1.5,0 Z" fill="#FFDE00" />
      </svg>
    ),
    'JP': ( // Japan
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#FFF" />
        <circle cx="12" cy="8" r="4.8" fill="#BC002D" />
      </svg>
    ),
    'MX': ( // Mexico
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="8" height="16" fill="#006847" />
        <rect x="8" width="8" height="16" fill="#FFF" />
        <rect x="16" width="8" height="16" fill="#CE1126" />
      </svg>
    ),
    'KR': ( // South Korea
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#FFF" />
        <circle cx="12" cy="8" r="3" fill="#C60C30" />
        <path d="M12,8 A3,3 0 0,1 12,8 Z" fill="#003478" />
      </svg>
    ),
    'SG': ( // Singapore
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="8" fill="#ED2939" />
        <rect y="8" width="24" height="8" fill="#FFF" />
      </svg>
    ),
    'AE': ( // UAE
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#FFF" />
        <rect y="0" width="24" height="5.33" fill="#00732F" />
        <rect y="10.67" width="24" height="5.33" fill="#000" />
        <rect width="7" height="16" fill="#FF0000" />
      </svg>
    ),
    'SA': ( // Saudi Arabia
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#165B33" />
        <text x="12" y="11" fill="#FFF" fontSize="8" textAnchor="middle" fontWeight="bold">SA</text>
      </svg>
    ),
    'EG': ( // Egypt
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#CE1126" />
        <rect y="5.33" width="24" height="5.33" fill="#FFF" />
        <rect y="10.67" width="24" height="5.33" fill="#000" />
      </svg>
    ),
    'NG': ( // Nigeria
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="8" height="16" fill="#008751" />
        <rect x="8" width="8" height="16" fill="#FFF" />
        <rect x="16" width="8" height="16" fill="#008751" />
      </svg>
    ),
    'KE': ( // Kenya
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="4.8" fill="#000" />
        <rect y="4.8" width="24" height="1.6" fill="#FFF" />
        <rect y="6.4" width="24" height="3.2" fill="#BB0000" />
        <rect y="9.6" width="24" height="1.6" fill="#FFF" />
        <rect y="11.2" width="24" height="4.8" fill="#006600" />
      </svg>
    ),
    'PT': ( // Portugal
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="9.6" height="16" fill="#006600" />
        <rect x="9.6" width="14.4" height="16" fill="#FF0000" />
      </svg>
    ),
    'BE': ( // Belgium
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="8" height="16" fill="#000" />
        <rect x="8" width="8" height="16" fill="#FFE000" />
        <rect x="16" width="8" height="16" fill="#FF0000" />
      </svg>
    ),
    'CH': ( // Switzerland
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#FF0000" />
        <rect x="10" y="4" width="4" height="8" fill="#FFF" />
        <rect x="6" y="6" width="12" height="4" fill="#FFF" />
      </svg>
    ),
    'AT': ( // Austria
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#ED2939" />
        <rect y="5.33" width="24" height="5.33" fill="#FFF" />
        <rect y="10.67" width="24" height="5.33" fill="#ED2939" />
      </svg>
    ),
    'SE': ( // Sweden
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#006AA7" />
        <rect x="6" width="3" height="16" fill="#FECC00" />
        <rect y="6.5" width="24" height="3" fill="#FECC00" />
      </svg>
    ),
    'NO': ( // Norway
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#BA0C2F" />
        <rect x="6" width="4" height="16" fill="#FFF" />
        <rect y="6" width="24" height="4" fill="#FFF" />
        <rect x="7" width="2" height="16" fill="#00205B" />
        <rect y="7" width="24" height="2" fill="#00205B" />
      </svg>
    ),
    'DK': ( // Denmark
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#C8102E" />
        <rect x="6" width="3" height="16" fill="#FFF" />
        <rect y="6.5" width="24" height="3" fill="#FFF" />
      </svg>
    ),
    'FI': ( // Finland
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#FFF" />
        <rect x="6" width="3" height="16" fill="#003580" />
        <rect y="6.5" width="24" height="3" fill="#003580" />
      </svg>
    ),
    'IE': ( // Ireland
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="8" height="16" fill="#169B62" />
        <rect x="8" width="8" height="16" fill="#FFF" />
        <rect x="16" width="8" height="16" fill="#FF883E" />
      </svg>
    ),
    'NZ': ( // New Zealand
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#00247D" />
        <path d="M0,0 L6,4 L0,8 Z" fill="#FFF" />
        <path d="M0,0 L6,4 M0,8 L6,4" stroke="#C8102E" strokeWidth="0.8" />
        <path d="M6,0 v8 M0,4 h6" stroke="#FFF" strokeWidth="1.6" />
        <path d="M6,0 v8 M0,4 h6" stroke="#C8102E" strokeWidth="0.8" />
      </svg>
    ),
    'HK': ( // Hong Kong
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#DE2910" />
        <circle cx="12" cy="8" r="3" fill="none" stroke="#FFF" strokeWidth="0.5" />
      </svg>
    ),
    'GH': ( // Ghana
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#CE1126" />
        <rect y="5.33" width="24" height="5.33" fill="#FCD116" />
        <rect y="10.67" width="24" height="5.33" fill="#006B3F" />
        <path d="M12,6 l0.5,1.5 l1.5,0 l-1.2,0.9 l0.5,1.5 l-1.2,-0.9 l-1.2,0.9 l0.5,-1.5 l-1.2,-0.9 l1.5,0 Z" fill="#000" />
      </svg>
    ),
    'TZ': ( // Tanzania
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#1EB53A" />
        <path d="M0,0 L24,16 L0,16 Z" fill="#00A3DD" />
        <path d="M0,13 L24,0 L24,3 L3,16 L0,16 Z" fill="#000" stroke="#FCD116" strokeWidth="1.5" />
      </svg>
    ),
    'UG': ( // Uganda
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="2.67" fill="#000" />
        <rect y="2.67" width="24" height="2.67" fill="#FCDC04" />
        <rect y="5.33" width="24" height="2.67" fill="#D90000" />
        <rect y="8" width="24" height="2.67" fill="#000" />
        <rect y="10.67" width="24" height="2.67" fill="#FCDC04" />
        <rect y="13.33" width="24" height="2.67" fill="#D90000" />
      </svg>
    ),
    'RW': ( // Rwanda
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="8" fill="#00A1DE" />
        <rect y="8" width="24" height="4" fill="#FAD201" />
        <rect y="12" width="24" height="4" fill="#20603D" />
      </svg>
    ),
    'ZW': ( // Zimbabwe
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="2.29" fill="#009A44" />
        <rect y="2.29" width="24" height="2.29" fill="#FFD200" />
        <rect y="4.57" width="24" height="2.29" fill="#D40000" />
        <rect y="6.86" width="24" height="2.29" fill="#000" />
        <rect y="9.14" width="24" height="2.29" fill="#FFD200" />
        <rect y="11.43" width="24" height="4.57" fill="#009A44" />
        <path d="M0,0 L8,8 L0,16 Z" fill="#FFF" />
      </svg>
    ),
    'BW': ( // Botswana
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#75AADB" />
        <rect y="6" width="24" height="4" fill="#000" />
        <rect y="7" width="24" height="2" fill="#FFF" />
      </svg>
    ),
    'NA': ( // Namibia
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#003580" />
        <path d="M0,0 L24,16 L24,13 L3,0 Z" fill="#FFF" />
        <path d="M0,0 L24,16 L24,14 L2,0 Z" fill="#C8102E" />
        <path d="M0,3 L21,16 L24,16 L24,16 L0,0 Z" fill="#FFF" />
        <rect y="13" width="24" height="3" fill="#009543" />
      </svg>
    ),
    'MZ': ( // Mozambique
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="5.33" fill="#009543" />
        <rect y="5.33" width="24" height="5.33" fill="#000" />
        <rect y="10.67" width="24" height="5.33" fill="#FCE100" />
        <path d="M0,0 L10,8 L0,16 Z" fill="#C8102E" />
      </svg>
    ),
    'ZM': ( // Zambia
      <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
        <rect width="24" height="16" fill="#198A00" />
        <rect x="18" width="6" height="2.67" fill="#EF7D00" />
        <rect x="18" y="2.67" width="6" height="2.67" fill="#000" />
        <rect x="18" y="5.33" width="6" height="2.67" fill="#DE2010" />
      </svg>
    ),
  };

  // Default flag for countries without custom SVG
  const defaultFlag = (
    <svg viewBox="0 0 24 16" className="w-6 h-4 rounded shadow-sm border border-gray-200 dark:border-gray-600">
      <rect width="24" height="16" fill="#4B5563" />
      <text x="12" y="11" fill="#FFF" fontSize="6" textAnchor="middle" fontWeight="bold">{countryCode}</text>
    </svg>
  );

  return flags[countryCode] || defaultFlag;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'md',
      value = '',
      onChange,
      onCountryChange,
      onBlur,
      disabled = false,
      fullWidth = false,
      name,
      placeholder,
      defaultCountry = 'ZA',
    },
    ref
  ) => {
    // Find default country
    const defaultCountryObj = COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0];

    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountryObj);
    const [displayValue, setDisplayValue] = useState(() =>
      formatPhoneDisplay(value, selectedCountry.maxDigits)
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const inputId = `phone-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    // Filter countries based on search
    const filteredCountries = COUNTRIES.filter(country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sync display value when external value changes
    useEffect(() => {
      setDisplayValue(formatPhoneDisplay(value, selectedCountry.maxDigits));
    }, [value, selectedCountry.maxDigits]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
          setSearchQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isDropdownOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isDropdownOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const cleanedInput = input.replace(new RegExp(`^\\${selectedCountry.dialCode}\\s*`), '');
      const digits = extractDigits(cleanedInput, selectedCountry.maxDigits);
      const formatted = formatPhoneDisplay(digits, selectedCountry.maxDigits);

      setDisplayValue(formatted);
      onChange?.(digits);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
      if (allowedKeys.includes(e.key)) return;
      if (e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country);
      setIsDropdownOpen(false);
      setSearchQuery('');
      onCountryChange?.(country);

      // Re-format the current value with new country's max digits
      const digits = extractDigits(value, country.maxDigits);
      const formatted = formatPhoneDisplay(digits, country.maxDigits);
      setDisplayValue(formatted);
      if (digits !== value) {
        onChange?.(digits);
      }
    };

    const baseInputStyles = `
      block rounded-r-md border bg-white
      transition-colors duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      dark:bg-dark-card dark:text-white dark:disabled:bg-dark-bg dark:disabled:text-gray-500
      pl-3 pr-3
    `;

    const borderStyles = hasError
      ? 'border-error focus:border-error focus:ring-error/20'
      : 'border-gray-300 focus:border-primary focus:ring-primary/20 dark:border-dark-border dark:focus:border-primary';

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        <div className="flex relative">
          {/* Country Code Selector */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
              disabled={disabled}
              className={`
                flex items-center gap-1.5 px-3 rounded-l-md border border-r-0
                bg-gray-50 dark:bg-dark-bg
                hover:bg-gray-100 dark:hover:bg-dark-border
                transition-colors duration-200
                cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
                ${hasError
                  ? 'border-error'
                  : 'border-gray-300 dark:border-dark-border'
                }
                ${sizeStyles[size]}
              `}
            >
              <FlagIcon countryCode={selectedCountry.code} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedCountry.dialCode}
              </span>
              <ChevronDownIcon />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg overflow-hidden">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200 dark:border-dark-border">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-dark-border rounded-md bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Country List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No countries found
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left
                          hover:bg-gray-50 dark:hover:bg-dark-border
                          transition-colors duration-150
                          ${selectedCountry.code === country.code ? 'bg-primary/5 dark:bg-primary/10' : ''}
                        `}
                      >
                        <FlagIcon countryCode={country.code} />
                        <span className="flex-1 text-sm text-gray-900 dark:text-white">
                          {country.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {country.dialCode}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phone Input */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type="tel"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder || selectedCountry.format}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`
              ${baseInputStyles}
              ${borderStyles}
              ${sizeStyles[size]}
              ${fullWidth ? 'flex-1' : 'w-32'}
            `}
          />
        </div>

        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-xs text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !hasError && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
