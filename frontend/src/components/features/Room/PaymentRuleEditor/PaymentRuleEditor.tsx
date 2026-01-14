/**
 * Payment Rule Editor Component
 *
 * Allows property owners to configure payment rules for rooms.
 * Supports deposit rules, payment schedules, and flexible payment.
 */

import React, { useState } from 'react';
import { Button, Card, Modal, Badge } from '@/components/ui';
import { MarketingFeatureCard } from '@/components/features/Room/MarketingFeatureCard';
import { PaymentRuleEditorProps } from './PaymentRuleEditor.types';
import { DepositRuleForm } from './DepositRuleForm';
import { ScheduleRuleForm } from './ScheduleRuleForm';
import {
  PaymentRuleFormData,
  PaymentRuleType,
  PAYMENT_RULE_TYPE_LABELS,
  createEmptyFormData,
} from '@/types/payment-rules.types';
import { HiOutlinePlus, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

export const PaymentRuleEditor: React.FC<PaymentRuleEditorProps> = ({
  roomId,
  rules,
  onChange,
  disabled = false,
}) => {
  const [editingRule, setEditingRule] = useState<PaymentRuleFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  // Handle add new rule
  const handleAddRule = () => {
    setEditingRule(createEmptyFormData());
    setEditMode('create');
    setIsModalOpen(true);
  };

  // Handle edit existing rule
  const handleEditRule = (rule: PaymentRuleFormData) => {
    setEditingRule({ ...rule });
    setEditMode('edit');
    setIsModalOpen(true);
  };

  // Handle delete rule
  const handleDeleteRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Handle save rule (create or update)
  const handleSaveRule = () => {
    if (!editingRule) return;

    if (editMode === 'create') {
      // Add new rule
      onChange([...rules, editingRule]);
    } else {
      // Update existing rule
      const index = rules.findIndex((r) => r.id === editingRule.id);
      if (index !== -1) {
        const updated = [...rules];
        updated[index] = editingRule;
        onChange(updated);
      }
    }

    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  // Check if rule is valid
  const isRuleValid = (rule: PaymentRuleFormData): boolean => {
    if (!rule.rule_name.trim()) return false;

    if (rule.rule_type === 'deposit') {
      return rule.deposit_amount > 0;
    }

    if (rule.rule_type === 'payment_schedule') {
      return rule.schedule_config.length > 0;
    }

    return true;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Rules</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure deposit requirements and payment schedules for this room
          </p>
        </div>
        <Button size="sm" onClick={handleAddRule} disabled={disabled}>
          <HiOutlinePlus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No payment rules configured. Add a rule to define deposit requirements or payment schedules.
            </p>
            <Button onClick={handleAddRule} disabled={disabled}>
              <HiOutlinePlus className="w-4 h-4 mr-2" />
              Add First Rule
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            // Build subtitle with rule details
            let subtitle = '';
            if (rule.rule_type === 'deposit') {
              subtitle = `${rule.deposit_amount}${rule.deposit_type === 'percentage' ? '%' : ' ZAR'} deposit at booking, balance ${rule.balance_due === 'on_checkin' ? 'on check-in' : 'before check-in'}`;
            } else if (rule.rule_type === 'payment_schedule') {
              subtitle = `${rule.schedule_config.length} payment milestones`;
            } else if (rule.rule_type === 'flexible') {
              subtitle = 'Flexible payment (no requirements)';
            }

            // Add description if present
            if (rule.description) {
              subtitle = `${rule.description} • ${subtitle}`;
            }

            return (
              <MarketingFeatureCard
                key={rule.id || index}
                title={
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {rule.rule_name}
                    </span>
                    <Badge variant="info" size="sm">
                      {PAYMENT_RULE_TYPE_LABELS[rule.rule_type]}
                    </Badge>
                    {rule.applies_to_dates && (
                      <Badge variant="warning" size="sm">
                        Seasonal
                      </Badge>
                    )}
                  </div>
                }
                subtitle={subtitle}
                isActive={rule.is_active}
                onEdit={() => handleEditRule(rule)}
                onDelete={() => handleDeleteRule(index)}
              />
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title={editMode === 'create' ? 'Add Payment Rule' : 'Edit Payment Rule'}
        size="lg"
      >
        {editingRule && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingRule.rule_name}
                  onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Standard Deposit, 3-Part Payment Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editingRule.description}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Explain this rule to help manage your bookings..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingRule.rule_type}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, rule_type: e.target.value as PaymentRuleType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="flexible">Flexible Payment (no requirements)</option>
                  <option value="deposit">Deposit + Balance</option>
                  <option value="payment_schedule">Payment Schedule (multiple installments)</option>
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingRule.is_active}
                  onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (apply this rule to new bookings)
                </label>
              </div>
            </div>

            {/* Rule-specific Configuration */}
            {editingRule.rule_type === 'deposit' && (
              <DepositRuleForm rule={editingRule} onChange={setEditingRule} />
            )}

            {editingRule.rule_type === 'payment_schedule' && (
              <ScheduleRuleForm rule={editingRule} onChange={setEditingRule} />
            )}

            {/* Seasonal Dates (Optional) */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="applies_to_dates"
                  checked={editingRule.applies_to_dates}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, applies_to_dates: e.target.checked })
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="applies_to_dates" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Apply only to specific dates (seasonal rule)
                </label>
              </div>

              {editingRule.applies_to_dates && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editingRule.start_date}
                      onChange={(e) => setEditingRule({ ...editingRule, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editingRule.end_date}
                      onChange={(e) => setEditingRule({ ...editingRule, end_date: e.target.value })}
                      min={editingRule.start_date}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={handleCancel}>
                <HiOutlineX className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveRule} disabled={!isRuleValid(editingRule)}>
                <HiOutlineCheck className="w-4 h-4 mr-2" />
                {editMode === 'create' ? 'Add Rule' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
