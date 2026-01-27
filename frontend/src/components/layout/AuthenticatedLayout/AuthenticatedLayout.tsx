import { ReactNode, useMemo } from 'react';
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

const CustomersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

const QuoteIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

// Guest Portal Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CalendarCheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Actions to display inline with the header title */
  headerActions?: ReactNode;
  /** Remove default padding from content area */
  noPadding?: boolean;
}

export function AuthenticatedLayout({ children, title, subtitle, headerActions, noPadding }: AuthenticatedLayoutProps) {
  const { user, isAdmin, isSuperAdmin, logout, subscriptionAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if user is a property owner (can manage properties)
  const isPropertyOwner = useMemo(() => {
    if (!user) return false;

    // PRIORITY 1: Check if user has an active paid subscription
    // This is the primary indicator that a user should see property management features
    const hasActiveSubscription = subscriptionAccess?.hasActiveSubscription || subscriptionAccess?.hasFullAccess;

    // PRIORITY 2: Check user type (paid or free tier)
    const hasOwnerType = ['paid', 'free'].includes(user.user_type?.name || '');

    // PRIORITY 3: Check if user has property-related roles
    const hasPropertyRole = user.roles?.some((role) =>
      ['property_admin', 'property_manager'].includes(role.name)
    );

    // PRIORITY 4: Check if user has properties assigned
    const hasProperties = user.properties && user.properties.length > 0;

    // User is a property owner if ANY of these conditions are true
    return hasActiveSubscription || hasOwnerType || hasPropertyRole || hasProperties;
  }, [user, subscriptionAccess]);

  // Build navigation items based on user permissions
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    // ============================================
    // SECTION 1: Main (Everyone)
    // ============================================
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

    // ============================================
    // SECTION 2: Property Management (Property Owners only)
    // ============================================
    if (isPropertyOwner) {
      items.push({
        id: 'companies',
        label: 'Companies',
        icon: <CompanyIcon />,
        href: '/manage/companies',
        section: 'Property Management',
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
        id: 'customers',
        label: 'Customers',
        icon: <CustomersIcon />,
        href: '/manage/customers',
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
        id: 'quote-requests',
        label: 'Quote Requests',
        icon: <QuoteIcon />,
        href: '/manage/quotes',
      });

      items.push({
        id: 'addons',
        label: 'Add-ons',
        icon: <AddonsIcon />,
        href: '/manage/addons',
      });

      items.push({
        id: 'payment-settings',
        label: 'Payment Settings',
        icon: <CreditCardIcon />,
        href: '/manage/settings/payments',
      });

      items.push({
        id: 'whatsapp-settings',
        label: 'WhatsApp Settings',
        icon: <WhatsAppIcon />,
        href: '/manage/settings/whatsapp',
      });
    }

    // ============================================
    // SECTION 3: Guest Portal (Everyone)
    // ============================================
    items.push({
      id: 'browse-properties',
      label: 'Browse Properties',
      icon: <SearchIcon />,
      href: '/portal/properties',
      section: 'Guest Portal',
    });

    items.push({
      id: 'my-bookings',
      label: 'My Bookings',
      icon: <CalendarCheckIcon />,
      href: '/portal/bookings',
    });

    items.push({
      id: 'my-reviews',
      label: 'My Reviews',
      icon: <ReviewIcon />,
      href: '/manage/reviews',
    });

    items.push({
      id: 'my-refunds',
      label: 'My Refunds',
      icon: <RefundIcon />,
      href: '/refunds',
    });

    // ============================================
    // SECTION 4: Administration (Admins only)
    // ============================================
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

      // Super admin only
      if (isSuperAdmin) {
        items.push({
          id: 'billing',
          label: 'Billing Settings',
          icon: <BillingIcon />,
          href: '/admin/billing',
        });

        items.push({
          id: 'email-management',
          label: 'Email Management',
          icon: <EmailIcon />,
          href: '/admin/email',
        });
      }

      // Design System
      const designSystemChildren: NavItem[] = [
        { id: 'ds-overview', label: 'Overview', icon: <ComponentIcon />, href: '/design-system' },
        { id: 'ds-buttons', label: 'Actions', icon: <ComponentIcon />, href: '/design-system/buttons' },
        { id: 'ds-forms', label: 'Inputs & Forms', icon: <ComponentIcon />, href: '/design-system/forms' },
        { id: 'ds-form-controls', label: 'Form Controls', icon: <ComponentIcon />, href: '/design-system/form-controls' },
        { id: 'ds-elements', label: 'Feedback & Status', icon: <ComponentIcon />, href: '/design-system/elements' },
        { id: 'ds-feedback', label: 'Loading & Progress', icon: <ComponentIcon />, href: '/design-system/feedback' },
        { id: 'ds-notifications', label: 'Notifications', icon: <ComponentIcon />, href: '/design-system/notifications' },
        { id: 'ds-data-display', label: 'Data Display', icon: <ComponentIcon />, href: '/design-system/data-display' },
        { id: 'ds-charts', label: 'Charts', icon: <ComponentIcon />, href: '/design-system/charts' },
        { id: 'ds-cards', label: 'Layout & Cards', icon: <ComponentIcon />, href: '/design-system/cards' },
        { id: 'ds-integration-card', label: 'Integration Card', icon: <ComponentIcon />, href: '/design-system/integration-card' },
        { id: 'ds-navigation', label: 'Navigation', icon: <ComponentIcon />, href: '/design-system/navigation' },
        { id: 'ds-modals', label: 'Overlays & Modals', icon: <ComponentIcon />, href: '/design-system/modals' },
        { id: 'ds-colors', label: 'Foundation', icon: <ComponentIcon />, href: '/design-system/colors' },
      ];

      items.push({
        id: 'design-system',
        label: 'Design System',
        icon: <DesignSystemIcon />,
        href: '/design-system',
        children: designSystemChildren,
      });
    }

    // ============================================
    // SECTION 5: Account (Everyone)
    // ============================================
    items.push({
      id: 'profile',
      label: 'My Profile',
      icon: <ProfileIcon />,
      href: '/manage/profile',
      section: 'Account',
    });

    return items;
  };

  const navItems = getNavItems();

  // Determine active nav item from current path
  const getActiveNavId = (): string => {
    const path = location.pathname;

    // IMPORTANT: Check portal routes FIRST before more general routes
    // Guest Portal routes (must be checked before property management routes)
    if (path.startsWith('/portal/properties')) return 'browse-properties';
    if (path.startsWith('/portal/bookings')) return 'my-bookings';
    if (path === '/refunds' || path.startsWith('/refunds/')) return 'my-refunds'; // Guest refunds

    // Main routes
    if (path.includes('/chat')) return 'chat';
    if (path.includes('/manage/dashboard')) return 'dashboard';

    // Property Management routes
    if (path.includes('/companies')) return 'companies';
    if (path.includes('/properties')) return 'properties';
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/addons')) return 'addons';
    if (path.includes('/manage/settings/payments')) return 'payment-settings';
    if (path.includes('/manage/settings/whatsapp')) return 'whatsapp-settings';
    if (path.includes('/reviews')) return 'reviews';

    // Rooms sub-items
    if (path.includes('/rooms/payment-rules')) return 'rooms-payment-rules';
    if (path.includes('/rooms/promo-codes')) return 'rooms-promo-codes';
    if (path.includes('/rooms/')) return 'rooms-list'; // Detail/edit pages
    if (path.includes('/rooms')) return 'rooms-list';

    // Bookings sub-items
    if (path.includes('/booking-management')) return 'booking-management';
    if (path.includes('/bookings/calendar')) return 'calendar';
    if (path.includes('/admin/refunds')) return 'refunds'; // Property owner refunds in bookings submenu

    // My Reviews - check for guest reviews separately from property owner Review Manager
    // Both use /manage/reviews but we want different nav items highlighted based on context
    if (path.includes('/manage/reviews') && !isPropertyOwner) return 'my-reviews';

    // Admin routes
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/approvals')) return 'approvals';
    if (path.includes('/admin/email')) return 'email-management';
    if (path.includes('/admin/billing')) return 'billing';

    // Account routes
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
      headerActions={headerActions}
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
