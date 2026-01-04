import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Badge,
  Avatar,
  Spinner,
  Alert,
  Input,
  ConfirmDialog,
  PhoneInput,
  MaskedInput,
  Card,
  SaveStatus,
  Checkbox,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import { ActivityItem } from '@/components/features/ActivityItem';
import { usersService, rolesService } from '@/services';
import type { ActivityLogEntry } from '@/services/users.service';
import { useAutoSave, useImmediateSave } from '@/hooks';
import type { UserWithRoles, Role, UserStatus, Permission } from '@/types/auth.types';

// Types
type ViewType =
  | 'overview'
  | 'personal'
  | 'address'
  | 'company'
  | 'properties'
  | 'rooms'
  | 'team'
  | 'customers'
  | 'bookings'
  | 'reviews'
  | 'refunds'
  | 'roles'
  | 'permissions'
  | 'activity';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Status color mapping
const statusColors: Record<UserStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
  deactivated: 'default',
};

// Timezone options
const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Johannesburg', label: 'South Africa (SAST)' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

// Icons
const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

// Additional icons for expanded navigation
const PropertyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const RoomIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const TeamIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CustomerIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookingIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ReviewIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const RefundIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

// Format date helpers
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Navigation Item Component
const NavItemButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}> = ({ item, isActive, isComplete, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary font-medium'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {item.count !== undefined && (
        <span className="text-xs text-gray-400 dark:text-gray-500">({item.count})</span>
      )}
    </div>
    {isComplete && (
      <span className="text-primary">
        <CheckIcon />
      </span>
    )}
  </button>
);

// Stat Card Component for Overview
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  color: 'green' | 'yellow' | 'blue' | 'purple';
}> = ({ icon, label, value, subtext, color }) => {
  const colorClasses = {
    green: 'bg-success/10 text-success border-success/20',
    yellow: 'bg-warning/10 text-warning border-warning/20',
    blue: 'bg-info/10 text-info border-info/20',
    purple: 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtext && <p className="text-xs opacity-70">{subtext}</p>}
    </div>
  );
};

