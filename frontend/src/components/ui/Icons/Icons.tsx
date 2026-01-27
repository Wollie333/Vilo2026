/**
 * Icons Component Library
 *
 * Centralized collection of reusable SVG icon components.
 * All icons follow consistent sizing and theming patterns.
 */

import React from 'react';
import type { IconProps } from './Icons.types';
import { iconSizeMap } from './Icons.types';

/**
 * Base icon wrapper that handles common props
 */
const Icon: React.FC<IconProps & { children: React.ReactNode }> = ({
  size = 'md',
  className = '',
  color,
  children,
}) => {
  const sizeClass = iconSizeMap[size];
  const colorClass = color || 'currentColor';

  return React.cloneElement(children as React.ReactElement, {
    className: `${sizeClass} ${className}`,
    style: { color: colorClass },
  });
};

// ============================================================================
// Header Action Icons
// ============================================================================

/**
 * Eye Open Icon - Used for showing/viewing content
 */
export const EyeOpenIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

/**
 * Eye Closed/Slashed Icon - Used for hiding content
 */
export const EyeClosedIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

/**
 * Filter Icon - Used for filtering data
 */
export const FilterIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

/**
 * Analytics/Chart Icon - Used for analytics and statistics
 */
export const AnalyticsIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

/**
 * Dollar/Currency Icon - Used for payments and financial data
 */
export const DollarIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Plus Icon - Used for adding/creating new items
 */
export const PlusIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

// ============================================================================
// Booking & Calendar Icons
// ============================================================================

/**
 * Calendar Icon - Used for dates and scheduling
 */
export const CalendarIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Check-In Icon - Used for check-in actions
 */
export const CheckInIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
    />
  </svg>
);

/**
 * Check-Out Icon - Used for check-out actions
 */
export const CheckOutIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

/**
 * Booking Icon - Used for bookings and reservations
 */
export const BookingIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

// ============================================================================
// Alert & Status Icons
// ============================================================================

/**
 * Alert/Warning Icon - Used for warnings and important notices
 */
export const AlertIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

/**
 * Info Icon - Used for informational messages
 */
export const InfoIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * Check/Success Icon - Used for success states
 */
export const CheckIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

/**
 * Close/X Icon - Used for closing and canceling
 */
export const CloseIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// ============================================================================
// Navigation Icons
// ============================================================================

/**
 * Search Icon - Used for search functionality
 */
export const SearchIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

/**
 * Menu/Hamburger Icon - Used for menus
 */
export const MenuIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

/**
 * ChevronLeft Icon - Used for navigation
 */
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

/**
 * ChevronRight Icon - Used for navigation
 */
export const ChevronRightIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

/**
 * ChevronDown Icon - Used for dropdowns
 */
export const ChevronDownIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

/**
 * ChevronUp Icon - Used for dropdowns
 */
export const ChevronUpIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

// ============================================================================
// Common Action Icons
// ============================================================================

/**
 * Edit/Pencil Icon - Used for editing
 */
export const EditIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

/**
 * Delete/Trash Icon - Used for deleting
 */
export const DeleteIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

/**
 * Settings/Gear Icon - Used for settings
 */
export const SettingsIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

/**
 * Download Icon - Used for downloading
 */
export const DownloadIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

/**
 * Upload Icon - Used for uploading
 */
export const UploadIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

// ============================================================================
// Communication & Contact Icons
// ============================================================================

/**
 * Mail Icon - Used for email contact
 */
export const MailIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Phone Icon - Used for phone contact
 */
export const PhoneIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

/**
 * WhatsApp Icon - Used for WhatsApp contact
 */
export const WhatsAppIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
    />
  </svg>
);

/**
 * Chat Icon - Used for in-app messaging
 */
export const ChatIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

// ============================================================================
// Property & Room Icons
// ============================================================================

/**
 * Home Icon - Used for properties
 */
export const HomeIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

/**
 * Building Icon - Used for properties/hotels
 */
export const BuildingIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

/**
 * User Icon - Used for users/guests
 */
export const UserIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

/**
 * Users Icon - Used for groups/teams
 */
export const UsersIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

// ============================================================================
// Business & Finance Icons
// ============================================================================

/**
 * Star Icon - Used for ratings, favorites, and popular indicators
 */
export const StarIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

/**
 * CreditCard Icon - Used for payment methods
 */
export const CreditCardIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

/**
 * Chart/Bar Icon - Used for analytics and statistics
 */
export const ChartBarIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

// ============================================================================
// Document & Security Icons
// ============================================================================

/**
 * Document Icon - Used for files and documents
 */
export const DocumentIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

/**
 * DocumentText Icon - Used for text documents
 */
export const DocumentTextIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

/**
 * Shield Icon - Used for security and protection
 */
export const ShieldIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

/**
 * ShieldCheck Icon - Used for verified/protected status
 */
export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

// ============================================================================
// Notification & Action Icons
// ============================================================================

/**
 * Bell Icon - Used for notifications
 */
export const BellIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

/**
 * Lightning/Bolt Icon - Used for speed, power, and premium features
 */
export const LightningBoltIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

/**
 * CheckCircle Icon - Check mark in a circle
 */
export const CheckCircleIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

/**
 * ArrowRight Icon - Right arrow for navigation and "next" actions
 */
export const ArrowRightIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

/**
 * ArrowLeft Icon - Left arrow for navigation and "back" actions
 */
export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

/**
 * Play Icon - Play button for videos and media
 */
export const PlayIcon: React.FC<IconProps> = ({ size = 'md', className = '', strokeWidth = 2 }) => (
  <svg className={`${iconSizeMap[size]} ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
