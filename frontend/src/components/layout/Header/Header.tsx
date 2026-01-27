import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeaderProps } from './Header.types';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationCenter } from '@/components/features/NotificationCenter';
import { SearchModal } from '@/components/features/SearchModal';

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

export function Header({
  title,
  subtitle,
  userName,
  userEmail,
  userAvatar,
  onProfileClick,
  onLogout,
  onHelpClick,
  rightContent,
  headerActions,
}: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const [showHomeTooltip, setShowHomeTooltip] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [showNotificationsTooltip, setShowNotificationsTooltip] = useState(false);
  const [showUserTooltip, setShowUserTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    onProfileClick?.();
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout?.();
  };

  return (
    <header className="h-14 px-5 flex items-center justify-between bg-white dark:bg-dark-sidebar border-b border-gray-200 dark:border-dark-border">
      {/* Left: Title with inline actions */}
      <div className="flex items-center justify-between flex-1 mr-4">
        <div>
          {title && (
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Header Actions - Inline with title */}
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Right: Utility Actions */}
      <div className="flex items-center gap-2">
        {rightContent}

        {/* Search */}
        <div className="relative">
          <button
            onClick={() => setIsSearchOpen(true)}
            onMouseEnter={() => setShowSearchTooltip(true)}
            onMouseLeave={() => setShowSearchTooltip(false)}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black rounded-md transition-colors"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          {showSearchTooltip && (
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg">
              Search properties
            </span>
          )}
        </div>

        {/* Home */}
        <div className="relative">
          <Link
            to="/"
            onMouseEnter={() => setShowHomeTooltip(true)}
            onMouseLeave={() => setShowHomeTooltip(false)}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black rounded-md transition-colors"
            aria-label="Home"
          >
            <HomeIcon />
          </Link>
          {showHomeTooltip && (
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg">
              Home
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div
          className="relative"
          onMouseEnter={() => setShowNotificationsTooltip(true)}
          onMouseLeave={() => setShowNotificationsTooltip(false)}
        >
          <NotificationCenter />
          {showNotificationsTooltip && (
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg">
              Notifications
            </span>
          )}
        </div>

        {/* Help */}
        <div className="relative">
          <button
            onClick={onHelpClick}
            onMouseEnter={() => setShowHelpTooltip(true)}
            onMouseLeave={() => setShowHelpTooltip(false)}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black rounded-md transition-colors"
            aria-label="Help"
          >
            <HelpIcon />
          </button>
          {showHelpTooltip && (
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg">
              Help & Support
            </span>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onMouseEnter={() => setShowUserTooltip(true)}
            onMouseLeave={() => setShowUserTooltip(false)}
            className="flex items-center gap-2 p-1.5 hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black rounded-md transition-colors"
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName || 'User'}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white font-medium text-xs">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {userName && (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                {userName}
              </span>
            )}
            <ChevronDownIcon />
          </button>

          {/* Tooltip */}
          {showUserTooltip && !isDropdownOpen && (
            <span className="absolute top-full mt-2 right-0 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap pointer-events-none z-50 shadow-lg">
              Account settings
            </span>
          )}

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-dark-card rounded-md shadow-lg border border-gray-200 dark:border-dark-border py-1 z-50">
              {/* User Info */}
              <div className="px-3 py-2.5 border-b border-gray-200 dark:border-dark-border">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {userName || 'User'}
                </p>
                {userEmail && (
                  <p className="text-2xs text-gray-500 dark:text-gray-400 truncate">
                    {userEmail}
                  </p>
                )}
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-gray-900 dark:hover:bg-primary dark:hover:text-black transition-colors"
                >
                  <UserIcon />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogoutIcon />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
