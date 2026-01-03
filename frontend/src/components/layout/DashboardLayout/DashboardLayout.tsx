import { useState } from 'react';
import { DashboardLayoutProps } from './DashboardLayout.types';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

export function DashboardLayout({
  children,
  navItems = [],
  activeNavId,
  onNavItemClick,
  headerTitle,
  headerSubtitle,
  userName,
  userEmail,
  userAvatar,
  onProfileClick,
  onLogout,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full
          hidden lg:block
        `}
      >
        <Sidebar
          items={navItems}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeItemId={activeNavId}
          onItemClick={(item) => {
            onNavItemClick?.(item);
          }}
        />
      </div>

      {/* Sidebar - Mobile */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full
          transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar
          items={navItems}
          isCollapsed={false}
          activeItemId={activeNavId}
          onItemClick={(item) => {
            onNavItemClick?.(item);
            setIsMobileSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:ml-14' : 'lg:ml-60'}
        `}
      >
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-dark-sidebar border-b border-gray-200 dark:border-dark-border">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-dark-card text-gray-700 dark:text-gray-200"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <span className="text-brand-black font-bold text-xs">V</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  Vilo
                </span>
                <span className="text-2xs text-gray-500 dark:text-gray-400">
                  SaaS Dashboard
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header
            title={headerTitle}
            subtitle={headerSubtitle}
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
            onProfileClick={onProfileClick}
            onLogout={onLogout}
          />
        </div>

        {/* Page Content */}
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