// Progress Item Component for Usage Overview
const ProgressItem: React.FC<{
  label: string;
  current: number;
  max: number;
}> = ({ label, current, max }) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isOverLimit = current > max;

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-medium ${isOverLimit ? 'text-error' : 'text-gray-900 dark:text-white'}`}>
          {current} / {max}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-error' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Circular Progress Component
const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
}> = ({ percentage, size = 80, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-dark-border"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Active view state
  const [activeView, setActiveView] = useState<ViewType>('overview');

  // User data
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  // Activity data
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Action states
  const [isApproving, setIsApproving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Confirmation dialog states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suspend' | 'reactivate' | 'deactivate' | null;
    isOpen: boolean;
  }>({ type: null, isOpen: false });

  // Form data state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company_name: '',
    vat_number: '',
    company_registration: '',
    timezone: 'UTC',
    address_street: '',
    address_city: '',
    address_state: '',
    address_postal_code: '',
    address_country: '',
  });

  // Role and permission state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<{
    grants: string[];
    denies: string[];
  }>({ grants: [], denies: [] });

  // Auto-save for profile fields
  const profileAutoSave = useAutoSave<typeof formData>({
    saveField: async (field, value) => {
      if (!id) throw new Error('No user ID');
      await usersService.updateUser(id, { [field]: value });
      setUser((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    debounceMs: 500,
  });

  // Immediate save for roles
  const rolesSave = useImmediateSave<{ roles: string[] }>(async (_field, value) => {
    if (!id) throw new Error('No user ID');
    await usersService.assignRoles(id, { roleIds: value as string[] });
    await refreshUser();
  });

  // Immediate save for permissions
  const permissionsSave = useImmediateSave<{ permissions: { grants: string[]; denies: string[] } }>(
    async (_field, value) => {
      if (!id) throw new Error('No user ID');
      const perms = value as { grants: string[]; denies: string[] };
      const permissions = [
        ...perms.grants.map((permissionId) => ({
          permissionId,
          overrideType: 'grant' as const,
        })),
        ...perms.denies.map((permissionId) => ({
          permissionId,
          overrideType: 'deny' as const,
        })),
      ];
      await usersService.assignPermissions(id, permissions);
      await refreshUser();
    }
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const [userData, rolesData, permissionsData] = await Promise.all([
          usersService.getUser(id),
          rolesService.listRoles(),
          rolesService.listPermissions(),
        ]);
        setUser(userData);
        setAllRoles(rolesData);
        setAllPermissions(permissionsData);
        setSelectedRoles(userData.roles.map((r) => r.id));

        // Initialize form data
        setFormData({
          full_name: userData.full_name || '',
          phone: userData.phone || '',
          company_name: userData.company_name || '',
          vat_number: userData.vat_number || '',
          company_registration: userData.company_registration || '',
          timezone: userData.timezone || 'UTC',
          address_street: userData.address_street || '',
          address_city: userData.address_city || '',
          address_state: userData.address_state || '',
          address_postal_code: userData.address_postal_code || '',
          address_country: userData.address_country || '',
        });

        // Initialize permission overrides
        const grants = userData.directPermissions
          .filter((dp) => dp.override_type === 'grant')
          .map((dp) => dp.permission.id);
        const denies = userData.directPermissions
          .filter((dp) => dp.override_type === 'deny')
          .map((dp) => dp.permission.id);
        setSelectedPermissions({ grants, denies });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch activity
  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      setActivityLoading(true);
      try {
        const result = await usersService.getUserActivity(id, activityPage, 10);
        setActivities(result.logs);
        setActivityTotal(result.total);
      } catch {
        // Silently fail - activity is supplementary
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, [id, activityPage]);

  const refreshUser = async () => {
    if (!id) return;
    try {
      const userData = await usersService.getUser(id);
      setUser(userData);
      setSelectedRoles(userData.roles.map((r) => r.id));

      const grants = userData.directPermissions
        .filter((dp) => dp.override_type === 'grant')
        .map((dp) => dp.permission.id);
      const denies = userData.directPermissions
        .filter((dp) => dp.override_type === 'deny')
        .map((dp) => dp.permission.id);
      setSelectedPermissions({ grants, denies });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh user');
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setIsApproving(true);
    try {
      await usersService.approveUser(id);
      await refreshUser();
      setSuccess('User approved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve user');
    } finally {
      setIsApproving(false);
    }
  };

  const handleFieldChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      profileAutoSave.handleChange(field, value);
    },
    [profileAutoSave]
  );

  const handleRoleToggle = useCallback(
    (roleId: string, checked: boolean) => {
      const newRoles = checked
        ? [...selectedRoles, roleId]
        : selectedRoles.filter((rid) => rid !== roleId);
      setSelectedRoles(newRoles);
      rolesSave.saveNow('roles', newRoles);
    },
    [selectedRoles, rolesSave]
  );

  const handlePermissionToggle = useCallback(
    (permissionId: string, type: 'grant' | 'deny' | 'none') => {
      let newPerms: { grants: string[]; denies: string[] };

      if (type === 'none') {
        newPerms = {
          grants: selectedPermissions.grants.filter((pid) => pid !== permissionId),
          denies: selectedPermissions.denies.filter((pid) => pid !== permissionId),
        };
      } else if (type === 'grant') {
        newPerms = {
          grants: [...selectedPermissions.grants.filter((pid) => pid !== permissionId), permissionId],
          denies: selectedPermissions.denies.filter((pid) => pid !== permissionId),
        };
      } else {
        newPerms = {
          grants: selectedPermissions.grants.filter((pid) => pid !== permissionId),
          denies: [...selectedPermissions.denies.filter((pid) => pid !== permissionId), permissionId],
        };
      }

      setSelectedPermissions(newPerms);
      permissionsSave.saveNow('permissions', newPerms);
    },
    [selectedPermissions, permissionsSave]
  );

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await usersService.uploadAvatar(id, file);
      await refreshUser();
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleStatusChange = async () => {
    if (!id || !confirmAction.type) return;
    setIsChangingStatus(true);
    try {
      let newStatus: UserStatus;
      switch (confirmAction.type) {
        case 'suspend':
          newStatus = 'suspended';
          break;
        case 'reactivate':
          newStatus = 'active';
          break;
        case 'deactivate':
          newStatus = 'deactivated';
          break;
      }
      await usersService.updateUser(id, { status: newStatus });
      await refreshUser();
      setConfirmAction({ type: null, isOpen: false });
      setSuccess(`User ${confirmAction.type}d successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsChangingStatus(false);
    }
  };

  const getConfirmDialogConfig = () => {
    switch (confirmAction.type) {
      case 'suspend':
        return {
          title: 'Suspend User',
          message: `Are you sure you want to suspend ${user?.full_name || user?.email}? They will not be able to log in until reactivated.`,
          confirmText: 'Suspend',
          variant: 'warning' as const,
        };
      case 'reactivate':
        return {
          title: 'Reactivate User',
          message: `Are you sure you want to reactivate ${user?.full_name || user?.email}? They will be able to log in again.`,
          confirmText: 'Reactivate',
          variant: 'info' as const,
        };
      case 'deactivate':
        return {
          title: 'Deactivate User',
          message: `Are you sure you want to deactivate ${user?.full_name || user?.email}? This action is typically permanent.`,
          confirmText: 'Deactivate',
          variant: 'danger' as const,
        };
      default:
        return { title: '', message: '', confirmText: '', variant: 'info' as const };
    }
  };

  // Completion status for checkmarks
  const getCompletionStatus = useCallback((): Record<ViewType, boolean> => {
    if (!user) return {} as Record<ViewType, boolean>;
    return {
      overview: true,
      // ORGANIZATION - placeholder for now, will be populated when data is available
      properties: false, // TODO: Check user.properties?.length > 0
      rooms: false, // TODO: Check rooms count from properties
      team: false, // TODO: Check team members count
      // OPERATIONS - placeholder for now
      customers: false, // TODO: Check customers count
      bookings: false, // TODO: Check bookings count
      reviews: false, // TODO: Check reviews count
      refunds: false, // TODO: Check refunds count
      // PROFILE
      personal: Boolean(user.full_name),
      address: Boolean(user.address_street || user.address_city || user.address_country),
      company: Boolean(user.company_name),
      // ACCESS
      roles: (user.roles?.length || 0) > 0,
      permissions: selectedPermissions.grants.length > 0 || selectedPermissions.denies.length > 0,
      // HISTORY
      activity: activities.length > 0,
    };
  }, [user, selectedPermissions, activities]);

  // Group permissions by resource
  const permissionsByResource = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) acc[perm.resource] = [];
      acc[perm.resource].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const resourceKeys = Object.keys(permissionsByResource);
  const completionStatus = getCompletionStatus();

  // Navigation sections - mirrors the screenshot layout
  const navSections: NavSection[] = [
    {
      title: 'GENERAL',
      items: [{ id: 'overview', label: 'Overview', icon: <GridIcon /> }],
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'properties', label: 'Properties', icon: <PropertyIcon />, count: 0 },
        { id: 'rooms', label: 'Rooms', icon: <RoomIcon />, count: 0 },
        { id: 'team', label: 'Team Members', icon: <TeamIcon />, count: 0 },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'customers', label: 'Customers', icon: <CustomerIcon /> },
        { id: 'bookings', label: 'Bookings', icon: <BookingIcon />, count: 0 },
        { id: 'reviews', label: 'Reviews', icon: <ReviewIcon /> },
        { id: 'refunds', label: 'Refunds', icon: <RefundIcon /> },
      ],
    },
    {
      title: 'PROFILE',
      items: [
        { id: 'personal', label: 'Personal Info', icon: <UserIcon /> },
        { id: 'address', label: 'Address', icon: <HomeIcon /> },
        { id: 'company', label: 'Company', icon: <BuildingIcon /> },
      ],
    },
    {
      title: 'ACCESS',
      items: [
        { id: 'roles', label: 'Roles', icon: <ShieldIcon />, count: user?.roles?.length || 0 },
        { id: 'permissions', label: 'Permissions', icon: <KeyIcon /> },
      ],
    },
    {
      title: 'HISTORY',
      items: [{ id: 'activity', label: 'Activity', icon: <ClockIcon /> }],
    },
  ];

  if (isLoading) {
    return (
      <AuthenticatedLayout title="User Details">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!user) {
    return (
      <AuthenticatedLayout title="User Details">
        <Alert variant="error">User not found</Alert>
      </AuthenticatedLayout>
    );
  }

  const confirmConfig = getConfirmDialogConfig();
  const permissionOverrideCount = selectedPermissions.grants.length + selectedPermissions.denies.length;

  // Render content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<CalendarIcon />}
                label="Member Since"
                value={formatDate(user.created_at)}
                color="green"
              />
              <StatCard
                icon={<ClockIcon />}
                label="Last Login"
                value={user.last_login_at ? formatRelativeDate(user.last_login_at) : 'Never'}
                color="yellow"
              />
              <StatCard
                icon={<ShieldIcon />}
                label="Roles"
                value={`${user.roles?.length || 0}`}
                subtext="assigned"
                color="blue"
              />
              <StatCard
                icon={<KeyIcon />}
                label="Permissions"
                value={`${permissionOverrideCount}`}
                subtext="overrides"
                color="purple"
              />
            </div>

            {/* Usage Overview */}
            <Card variant="bordered">
              <Card.Header>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Usage Overview</h3>
              </Card.Header>
              <Card.Body className="divide-y divide-gray-200 dark:divide-dark-border">
                <ProgressItem label="Roles" current={user.roles?.length || 0} max={allRoles.length} />
                <ProgressItem label="Permission Overrides" current={permissionOverrideCount} max={20} />
                <ProgressItem label="Profile Completion" current={Object.values(completionStatus).filter(Boolean).length} max={7} />
              </Card.Body>
            </Card>

            {/* Recent Activity Preview */}
            <Card variant="bordered">
              <Card.Header className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                <button
                  onClick={() => setActiveView('activity')}
                  className="text-sm text-primary hover:text-primary-600 font-medium"
                >
                  View all
                </button>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="divide-y divide-gray-200 dark:divide-dark-border">
                  {activityLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Skeleton variant="circular" width={32} height={32} />
                          <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width="60%" height={14} />
                            <Skeleton variant="text" width="40%" height={12} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded</p>
                    </div>
                  ) : (
                    activities.slice(0, 5).map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        );

      case 'personal':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <SaveStatus status={profileAutoSave.saveStatus} />
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.full_name}
                  onChange={(e) => handleFieldChange('full_name', e.target.value)}
                  placeholder="Enter full name"
                  fullWidth
                />
                <PhoneInput
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(value) => handleFieldChange('phone', value)}
                  fullWidth
                />
                <Select
                  label="Timezone"
                  value={formData.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  options={timezoneOptions}
                  fullWidth
                />
              </div>
            </Card.Body>
          </Card>
        );

      case 'address':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Address</h3>
              <SaveStatus status={profileAutoSave.saveStatus} />
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="Street Address"
                  value={formData.address_street}
                  onChange={(e) => handleFieldChange('address_street', e.target.value)}
                  placeholder="123 Main St"
                  fullWidth
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={formData.address_city}
                    onChange={(e) => handleFieldChange('address_city', e.target.value)}
                    placeholder="City"
                    fullWidth
                  />
                  <Input
                    label="State / Province"
                    value={formData.address_state}
                    onChange={(e) => handleFieldChange('address_state', e.target.value)}
                    placeholder="State"
                    fullWidth
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Postal Code"
                    value={formData.address_postal_code}
                    onChange={(e) => handleFieldChange('address_postal_code', e.target.value)}
                    placeholder="12345"
                    fullWidth
                  />
                  <Input
                    label="Country"
                    value={formData.address_country}
                    onChange={(e) => handleFieldChange('address_country', e.target.value)}
                    placeholder="Country"
                    fullWidth
                  />
                </div>
              </div>
            </Card.Body>
          </Card>
        );

      case 'company':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Company Information</h3>
              <SaveStatus status={profileAutoSave.saveStatus} />
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={formData.company_name}
                  onChange={(e) => handleFieldChange('company_name', e.target.value)}
                  placeholder="Company name"
                  fullWidth
                />
                <MaskedInput
                  label="VAT Number"
                  mask="vat"
                  value={formData.vat_number}
                  onChange={(value) => handleFieldChange('vat_number', value)}
                  helperText="10-digit VAT number"
                  fullWidth
                />
                <MaskedInput
                  label="Company Registration"
                  mask="company_registration"
                  value={formData.company_registration}
                  onChange={(value) => handleFieldChange('company_registration', value)}
                  helperText="Format: YYYY/NNNNNN/NN"
                  fullWidth
                />
              </div>
            </Card.Body>
          </Card>
        );

      case 'roles':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Roles</h3>
              <SaveStatus status={rolesSave.saveStatus} />
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                {allRoles.map((role) => (
                  <Checkbox
                    key={role.id}
                    checked={selectedRoles.includes(role.id)}
                    onCheckedChange={(checked) => handleRoleToggle(role.id, !!checked)}
                    label={role.display_name}
                    description={role.description ?? undefined}
                    disabled={rolesSave.isSaving}
                  />
                ))}
                {allRoles.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No roles available</p>
                )}
              </div>
            </Card.Body>
          </Card>
        );

      case 'permissions':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Direct Permissions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Override role-based permissions</p>
              </div>
              <SaveStatus status={permissionsSave.saveStatus} />
            </Card.Header>
            <Card.Body className="p-0">
              {resourceKeys.length > 0 ? (
                <Tabs defaultValue={resourceKeys[0]} variant="underline">
                  <div className="px-4 pt-2 border-b border-gray-200 dark:border-dark-border overflow-x-auto">
                    <TabsList variant="underline">
                      {resourceKeys.map((resource) => (
                        <TabsTrigger key={resource} value={resource} variant="underline">
                          <span className="capitalize">{resource}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  {resourceKeys.map((resource) => (
                    <TabsContent key={resource} value={resource} className="p-4">
                      <div className="space-y-2">
                        {permissionsByResource[resource].map((permission) => {
                          const isGranted = selectedPermissions.grants.includes(permission.id);
                          const isDenied = selectedPermissions.denies.includes(permission.id);

                          return (
                            <div
                              key={permission.id}
                              className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-dark-bg"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {permission.action}
                                </span>
                                {permission.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePermissionToggle(permission.id, isGranted ? 'none' : 'grant')
                                  }
                                  disabled={permissionsSave.isSaving}
                                  className={`px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                                    isGranted
                                      ? 'bg-success text-white'
                                      : 'bg-gray-200 text-gray-600 hover:bg-success/20 dark:bg-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  Grant
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePermissionToggle(permission.id, isDenied ? 'none' : 'deny')
                                  }
                                  disabled={permissionsSave.isSaving}
                                  className={`px-2 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                                    isDenied
                                      ? 'bg-error text-white'
                                      : 'bg-gray-200 text-gray-600 hover:bg-error/20 dark:bg-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  Deny
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No permissions available</p>
                </div>
              )}

              {/* Effective Permissions */}
              <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Effective Permissions ({user.effectivePermissions.length})
                </p>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {user.effectivePermissions.slice(0, 15).map((perm) => (
                    <Badge key={perm} variant="default" size="sm">
                      {perm}
                    </Badge>
                  ))}
                  {user.effectivePermissions.length > 15 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{user.effectivePermissions.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        );

      // ORGANIZATION section views
      case 'properties':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Properties</h3>
              <Button variant="primary" size="sm">
                Assign Property
              </Button>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<PropertyIcon />}
                title="No properties assigned to this user yet."
                description="Properties this user owns or manages will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      case 'rooms':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Rooms</h3>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<RoomIcon />}
                title="No rooms found for this user's properties."
                description="Rooms from assigned properties will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      case 'team':
        return (
          <Card variant="bordered">
            <Card.Header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Members</h3>
              <Button variant="primary" size="sm">
                Invite Member
              </Button>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<TeamIcon />}
                title="No team members yet."
                description="Team members this user has invited will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      // OPERATIONS section views
      case 'customers':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Customers</h3>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<CustomerIcon />}
                title="No customers found."
                description="Customers who have booked with this user will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      case 'bookings':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bookings</h3>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<BookingIcon />}
                title="No bookings found."
                description="Bookings for this user's properties will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      case 'reviews':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reviews</h3>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<ReviewIcon />}
                title="No reviews yet."
                description="Reviews for this user's properties will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      case 'refunds':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Refunds</h3>
            </Card.Header>
            <Card.Body>
              <EmptyState
                icon={<RefundIcon />}
                title="No refunds processed."
                description="Refund requests and history will appear here."
                size="sm"
              />
            </Card.Body>
          </Card>
        );

      case 'activity':
        return (
          <Card variant="bordered">
            <Card.Header>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity History</h3>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-dark-border">
                {activityLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Skeleton variant="circular" width={32} height={32} />
                        <div className="flex-1 space-y-2">
                          <Skeleton variant="text" width="60%" height={14} />
                          <Skeleton variant="text" width="40%" height={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded</p>
                  </div>
                ) : (
                  activities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)
                )}
              </div>

              {/* Pagination */}
              {activityTotal > 10 && (
                <div className="p-4 border-t border-gray-200 dark:border-dark-border flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Page {activityPage} of {Math.ceil(activityTotal / 10)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      disabled={activityPage === 1 || activityLoading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivityPage((p) => p + 1)}
                      disabled={activityPage >= Math.ceil(activityTotal / 10) || activityLoading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout title="User Details" subtitle="View and manage user account">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-dark-card rounded-md transition-colors"
          >
            <BackIcon />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.full_name || 'Unnamed User'}
              </h1>
              <Badge variant={statusColors[user.status]} size="md">
                {user.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Three-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Navigation */}
          <div className="lg:col-span-3">
            <Card variant="bordered" className="lg:sticky lg:top-6">
              <Card.Body className="p-3 space-y-4">
                {/* Profile Completion */}
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <CircularProgress
                    percentage={(() => {
                      const profileFields = ['personal', 'address', 'company', 'roles'] as const;
                      const completed = profileFields.filter(f => completionStatus[f]).length;
                      return (completed / profileFields.length) * 100;
                    })()}
                    size={48}
                    strokeWidth={4}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Profile Completion
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(() => {
                        const profileFields = ['personal', 'address', 'company', 'roles'] as const;
                        const completed = profileFields.filter(f => completionStatus[f]).length;
                        return `${completed} of ${profileFields.length} sections`;
                      })()}
                    </p>
                  </div>
                </div>

                {navSections.map((section) => (
                  <div key={section.title}>
                    <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </p>
                    <div className="mt-1 space-y-1">
                      {section.items.map((item) => (
                        <NavItemButton
                          key={item.id}
                          item={item}
                          isActive={activeView === item.id}
                          isComplete={completionStatus[item.id] || false}
                          onClick={() => setActiveView(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>

          {/* Center Column - Content */}
          <div className="lg:col-span-5">{renderContent()}</div>

          {/* Right Column - Profile Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Profile Card with Banner */}
              <Card variant="bordered" className="overflow-hidden">
                {/* Green Banner */}
                <div className="h-20 bg-gradient-to-br from-primary to-primary-600 relative">
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <button
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full group"
                    >
                      <Avatar
                        src={user.avatar_url || undefined}
                        name={user.full_name || user.email}
                        size="xl-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full transition-all flex items-center justify-center">
                        {isUploadingAvatar ? (
                          <Spinner size="sm" className="text-white" />
                        ) : (
                          <svg
                            className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Identity */}
                <div className="pt-11 pb-4 px-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.full_name || 'Unnamed User'}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant={statusColors[user.status]} size="sm">
                      {user.status}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      /{user.email.split('@')[0]}
                    </span>
                  </div>
                </div>
              </Card>

              {/* User Info */}
              <Card variant="bordered">
                <Card.Header>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User Info
                  </h3>
                </Card.Header>
                <Card.Body className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <MailIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 dark:text-gray-500">
                        <PhoneIcon />
                      </span>
                      <span className="text-gray-900 dark:text-white">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <GlobeIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white">{user.timezone || 'UTC'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <CalendarIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Joined {formatDate(user.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 dark:text-gray-500">
                      <UsersIcon />
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {user.roles?.length || 0} roles assigned
                    </span>
                  </div>
                </Card.Body>
              </Card>

              {/* Quick Actions */}
              <Card variant="bordered">
                <Card.Header>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quick Actions
                  </h3>
                </Card.Header>
                <Card.Body className="space-y-2">
                  {user.status === 'pending' && (
                    <Button
                      variant="primary"
                      onClick={handleApprove}
                      isLoading={isApproving}
                      className="w-full"
                    >
                      Approve User
                    </Button>
                  )}
                  {user.status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction({ type: 'suspend', isOpen: true })}
                      className="w-full text-warning border-warning/30 hover:bg-warning/10"
                    >
                      Pause User
                    </Button>
                  )}
                  {user.status === 'suspended' && (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmAction({ type: 'reactivate', isOpen: true })}
                      className="w-full"
                    >
                      Reactivate User
                    </Button>
                  )}
                  {user.status !== 'deactivated' && (
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmAction({ type: 'deactivate', isOpen: true })}
                      className="w-full text-error hover:bg-error/10"
                    >
                      Suspend User
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmAction.isOpen}
          onClose={() => setConfirmAction({ type: null, isOpen: false })}
          onConfirm={handleStatusChange}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          variant={confirmConfig.variant}
          isLoading={isChangingStatus}
        />
      </div>
    </AuthenticatedLayout>
  );
};
