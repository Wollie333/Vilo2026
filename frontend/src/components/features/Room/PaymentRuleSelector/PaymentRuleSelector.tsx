/**
 * PaymentRuleSelector Component
 *
 * Displays payment rules as selectable cards for easy assignment to rooms.
 */

import React, { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineCash } from 'react-icons/hi';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { Button, Badge, Spinner } from '@/components/ui';
import { paymentRulesService } from '@/services';
import { PaymentRule } from '@/types/payment-rules.types';
import { PaymentRuleSelectorProps } from './PaymentRuleSelector.types';

export const PaymentRuleSelector: React.FC<PaymentRuleSelectorProps> = ({
  selectedIds,
  onSelectionChange,
  propertyId,
  multiple = true,
}) => {
  const [rules, setRules] = useState<PaymentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, [propertyId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentRulesService.listAllPaymentRules(propertyId);
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch payment rules:', err);
      setError('Failed to load payment rules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id: string) => {
    if (multiple) {
      // Toggle selection
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    } else {
      // Single selection
      onSelectionChange(selectedIds.includes(id) ? [] : [id]);
    }
  };

  const getRuleTypeBadgeVariant = (ruleType: string) => {
    switch (ruleType) {
      case 'deposit':
        return 'info';
      case 'payment_schedule':
        return 'warning';
      case 'flexible':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRuleTypeLabel = (ruleType: string) => {
    switch (ruleType) {
      case 'deposit':
        return 'Deposit';
      case 'payment_schedule':
        return 'Payment Schedule';
      case 'flexible':
        return 'Flexible';
      default:
        return ruleType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
          <HiOutlineCash className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchRules}>
          Try Again
        </Button>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <HiOutlineCash className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Payment Rules Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
          Create payment rules first before assigning them to rooms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Select Payment Rules
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {multiple
              ? 'Choose one or more payment rules to apply to this room'
              : 'Choose a payment rule to apply to this room'}
          </p>
        </div>
        {selectedIds.length > 0 && (
          <Badge variant="primary">{selectedIds.length} selected</Badge>
        )}
      </div>

      {/* Grid of selectable cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule) => (
          <SelectableCard
            key={rule.id}
            id={rule.id}
            selected={selectedIds.includes(rule.id)}
            onSelect={handleSelect}
          >
            {/* Rule card content */}
            <div className="space-y-3">
              {/* Header with name and type badge */}
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-medium text-gray-900 dark:text-white flex-1">
                  {rule.rule_name}
                </h4>
                <Badge variant={getRuleTypeBadgeVariant(rule.rule_type)} size="sm">
                  {getRuleTypeLabel(rule.rule_type)}
                </Badge>
              </div>

              {/* Description */}
              {rule.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {rule.description}
                </p>
              )}

              {/* Rule details based on type */}
              {rule.rule_type === 'deposit' && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Deposit:</span>
                    <span className="font-medium">
                      {rule.deposit_type === 'percentage'
                        ? `${rule.deposit_amount}%`
                        : `R${rule.deposit_amount?.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}

              {rule.rule_type === 'payment_schedule' && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Milestones:</span>
                    <span className="font-medium">
                      {rule.schedule_config?.length || 0} payments
                    </span>
                  </div>
                </div>
              )}

              {/* Status indicator */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div
                  className={`w-2 h-2 rounded-full ${
                    rule.is_active ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {rule.is_active ? 'Active' : 'Inactive'}
                </span>
                {rule.applies_to_dates && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Seasonal</span>
                  </>
                )}
              </div>
            </div>
          </SelectableCard>
        ))}
      </div>

      {/* Help text */}
      {selectedIds.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Click on a card to select it
        </p>
      )}
    </div>
  );
};
