import type { ActivityItemProps, ActivityAction } from './ActivityItem.types';

// Icon components as inline SVGs (following existing pattern in codebase)
const LoginIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ActivityIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Action to icon mapping
const actionIcons: Record<string, React.ReactNode> = {
  'user.login': <LoginIcon />,
  'user.logout': <LogoutIcon />,
  'user.created': <UserPlusIcon />,
  'user.updated': <EditIcon />,
  'user.deleted': <TrashIcon />,
  'user.approved': <CheckIcon />,
  'user.suspended': <PauseIcon />,
  'user.activated': <PlayIcon />,
  'user.password_reset': <LockIcon />,
  'user.email_verified': <MailIcon />,
  'user.avatar_updated': <ImageIcon />,
  'role.assigned': <ShieldIcon />,
  'role.removed': <ShieldIcon />,
  'role.created': <ShieldIcon />,
  'role.updated': <ShieldIcon />,
  'role.deleted': <ShieldIcon />,
  'permission.granted': <KeyIcon />,
  'permission.denied': <KeyIcon />,
  'permission.removed': <KeyIcon />,
  'property.assigned': <HomeIcon />,
  'property.removed': <HomeIcon />,
};

// Action to human-readable label mapping
const actionLabels: Record<string, string> = {
  'user.login': 'Logged in',
  'user.logout': 'Logged out',
  'user.created': 'Account created',
  'user.updated': 'Profile updated',
  'user.deleted': 'Account deleted',
  'user.approved': 'Account approved',
  'user.suspended': 'Account suspended',
  'user.activated': 'Account reactivated',
  'user.password_reset': 'Password reset',
  'user.email_verified': 'Email verified',
  'user.avatar_updated': 'Avatar changed',
  'role.assigned': 'Role assigned',
  'role.removed': 'Role removed',
  'role.created': 'Role created',
  'role.updated': 'Role updated',
  'role.deleted': 'Role deleted',
  'permission.granted': 'Permission granted',
  'permission.denied': 'Permission denied',
  'permission.removed': 'Permission removed',
  'property.assigned': 'Property assigned',
  'property.removed': 'Property removed',
};

// Action color classes for the icon background
const actionColors: Record<string, string> = {
  'user.login': 'bg-info/10 text-info',
  'user.logout': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  'user.created': 'bg-success/10 text-success',
  'user.updated': 'bg-primary/10 text-primary-700 dark:text-primary',
  'user.deleted': 'bg-error/10 text-error',
  'user.approved': 'bg-success/10 text-success',
  'user.suspended': 'bg-warning/10 text-warning',
  'user.activated': 'bg-success/10 text-success',
  'user.password_reset': 'bg-warning/10 text-warning',
  'user.email_verified': 'bg-success/10 text-success',
  'user.avatar_updated': 'bg-primary/10 text-primary-700 dark:text-primary',
  'role.assigned': 'bg-info/10 text-info',
  'role.removed': 'bg-warning/10 text-warning',
  'permission.granted': 'bg-success/10 text-success',
  'permission.denied': 'bg-error/10 text-error',
  'permission.removed': 'bg-warning/10 text-warning',
  'property.assigned': 'bg-info/10 text-info',
  'property.removed': 'bg-warning/10 text-warning',
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Format activity details from new_data
function formatActivityDetails(activity: ActivityItemProps['activity']): string | null {
  if (!activity.new_data) return null;

  const action = activity.action as ActivityAction;

  // Handle specific actions with meaningful detail extraction
  if (action === 'role.assigned' || action === 'role.removed') {
    const roleName = activity.new_data.role_name || activity.new_data.display_name;
    if (roleName) return `Role: ${roleName}`;
  }

  if (action === 'permission.granted' || action === 'permission.denied' || action === 'permission.removed') {
    const permName = activity.new_data.permission_name || activity.new_data.action;
    if (permName) return `Permission: ${permName}`;
  }

  if (action === 'user.updated') {
    const fields = Object.keys(activity.new_data).filter(k => k !== 'id' && k !== 'updated_at');
    if (fields.length > 0) {
      if (fields.length === 1) return `Changed: ${fields[0].replace(/_/g, ' ')}`;
      return `Changed: ${fields.slice(0, 2).join(', ').replace(/_/g, ' ')}${fields.length > 2 ? ` +${fields.length - 2}` : ''}`;
    }
  }

  return null;
}

export function ActivityItem({ activity, className = '' }: ActivityItemProps) {
  const action = activity.action as ActivityAction;
  const icon = actionIcons[action] || <ActivityIcon />;
  const label = actionLabels[action] || activity.action;
  const colorClass = actionColors[action] || 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  const details = formatActivityDetails(activity);

  return (
    <div className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-card ${className}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </p>
        {details && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {details}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatRelativeTime(activity.created_at)}
          {activity.ip_address && (
            <span className="ml-1">from {activity.ip_address}</span>
          )}
        </p>
      </div>
    </div>
  );
}
