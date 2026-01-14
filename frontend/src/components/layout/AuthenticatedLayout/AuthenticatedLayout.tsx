import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { PropertySelector } from '@/components/features/PropertySelector';
import { NavItem } from '../Sidebar/Sidebar.types';

// Navigation Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ApprovalsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DesignSystemIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const BillingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ComponentIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

// Business Icons
const CompanyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PropertyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const RoomIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const BookingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0l-2-2m2 2l2-2" />
  </svg>
);

const ScaleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const AddonsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const RefundIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const ReviewIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Remove default padding from content area */
  noPadding?: boolean;
}

export function AuthenticatedLayout({ children, title, subtitle, noPadding }: AuthenticatedLayoutProps) {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Build navigation items based on user permissions
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    // Main section - always visible
    items.push({
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      href: '/manage/dashboard',
      section: 'Main',
    });

    items.push({
      id: 'chat',
      label: 'Chat',
      icon: <ChatIcon />,
      href: '/manage/chat',
    });

    // Business section - always visible
    items.push({
      id: 'companies',
      label: 'Companies',
      icon: <CompanyIcon />,
      href: '/manage/companies',
      section: 'Business',
    });

    items.push({
      id: 'properties',
      label: 'Properties',
      icon: <PropertyIcon />,
      href: '/manage/properties',
    });

    items.push({
      id: 'rooms',
      label: 'Rooms',
      icon: <RoomIcon />,
      href: '/manage/rooms',
      children: [
        {
          id: 'rooms-list',
          label: 'All Rooms',
          icon: <RoomIcon />,
          href: '/manage/rooms',
        },
        {
          id: 'rooms-payment-rules',
          label: 'Payment Rules',
          icon: <BillingIcon />,
          href: '/manage/rooms/payment-rules',
        },
        {
          id: 'rooms-promo-codes',
          label: 'Promo Codes',
          icon: <ComponentIcon />,
          href: '/manage/rooms/promo-codes',
        },
      ],
    });

    items.push({
      id: 'bookings',
      label: 'Bookings',
      icon: <BookingIcon />,
      href: '/manage/booking-management',
      children: [
        {
          id: 'booking-management',
          label: 'Booking Management',
          icon: <BookingIcon />,
          href: '/manage/booking-management',
        },
        {
          id: 'calendar',
          label: 'Calendar',
          icon: <CalendarIcon />,
          href: '/bookings/calendar',
        },
        {
          id: 'refunds',
          label: 'Refunds',
          icon: <RefundIcon />,
          href: '/admin/refunds',
        },
      ],
    });

    items.push({
      id: 'reviews',
      label: 'Review Manager',
      icon: <ReviewIcon />,
      href: '/manage/reviews',
    });

    items.push({
      id: 'addons',
      label: 'Add-ons',
      icon: <AddonsIcon />,
      href: '/manage/addons',
    });

    items.push({
      id: 'legal',
      label: 'Legal',
      icon: <ScaleIcon />,
      href: '/manage/legal',
    });

    // Admin section - only for admins
    if (isAdmin || isSuperAdmin) {
      // User Management with sub-items
      const userManagementChildren: NavItem[] = [
        {
          id: 'users',
          label: 'All Users',
          icon: <UsersIcon />,
          href: '/admin/users',
        },
        {
          id: 'approvals',
          label: 'Pending Approvals',
          icon: <ApprovalsIcon />,
          href: '/admin/approvals',
        },
      ];

      items.push({
        id: 'user-management',
        label: 'User Management',
        icon: <UsersIcon />,
        href: '/admin/users',
        section: 'Administration',
        children: userManagementChildren,
      });
    }

    // Super admin only
    if (isSuperAdmin) {
      items.push({
        id: 'billing',
        label: 'Billing Settings',
        icon: <BillingIcon />,
        href: '/admin/billing',
      });
    }

    // Account section - always visible
    items.push({
      id: 'profile',
      label: 'My Profile',
      icon: <ProfileIcon />,
      href: '/manage/profile',
      section: 'Account',
    });

    // Design System section - admins only
    if (isAdmin || isSuperAdmin) {
      const designSystemChildren: NavItem[] = [
        // Overview
        {
          id: 'ds-overview',
          label: 'Overview',
          icon: <ComponentIcon />,
          href: '/design-system',
        },
        // Actions
        {
          id: 'ds-buttons',
          label: 'Actions',
          icon: <ComponentIcon />,
          href: '/design-system/buttons',
        },
        // Inputs & Forms
        {
          id: 'ds-forms',
          label: 'Inputs & Forms',
          icon: <ComponentIcon />,
          href: '/design-system/forms',
        },
        {
          id: 'ds-form-controls',
          label: 'Form Controls',
          icon: <ComponentIcon />,
          href: '/design-system/form-controls',
        },
        // Feedback & Status
        {
          id: 'ds-elements',
          label: 'Feedback & Status',
          icon: <ComponentIcon />,
          href: '/design-system/elements',
        },
        {
          id: 'ds-feedback',
          label: 'Loading & Progress',
          icon: <ComponentIcon />,
          href: '/design-system/feedback',
        },
        {
          id: 'ds-notifications',
          label: 'Notifications',
          icon: <ComponentIcon />,
          href: '/design-system/notifications',
        },
        // Data Display
        {
          id: 'ds-data-display',
          label: 'Data Display',
          icon: <ComponentIcon />,
          href: '/design-system/data-display',
        },
        {
          id: 'ds-charts',
          label: 'Charts',
          icon: <ComponentIcon />,
          href: '/design-system/charts',
        },
        // Layout & Containers
        {
          id: 'ds-cards',
          label: 'Layout & Cards',
          icon: <ComponentIcon />,
          href: '/design-system/cards',
        },
        {
          id: 'ds-integration-card',
          label: 'Integration Card',
          icon: <ComponentIcon />,
          href: '/design-system/integration-card',
        },
        // Navigation
        {
          id: 'ds-navigation',
          label: 'Navigation',
          icon: <ComponentIcon />,
          href: '/design-system/navigation',
        },
        // Overlays
        {
          id: 'ds-modals',
          label: 'Overlays & Modals',
          icon: <ComponentIcon />,
          href: '/design-system/modals',
        },
        // Foundation
        {
          id: 'ds-colors',
          label: 'Foundation',
          icon: <ComponentIcon />,
          href: '/design-system/colors',
        },
      ];

      items.push({
        id: 'design-system',
        label: 'Design System',
        icon: <DesignSystemIcon />,
        href: '/design-system',
        section: 'Components',
        children: designSystemChildren,
      });
    }

    return items;
  };

  const navItems = getNavItems();

  // Determine active nav item from current path
  const getActiveNavId = (): string => {
    const path = location.pathname;
    // Main routes
    if (path.includes('/chat')) return 'chat';
    // Business routes
    if (path.includes('/companies')) return 'companies';
    if (path.includes('/properties')) return 'properties';
    // Rooms sub-items
    if (path.includes('/rooms/payment-rules')) return 'rooms-payment-rules';
    if (path.includes('/rooms/promo-codes')) return 'rooms-promo-codes';
    if (path.includes('/rooms/')) return 'rooms-list'; // Detail/edit pages
    if (path.includes('/rooms')) return 'rooms-list';
    // Bookings sub-items
    if (path.includes('/booking-management')) return 'booking-management';
    if (path.includes('/bookings/calendar')) return 'calendar';
    if (path.includes('/refunds')) return 'refunds';
    if (path.includes('/addons')) return 'addons';
    if (path.includes('/legal')) return 'legal';
    // Admin routes
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/approvals')) return 'approvals';
    if (path.includes('/admin/billing')) return 'billing';
    if (path.includes('/profile')) return 'profile';
    // Design System routes
    if (path === '/design-system') return 'ds-overview';
    if (path === '/design-system/buttons') return 'ds-buttons';
    if (path === '/design-system/forms') return 'ds-forms';
    if (path === '/design-system/form-controls') return 'ds-form-controls';
    if (path === '/design-system/elements') return 'ds-elements';
    if (path === '/design-system/feedback') return 'ds-feedback';
    if (path === '/design-system/notifications') return 'ds-notifications';
    if (path === '/design-system/data-display') return 'ds-data-display';
    if (path === '/design-system/charts') return 'ds-charts';
    if (path === '/design-system/cards') return 'ds-cards';
    if (path === '/design-system/integration-card') return 'ds-integration-card';
    if (path === '/design-system/navigation') return 'ds-navigation';
    if (path === '/design-system/modals') return 'ds-modals';
    if (path === '/design-system/colors') return 'ds-colors';
    return 'dashboard';
  };

  const handleNavClick = (item: NavItem) => {
    navigate(item.href);
  };

  const handleProfileClick = () => {
    navigate('/manage/profile');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get user display name
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <DashboardLayout
      navItems={navItems}
      activeNavId={getActiveNavId()}
      onNavItemClick={handleNavClick}
      headerTitle={title}
      headerSubtitle={subtitle}
      userName={displayName}
      userEmail={user?.email}
      userAvatar={user?.avatar_url ?? undefined}
      onProfileClick={handleProfileClick}
      onLogout={handleLogout}
      noPadding={noPadding}
      propertySelector={<PropertySelector />}
    >
      {children}
    </DashboardLayout>
  );
}
