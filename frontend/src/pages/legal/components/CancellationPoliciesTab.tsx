/**
 * CancellationPoliciesTab
 *
 * Manages centralized cancellation policies.
 * Policies created here are used across all properties and rooms.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner, ConfirmDialog, Alert } from '@/components/ui';
import { legalService } from '@/services';
import { PolicyCard } from './PolicyCard';
import type { CancellationPolicy } from '@/types/legal.types';

interface CancellationPoliciesTabProps {
  policies: CancellationPolicy[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export const CancellationPoliciesTab: React.FC<CancellationPoliciesTabProps> = ({
  policies,
  isLoading,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [deletingPolicy, setDeletingPolicy] = useState<CancellationPolicy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = () => {
    navigate('/legal/cancellation-policies/new');
  };

  const handleEdit = (policy: CancellationPolicy) => {
    navigate(`/legal/cancellation-policies/${policy.id}/edit`);
  };

  const handleDelete = (policy: CancellationPolicy) => {
    setDeletingPolicy(policy);
  };

  const confirmDelete = async () => {
    if (!deletingPolicy) return;

    setIsDeleting(true);
    setError(null);
    try {
      await legalService.deleteCancellationPolicy(deletingPolicy.id);
      setSuccess('Policy deleted successfully');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete policy');
    } finally {
      setIsDeleting(false);
      setDeletingPolicy(null);
    }
  };

  // Clear success message after 3 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cancellation Policies
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage cancellation policies used across all properties and rooms
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          leftIcon={<PlusIcon />}
        >
          Add Policy
        </Button>
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

      {/* Policy Grid */}
      {policies.length === 0 ? (
        <Card variant="bordered">
          <Card.Body className="py-16">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ShieldCheckIcon />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Cancellation Policies
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Create your first cancellation policy to define how refunds are handled for bookings.
              </p>
              <Button variant="primary" onClick={handleCreate} leftIcon={<PlusIcon />}>
                Create Policy
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      {policies.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>100% refund</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span>50% refund</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>No refund</span>
          </div>
        </div>
      )}

      {/* Info */}
      <Alert variant="info">
        <p className="text-sm">
          <strong>How it works:</strong> Policies created here can be selected when setting up
          properties or rooms. Default policies (marked with a badge) cannot be deleted but can
          be edited.
        </p>
      </Alert>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPolicy}
        onClose={() => setDeletingPolicy(null)}
        onConfirm={confirmDelete}
        title="Delete Cancellation Policy"
        message={`Are you sure you want to delete "${deletingPolicy?.name}"? This action cannot be undone. Properties using this policy will need to select a different one.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
