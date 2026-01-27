/**
 * PublicLayout Component
 * Layout for public-facing directory pages (no authentication required)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui';
import { SearchModal } from '@/components/features/SearchModal';
import type { PublicLayoutProps } from './PublicLayout.types';
import { MegaMenu, MegaMenuMobile } from './MegaMenu';
import { CategoriesMegaMenu, CategoriesMegaMenuMobile } from './CategoriesMegaMenu';

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  showSearchBar: _showSearchBar = false,
  transparentHeader = false,
  stickyHeader = true,
  className = '',
  menuType = 'default',
}) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Track scroll position to add solid background when scrolled
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg">
      {/* Header */}
      <header
        className={`${stickyHeader ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 transition-all duration-200 ${
          transparentHeader && !isScrolled
            ? 'bg-transparent'
            : 'bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border shadow-sm'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {menuType === 'for-hosts' && (
                <Link
                  to="/"
                  className={`p-1.5 rounded-lg transition-colors ${
                    transparentHeader && !isScrolled
                      ? 'hover:bg-white/10'
                      : 'hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black'
                  }`}
                  title="Back to Home"
                >
                  <svg
                    className={`w-5 h-5 ${
                      transparentHeader && !isScrolled
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}
              <Link to={menuType === 'for-hosts' ? '/for-hosts' : '/'} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className={`text-xl font-bold transition-colors ${
                  transparentHeader && !isScrolled
                    ? 'text-white drop-shadow-lg'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Vilo
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {menuType === 'default' ? (
                <>
                  <Link
                    to="/search"
                    className={`hover:text-primary transition-colors font-medium ${
                      transparentHeader && !isScrolled
                        ? 'text-white drop-shadow-lg'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Browse All
                  </Link>
                  <CategoriesMegaMenu
                    transparentHeader={transparentHeader}
                    isScrolled={isScrolled}
                  />
                  {!isAuthenticated && (
                    <>
                      <Link
                        to="/list-your-property"
                        className={`font-medium transition-colors ${
                          transparentHeader && !isScrolled
                            ? 'text-white drop-shadow-lg hover:text-white/80'
                            : 'text-primary hover:text-primary/80 dark:text-primary'
                        }`}
                      >
                        List Your Property
                      </Link>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/for-hosts"
                    className={`hover:text-primary transition-colors font-medium ${
                      transparentHeader && !isScrolled
                        ? 'text-white drop-shadow-lg'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Vilo SaaS
                  </Link>
                  <div className={transparentHeader && !isScrolled ? 'text-white drop-shadow-lg' : ''}>
                    <MegaMenu />
                  </div>
                  <Link
                    to="/pricing"
                    className={`hover:text-primary transition-colors font-medium ${
                      transparentHeader && !isScrolled
                        ? 'text-white drop-shadow-lg'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Pricing
                  </Link>
                  <a
                    href="#resources"
                    className={`hover:text-primary transition-colors font-medium ${
                      transparentHeader && !isScrolled
                        ? 'text-white drop-shadow-lg'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Resources
                  </a>
                </>
              )}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search Icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 hover:text-primary transition-colors ${
                  transparentHeader && !isScrolled
                    ? 'text-white drop-shadow-lg hover:bg-white/10'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black rounded-md'
                }`}
                aria-label="Search properties"
                title="Search properties"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  {/* Wishlist disabled */}
                  {false && menuType === 'default' && (
                    <Link
                      to="/wishlist"
                      className={`p-2 hover:text-primary transition-colors ${
                        transparentHeader && !isScrolled
                          ? 'text-white drop-shadow-lg'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                      title="Wishlist"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </Link>
                  )}

                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        transparentHeader && !isScrolled
                          ? 'hover:bg-white/10'
                          : 'hover:bg-primary-100 dark:hover:bg-primary dark:hover:text-black'
                      }`}
                    >
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name || 'User'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                          {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      <svg className={`w-4 h-4 ${transparentHeader && !isScrolled ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 z-50">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {user?.full_name || 'User'}
                          </p>
                          {user?.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          )}
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            to="/manage/dashboard"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-gray-900 dark:hover:bg-primary dark:hover:text-black transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                          </Link>
                          <Link
                            to="/manage/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-100 hover:text-gray-900 dark:hover:bg-primary dark:hover:text-black transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </Link>
                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {menuType === 'default' && (
                    <Link
                      to="/login"
                      className={`px-4 py-2 font-medium hover:text-primary transition-colors ${
                        transparentHeader && !isScrolled
                          ? 'text-white drop-shadow-lg'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Sign In
                    </Link>
                  )}
                  <Link
                    to="/signup"
                    className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md ${
                      menuType === 'for-hosts' ? 'px-6' : ''
                    }`}
                  >
                    {menuType === 'for-hosts' ? 'Try Vilo' : 'Sign Up'}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 transition-colors ${
                transparentHeader && !isScrolled
                  ? 'text-white drop-shadow-lg'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
              <div className="mb-4 flex items-center justify-between">
                <ThemeToggle showLabel />
                {/* Search Button for Mobile */}
                <button
                  onClick={() => {
                    setIsSearchOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-primary-100 hover:text-gray-900 dark:hover:bg-primary dark:hover:text-black rounded-md transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm font-medium">Search</span>
                </button>
              </div>
              <nav className="flex flex-col gap-4">
                {menuType === 'default' ? (
                  <>
                    <Link
                      to="/search"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Browse All
                    </Link>
                    <div className="py-2">
                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</div>
                      <CategoriesMegaMenuMobile />
                    </div>
                    {!isAuthenticated && (
                      <>
                        <Link
                          to="/list-your-property"
                          className="text-primary dark:text-primary font-medium hover:text-primary/80"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          List Your Property
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      to="/for-hosts"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vilo SaaS
                    </Link>
                    <div className="py-2">
                      <MegaMenuMobile />
                    </div>
                    <Link
                      to="/pricing"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <a
                      href="#resources"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Resources
                    </a>
                  </>
                )}
                {isAuthenticated ? (
                  <>
                    {/* Wishlist disabled */}
                    {false && menuType === 'default' && (
                      <Link
                        to="/wishlist"
                        className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Wishlist
                      </Link>
                    )}
                    <Link
                      to="/manage/dashboard"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-left text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    {menuType === 'default' && (
                      <Link
                        to="/login"
                        className="text-gray-700 dark:text-gray-300 hover:text-primary font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    )}
                    <Link
                      to="/signup"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 inline-block text-center font-medium shadow-md"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {menuType === 'for-hosts' ? 'Try Vilo' : 'Sign Up'}
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${transparentHeader || !stickyHeader ? '' : 'pt-16'} ${className}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Vilo
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Direct bookings, zero fees. Find your perfect stay in South Africa.
              </p>
            </div>

            {/* For Guests */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                For Guests
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/search" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    Browse Properties
                  </Link>
                </li>
                {/* Wishlist disabled */}
                {false && (
                  <li>
                    <Link to="/wishlist" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                      My Wishlist
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/portal/bookings" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    My Bookings
                  </Link>
                </li>
              </ul>
            </div>

            {/* For Hosts */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                For Hosts
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/manage/properties" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    List Your Property
                  </Link>
                </li>
                <li>
                  <Link to="/manage/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    Host Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Company
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/legal/terms" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/legal/privacy" className="text-gray-600 dark:text-gray-400 hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Vilo. All rights reserved.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Safe · Easy · Fast Bookings
            </p>
          </div>
        </div>
      </footer>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default PublicLayout;
