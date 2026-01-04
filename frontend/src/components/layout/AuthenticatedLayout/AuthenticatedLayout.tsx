import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { NavItem } from '../Sidebar/Sidebar.types';

// Navigation Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const RolesIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

const AdminDashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DesignSystemIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const AuditIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthenticatedLayout({ children, title, subtitle }: AuthenticatedLayoutProps) {
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
      href: '/dashboard',
      section: 'Main',
    });

    // Admin section - only for admins
    if (isAdmin || isSuperAdmin) {
      // Admin Dashboard
      items.push({
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        icon: <AdminDashboardIcon />,
        href: '/admin',
        section: 'Administration',
      });

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
        children: userManagementChildren,
      });
    }

    // Super admin only
    if (isSuperAdmin) {
      items.push({
        id: 'roles',
        label: 'Roles & Permissions',
        icon: <RolesIcon />,
        href: '/admin/roles',
      });

      items.push({
        id: 'audit-logs',
        label: 'Audit Logs',
        icon: <AuditIcon />,
        href: '/admin/audit',
      });

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
      href: '/profile',
      section: 'Account',
    });

    items.push({
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      href: '/settings',
    });

    // Design System section - admins only
    if (isAdmin || isSuperAdmin) {
      const designSystemChildren: NavItem[] = [
        {
          id: 'ds-overview',
          label: 'Overview',
          icon: <ComponentIcon />,
          href: '/design-system',
        },
        {
          id: 'ds-buttons',
          label: 'Buttons',
          icon: <ComponentIcon />,
          href: '/design-system/buttons',
        },
        {
          id: 'ds-forms',
          label: 'Forms',
          icon: <ComponentIcon />,
          href: '/design-system/forms',
        },
        {
          id: 'ds-cards',
          label: 'Cards',
          icon: <ComponentIcon />,
          href: '/design-system/cards',
        },
        {
          id: 'ds-elements',
          label: 'UI Elements',
          icon: <ComponentIcon />,
          href: '/design-system/elements',
        },
        {
          id: 'ds-modals',
          label: 'Modals',
          icon: <ComponentIcon />,
          href: '/design-system/modals',
        },
        {
          id: 'ds-charts',
          label: 'Charts',
          icon: <ComponentIcon />,
          href: '/design-system/charts',
        },
        {
          id: 'ds-colors',
          label: 'Colors & Typography',
          icon: <ComponentIcon />,
          href: '/design-system/colors',
        },
        {
          id: 'ds-navigation',
          label: 'Navigation',
          icon: <ComponentIcon />,
          href: '/design-system/navigation',
        },
        {
          id: 'ds-data-display',
          label: 'Data Display',
          icon: <ComponentIcon />,
          href: '/design-system/data-display',
        },
        {
          id: 'ds-feedback',
          label: 'Feedback',
          icon: <ComponentIcon />,
          href: '/design-system/feedback',
        },
        {
          id: 'ds-form-controls',
          label: 'Form Controls',
          icon: <ComponentIcon />,
          href: '/design-system/form-controls',
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
    if (path === '/admin') return 'admin-dashboard';
    if (path.includes('/admin/users')) return 'users';
    if (path.includes('/admin/approvals')) return 'approvals';
    if (path.includes('/admin/roles')) return 'roles';
    if (path.includes('/admin/audit')) return 'audit-logs';
    if (path.includes('/admin/billing')) return 'billing';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/settings')) return 'settings';
    // Design System routes
    if (path === '/design-system') return 'ds-overview';
    if (path === '/design-system/buttons') return 'ds-buttons';
    if (path === '/design-system/forms') return 'ds-forms';
    if (path === '/design-system/cards') return 'ds-cards';
    if (path === '/design-system/elements') return 'ds-elements';
    if (path === '/design-system/modals') return 'ds-modals';
    if (path === '/design-system/charts') return 'ds-charts';
    if (path === '/design-system/colors') return 'ds-colors';
    if (path === '/design-system/navigation') return 'ds-navigation';
    if (path === '/design-system/data-display') return 'ds-data-display';
    if (path === '/design-system/feedback') return 'ds-feedback';
    if (path === '/design-system/form-controls') return 'ds-form-controls';
    return 'dashboard';
  };

  const handleNavClick = (item: NavItem) => {
    navigate(item.href);
  };

  const handleProfileClick = () => {
    navigate('/profile');
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
    >
      {children}
    </DashboardLayout>
  );
}
