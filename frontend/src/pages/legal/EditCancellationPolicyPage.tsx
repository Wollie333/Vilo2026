/**
 * EditCancellationPolicyPage
 *
 * Page for editing an existing cancellation policy.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert, Spinner } from '@/components/ui';
import { legalService } from '@/services';
import { CancellationPolicyForm } from './components/CancellationPolicyForm';
import type { CancellationPolicy, CreateCancellationPolicyData } from '@/types/legal.types';

export const EditCancellationPolicyPage: React.FC = () => {
  const { id, propertyId } = useParams<{ id: string; propertyId?: string }>();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      if (!id) {
        setError('Policy ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const data = await legalService.getCancellationPolicy(id);
        setPolicy(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policy');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicy();
  }, [id]);

  const handleSubmit = async (data: CreateCancellationPolicyData) => {
    if (!id) return;

    setError(null);
    try {
      await legalService.updateCancellationPolicy(id, data);
      // Navigate back to property legal tab if in property context, otherwise to legal page
      if (propertyId) {
        navigate(`/manage/properties/${propertyId}#legal`, {
          state: { message: 'Cancellation policy updated successfully' },
        });
      } else {
        navigate('/legal#cancellation', {
          state: { message: 'Cancellation policy updated successfully' },
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update policy';
      setError(errorMessage);
      throw err;
    }
  };

  const handleCancel = () => {
    // Navigate back to property legal tab if in property context, otherwise to legal page
    if (propertyId) {
      navigate(`/manage/properties/${propertyId}#legal`);
    } else {
      navigate('/legal#cancellation');
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !policy) {
    return (
      <AuthenticatedLayout>
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <Alert variant="error">
              {error}
            </Alert>
            <button
              onClick={handleCancel}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Back to Cancellation Policies
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        {error && (
          <div className="max-w-3xl mx-auto mb-4">
            <Alert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}
        <CancellationPolicyForm
          mode="edit"
          policy={policy}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
