/**
 * PaymentRuleManager Component
 *
 * Manages payment rules with CRUD operations.
 * Displays rules and handles add/edit/delete with backend integration.
 */

import React, { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { HiOutlinePlus } from 'react-icons/hi';
import { PaymentRulesDisplay } from '../PaymentRulesDisplay';
import { PaymentRuleEditorSingle } from '../PaymentRuleEditor';
import { paymentRulesService } from '@/services';
import type { PaymentRule, PaymentRuleFormData } from '@/types/payment-rules.types';
import type { PaymentRuleManagerProps } from './PaymentRuleManager.types';

export const PaymentRuleManager: React.FC<PaymentRuleManagerProps> = ({
  roomId,
  rules,
  onRulesChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PaymentRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingRule(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: PaymentRule) => {
    setEditingRule(rule);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (ruleData: PaymentRuleFormData) => {
    setSaving(true);
    setError(null);

    try {
      if (editingRule) {
        // Update existing rule
        await paymentRulesService.updatePaymentRule(roomId, editingRule.id, ruleData);
      } else {
        // Create new rule
        await paymentRulesService.createPaymentRule(roomId, ruleData);
      }

      // Refresh the rules list
      onRulesChange();

      // Close modal
      setIsModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      console.error('Failed to save payment rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to save payment rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment rule?')) {
      return;
    }

    try {
      await paymentRulesService.deletePaymentRule(roomId, ruleId);

      // Refresh the rules list
      onRulesChange();
    } catch (err) {
      console.error('Failed to delete payment rule:', err);
      alert('Failed to delete payment rule. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleAdd}>
          <HiOutlinePlus className="w-4 h-4 mr-2" />
          Add Payment Rule
        </Button>
      </div>

      {/* Rules Display */}
      <PaymentRulesDisplay rules={rules} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        size="lg"
        title={editingRule ? 'Edit Payment Rule' : 'Create Payment Rule'}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <PaymentRuleEditorSingle
          roomId={roomId}
          initialData={editingRule}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      </Modal>
    </div>
  );
};
