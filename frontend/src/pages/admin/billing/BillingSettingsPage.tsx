import React, { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
  Alert,
  Button,
  Badge,
  Input,
  ConfirmDialog,
} from '@/components/ui';
import { billingService } from '@/services';
import { PaymentIntegrationsTab } from './components/PaymentIntegrationsTab';
import type {
  UserType,
  BillingStatus,
  SubscriptionTypeWithLimits,
  BillingStatusColor,
} from '@/types/billing.types';

// Icons
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const StatusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SubscriptionIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const LimitsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PaymentIntegrationsIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

// Color badge mapping
const statusColorMap: Record<BillingStatusColor, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

// Format price in cents to display
const formatPrice = (cents: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
};

// Format billing cycle
const formatBillingCycle = (days: number | null, isRecurring: boolean): string => {
  if (!days) return isRecurring ? 'Custom' : 'One-time';
  if (days === 30) return 'Monthly';
  if (days === 90) return 'Quarterly';
  if (days === 180) return 'Bi-Annually';
  if (days === 365) return 'Annually';
  return `Every ${days} days`;
};

// ============================================================================
// USER TYPES TAB
// ============================================================================

interface UserTypesTabProps {
  userTypes: UserType[];
  isLoading: boolean;
  onRefresh: () => void;
}

const UserTypesTab: React.FC<UserTypesTabProps> = ({ userTypes, isLoading, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ display_name: string; description: string }>({ display_name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (userType: UserType) => {
    setEditingId(userType.id);
    setEditForm({ display_name: userType.display_name, description: userType.description || '' });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    setError(null);
    try {
      await billingService.updateUserType(editingId, editForm);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await billingService.deleteUserType(deleteId);
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="bordered">
        <Card.Header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">User Types</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Define the classification of users in your system
            </p>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {userTypes.map((userType) => (
              <div key={userType.id} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-border/50">
                {editingId === userType.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Display Name"
                      fullWidth
                    />
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      fullWidth
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={handleSave} isLoading={isSaving}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {userType.display_name}
                        </h4>
                        {userType.is_system_type && (
                          <Badge variant="default" size="sm">System</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {userType.description || 'No description'}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          {userType.can_have_subscription ? <CheckIcon /> : <XIcon />}
                          Subscription
                        </span>
                        <span className="flex items-center gap-1">
                          {userType.can_have_team ? <CheckIcon /> : <XIcon />}
                          Team
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(userType)}>
                        <EditIcon />
                      </Button>
                      {!userType.is_system_type && (
                        <Button size="sm" variant="ghost" className="text-error" onClick={() => setDeleteId(userType.id)}>
                          <TrashIcon />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User Type"
        message="Are you sure you want to delete this user type? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// ============================================================================
// BILLING STATUSES TAB
// ============================================================================

interface BillingStatusesTabProps {
  billingStatuses: BillingStatus[];
  isLoading: boolean;
  onRefresh: () => void;
}

const BillingStatusesTab: React.FC<BillingStatusesTabProps> = ({ billingStatuses, isLoading, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ display_name: string; description: string; feature_access_level: number }>({ display_name: '', description: '', feature_access_level: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (status: BillingStatus) => {
    setEditingId(status.id);
    setEditForm({
      display_name: status.display_name,
      description: status.description || '',
      feature_access_level: status.feature_access_level,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    setError(null);
    try {
      await billingService.updateBillingStatus(editingId, editForm);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await billingService.deleteBillingStatus(deleteId);
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="bordered">
        <Card.Header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Billing Statuses</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Define billing states that affect feature access
            </p>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {billingStatuses.map((status) => (
              <div key={status.id} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-border/50">
                {editingId === status.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Display Name"
                      fullWidth
                    />
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      fullWidth
                    />
                    <Input
                      type="number"
                      value={String(editForm.feature_access_level)}
                      onChange={(e) => setEditForm({ ...editForm, feature_access_level: parseInt(e.target.value) || 0 })}
                      placeholder="Feature Access Level (0-100)"
                      fullWidth
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={handleSave} isLoading={isSaving}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColorMap[status.color]} size="sm">
                          {status.display_name}
                        </Badge>
                        {status.is_system_status && (
                          <Badge variant="default" size="sm">System</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {status.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Feature Access Level: {status.feature_access_level}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(status)}>
                        <EditIcon />
                      </Button>
                      {!status.is_system_status && (
                        <Button size="sm" variant="ghost" className="text-error" onClick={() => setDeleteId(status.id)}>
                          <TrashIcon />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Billing Status"
        message="Are you sure you want to delete this billing status? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// ============================================================================
// SUBSCRIPTION TYPES TAB
// ============================================================================

interface SubscriptionTypesTabProps {
  subscriptionTypes: SubscriptionTypeWithLimits[];
  isLoading: boolean;
  onRefresh: () => void;
}

const SubscriptionTypesTab: React.FC<SubscriptionTypesTabProps> = ({ subscriptionTypes, isLoading, onRefresh }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ display_name: string; description: string; price_cents: number; is_active: boolean }>({ display_name: '', description: '', price_cents: 0, is_active: true });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (sub: SubscriptionTypeWithLimits) => {
    setEditingId(sub.id);
    setEditForm({
      display_name: sub.display_name,
      description: sub.description || '',
      price_cents: sub.price_cents,
      is_active: sub.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    setError(null);
    try {
      await billingService.updateSubscriptionType(editingId, editForm);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setError(null);
    try {
      await billingService.deleteSubscriptionType(deleteId);
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="bordered">
        <Card.Header className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Subscription Types</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Define billing plans and their pricing
            </p>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {subscriptionTypes.map((sub) => (
              <div key={sub.id} className="p-4 hover:bg-gray-50 dark:hover:bg-dark-border/50">
                {editingId === sub.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.display_name}
                      onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                      placeholder="Display Name"
                      fullWidth
                    />
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Description"
                      fullWidth
                    />
                    <Input
                      type="number"
                      value={String(editForm.price_cents)}
                      onChange={(e) => setEditForm({ ...editForm, price_cents: parseInt(e.target.value) || 0 })}
                      placeholder="Price (in cents)"
                      fullWidth
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={handleSave} isLoading={isSaving}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {sub.display_name}
                        </h4>
                        <Badge variant={sub.is_active ? 'success' : 'default'} size="sm">
                          {sub.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sub.description || 'No description'}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatPrice(sub.price_cents, sub.currency)}
                        </span>
                        <span>{formatBillingCycle(sub.billing_cycle_days, sub.is_recurring)}</span>
                        <span>{sub.limits.length} limits configured</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(sub)}>
                        <EditIcon />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-error" onClick={() => setDeleteId(sub.id)}>
                        <TrashIcon />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Subscription Type"
        message="Are you sure you want to delete this subscription type? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// ============================================================================
// LIMITS TAB
// ============================================================================

interface LimitsTabProps {
  subscriptionTypes: SubscriptionTypeWithLimits[];
  isLoading: boolean;
  onRefresh: () => void;
}

const LimitsTab: React.FC<LimitsTabProps> = ({ subscriptionTypes, isLoading, onRefresh }) => {
  const [editingLimitId, setEditingLimitId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveLimit = async (limitId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      await billingService.updateSubscriptionLimit(limitId, { limit_value: editValue });
      setEditingLimitId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const formatLimitValue = (value: number): string => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Subscription Limits</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure resource limits for each subscription type. Use -1 for unlimited.
          </p>
        </Card.Header>
        <Card.Body className="p-0">
          {subscriptionTypes.map((sub, index) => (
            <div key={sub.id}>
              {index > 0 && <div className="border-t-4 border-gray-100 dark:border-dark-border" />}
              <div className="bg-gray-50 dark:bg-dark-border/30 px-4 py-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{sub.display_name}</h4>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-dark-border">
                {sub.limits.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    No limits configured for this subscription type.
                  </div>
                ) : (
                  sub.limits.map((limit) => (
                    <div key={limit.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-border/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {limit.limit_key.replace(/_/g, ' ')}
                        </p>
                        {limit.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {limit.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingLimitId === limit.id ? (
                          <>
                            <Input
                              type="number"
                              value={String(editValue)}
                              onChange={(e) => setEditValue(parseInt(e.target.value))}
                              className="w-24"
                            />
                            <Button size="sm" variant="primary" onClick={() => handleSaveLimit(limit.id)} isLoading={isSaving}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingLimitId(null)}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className={`text-sm font-medium ${limit.limit_value === -1 ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                              {formatLimitValue(limit.limit_value)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingLimitId(limit.id);
                                setEditValue(limit.limit_value);
                              }}
                            >
                              <EditIcon />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </Card.Body>
      </Card>
    </div>
  );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

export const BillingSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('user-types');
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [billingStatuses, setBillingStatuses] = useState<BillingStatus[]>([]);
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionTypeWithLimits[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await billingService.getBillingOverview();
      setUserTypes(overview.userTypes);
      setBillingStatuses(overview.billingStatuses);
      setSubscriptionTypes(overview.subscriptionTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AuthenticatedLayout title="Billing Settings" subtitle="Manage user types, billing statuses, and subscriptions">
      <div className="space-y-6">
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card variant="bordered">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 dark:border-dark-border">
              <TabsList variant="underline" className="px-4">
                <TabsTrigger value="user-types" variant="underline">
                  <span className="flex items-center gap-2">
                    <UsersIcon />
                    User Types
                  </span>
                </TabsTrigger>
                <TabsTrigger value="billing-statuses" variant="underline">
                  <span className="flex items-center gap-2">
                    <StatusIcon />
                    Billing Statuses
                  </span>
                </TabsTrigger>
                <TabsTrigger value="subscription-types" variant="underline">
                  <span className="flex items-center gap-2">
                    <SubscriptionIcon />
                    Subscription Types
                  </span>
                </TabsTrigger>
                <TabsTrigger value="limits" variant="underline">
                  <span className="flex items-center gap-2">
                    <LimitsIcon />
                    Limits
                  </span>
                </TabsTrigger>
                <TabsTrigger value="payment-integrations" variant="underline">
                  <span className="flex items-center gap-2">
                    <PaymentIntegrationsIcon />
                    Payment Integrations
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent value="user-types">
                <UserTypesTab userTypes={userTypes} isLoading={isLoading} onRefresh={loadData} />
              </TabsContent>
              <TabsContent value="billing-statuses">
                <BillingStatusesTab billingStatuses={billingStatuses} isLoading={isLoading} onRefresh={loadData} />
              </TabsContent>
              <TabsContent value="subscription-types">
                <SubscriptionTypesTab subscriptionTypes={subscriptionTypes} isLoading={isLoading} onRefresh={loadData} />
              </TabsContent>
              <TabsContent value="limits">
                <LimitsTab subscriptionTypes={subscriptionTypes} isLoading={isLoading} onRefresh={loadData} />
              </TabsContent>
              <TabsContent value="payment-integrations">
                <PaymentIntegrationsTab />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};
