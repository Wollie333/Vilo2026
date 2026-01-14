/**
 * CreateCancellationPolicyPage
 *
 * Page for creating a new cancellation policy.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Alert } from '@/components/ui';
import { legalService } from '@/services';
import { CancellationPolicyForm } from './components/CancellationPolicyForm';
import type { CreateCancellationPolicyData } from '@/types/legal.types';

export const CreateCancellationPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateCancellationPolicyData) => {
    setError(null);
    try {
      await legalService.createCancellationPolicy(data);
      navigate('/legal#cancellation', {
        state: { message: 'Cancellation policy created successfully' },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create policy';
      setError(errorMessage);
      throw err;
    }
  };

  const handleCancel = () => {
    navigate('/legal#cancellation');
  };

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
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </AuthenticatedLayout>
  );
};
