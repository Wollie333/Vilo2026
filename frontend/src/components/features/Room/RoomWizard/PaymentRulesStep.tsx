/**
 * PaymentRulesStep Component
 *
 * Step for selecting existing payment rules or creating new ones.
 * Payment rules are stored at property level and assigned to rooms.
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { HiOutlinePlus, HiOutlineCash, HiOutlineCheckCircle } from 'react-icons/hi';
import { PaymentRuleEditorInline } from './PaymentRuleEditorInline';
import type { PaymentRulesStepProps } from './RoomWizard.types';
import type { PaymentRule, PaymentRuleFormData } from '@/types/payment-rules.types';
import { PAYMENT_RULE_TYPE_LABELS } from '@/types/payment-rules.types';
import { paymentRulesService } from '@/services/payment-rules.service';

export const PaymentRulesStep: React.FC<PaymentRulesStepProps> = ({
  data,
  onChange,
  onNext,
  isLoading,
  propertyId,
  roomId,
}) => {
  const [availableRules, setAvailableRules] = useState<PaymentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected rule IDs from form data (multiple allowed)
  const selectedRuleIds = data.payment_rules.map(rule => rule.id).filter(Boolean);

  // Fetch available payment rules for this property
  useEffect(() => {
    const fetchRules = async () => {
      if (!propertyId) return;

      try {
        setLoading(true);
        setError(null);
        const rules = await paymentRulesService.listAllPaymentRules(propertyId);
        setAvailableRules(rules || []);
      } catch (err) {
        console.error('Failed to fetch payment rules:', err);
        setError('Failed to load payment rules');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [propertyId]);

  // Handle selecting/deselecting a rule (multiple allowed)
  const handleSelectRule = (rule: PaymentRule) => {
    const isSelected = selectedRuleIds.includes(rule.id);

    if (isSelected) {
      // Deselect - remove this rule from the array
      const updatedRules = data.payment_rules.filter(r => r.id !== rule.id);
      onChange({ ...data, payment_rules: updatedRules });
    } else {
      // Select this rule - add to the array
      const ruleFormData: PaymentRuleFormData = {
        id: rule.id,
        rule_name: rule.rule_name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        schedule_config: rule.schedule_config || [],
        allowed_payment_methods: rule.allowed_payment_methods || [],
        is_active: rule.is_active,
        applies_to_dates: rule.applies_to_dates,
        start_date: rule.start_date || '',
        end_date: rule.end_date || '',
        priority: rule.priority || 0,
        // Add deposit fields if it's a deposit rule
        ...(rule.rule_type === 'deposit' ? {
          deposit_type: rule.deposit_type || 'percentage',
          deposit_amount: rule.deposit_amount || 0,
          deposit_due: rule.deposit_due || 'at_booking',
          deposit_due_days: rule.deposit_due_days || 0,
          balance_due: rule.balance_due || 'on_checkin',
          balance_due_days: rule.balance_due_days || 0,
        } : {}),
      };

      // Add to the array
      onChange({ ...data, payment_rules: [...data.payment_rules, ruleFormData] });
    }
  };

  // Handle creating a new rule
  const handleCreateRule = async (ruleData: PaymentRuleFormData) => {
    if (!propertyId) return;

    try {
      setError(null);

      // Create the rule at property level
      const newRule = await paymentRulesService.createPaymentRuleGlobal({
        property_id: propertyId,
        room_ids: roomId ? [roomId] : [], // Auto-assign to current room if editing
        rule_name: ruleData.rule_name,
        description: ruleData.description || undefined,
        rule_type: ruleData.rule_type,
        schedule_config: ruleData.schedule_config,
        allowed_payment_methods: ruleData.allowed_payment_methods,
        is_active: ruleData.is_active,
        applies_to_dates: ruleData.applies_to_dates,
        start_date: ruleData.start_date || undefined,
        end_date: ruleData.end_date || undefined,
        priority: ruleData.priority,
        // Add deposit fields if deposit rule
        ...(ruleData.rule_type === 'deposit' ? {
          deposit_type: ruleData.deposit_type,
          deposit_amount: ruleData.deposit_amount,
          deposit_due: ruleData.deposit_due,
          deposit_due_days: ruleData.deposit_due_days,
          balance_due: ruleData.balance_due,
          balance_due_days: ruleData.balance_due_days,
        } : {}),
      });

      // Add to available rules
      setAvailableRules(prev => [...prev, newRule]);

      // Auto-select the newly created rule (add to existing selections)
      const newRuleFormData: PaymentRuleFormData = {
        id: newRule.id,
        rule_name: newRule.rule_name,
        description: newRule.description || '',
        rule_type: newRule.rule_type,
        schedule_config: newRule.schedule_config || [],
        allowed_payment_methods: newRule.allowed_payment_methods || [],
        is_active: newRule.is_active,
        applies_to_dates: newRule.applies_to_dates,
        start_date: newRule.start_date || '',
        end_date: newRule.end_date || '',
        priority: newRule.priority || 0,
        ...(newRule.rule_type === 'deposit' ? {
          deposit_type: newRule.deposit_type || 'percentage',
          deposit_amount: newRule.deposit_amount || 0,
          deposit_due: newRule.deposit_due || 'at_booking',
          deposit_due_days: newRule.deposit_due_days || 0,
          balance_due: newRule.balance_due || 'on_checkin',
          balance_due_days: newRule.balance_due_days || 0,
        } : {}),
      };

      // Add to existing selections
      onChange({ ...data, payment_rules: [...data.payment_rules, newRuleFormData] });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create payment rule:', err);
      setError(err instanceof Error ? err.message : 'Failed to create payment rule');
    }
  };

  // Format rule subtitle
  const formatRuleSubtitle = (rule: PaymentRule): string => {
    if (rule.rule_type === 'deposit') {
      return `${rule.deposit_amount}${rule.deposit_type === 'percentage' ? '%' : ' ZAR'} deposit at booking, balance ${rule.balance_due === 'on_checkin' ? 'on check-in' : 'before check-in'}`;
    } else if (rule.rule_type === 'payment_schedule') {
      const scheduleCount = rule.schedule_config?.length || 0;
      return `${scheduleCount} payment${scheduleCount !== 1 ? 's' : ''} scheduled`;
    } else if (rule.rule_type === 'flexible') {
      return 'Flexible payment terms';
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Rules</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select one or more payment rules to define deposit requirements and payment schedules for this room.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Create New Rule Form */}
          {showCreateForm ? (
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Create New Payment Rule
                </h3>
                <PaymentRuleEditorInline
                  onSave={handleCreateRule}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </Card>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRuleIds.length > 0
                  ? `${selectedRuleIds.length} payment rule${selectedRuleIds.length !== 1 ? 's' : ''} selected`
                  : 'No payment rules selected'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(true)}
              >
                <HiOutlinePlus className="w-4 h-4 mr-2" />
                Create New Payment Rule
              </Button>
            </div>
          )}

          {/* Available Payment Rules */}
          <div className="space-y-3">
            {/* Custom Payment Rules */}
            {availableRules.length === 0 ? (
              <Card className="border-dashed">
                <div className="p-6 text-center">
                  <HiOutlineCash className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    No custom payment rules yet. Create one to define deposit requirements and payment schedules.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <HiOutlinePlus className="w-4 h-4 mr-2" />
                    Create First Rule
                  </Button>
                </div>
              </Card>
            ) : (
              // Show custom payment rules
              availableRules.map((rule) => {
                const isSelected = selectedRuleIds.includes(rule.id);

                return (
                  <Card
                    key={rule.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleSelectRule(rule)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox Icon */}
                        <div className="mt-0.5">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded border-2 border-primary bg-primary flex items-center justify-center">
                              <HiOutlineCheckCircle className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {rule.rule_name}
                              </h4>
                              {rule.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {rule.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                {formatRuleSubtitle(rule)}
                              </p>
                            </div>

                            {/* Badges */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="default" size="sm">
                                {PAYMENT_RULE_TYPE_LABELS[rule.rule_type]}
                              </Badge>
                              {rule.is_active && (
                                <Badge variant="success" size="sm">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
        <Button onClick={onNext} disabled={isLoading || loading}>
          Continue
        </Button>
      </div>
    </div>
  );
};
