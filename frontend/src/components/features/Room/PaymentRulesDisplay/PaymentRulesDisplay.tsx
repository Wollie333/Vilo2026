/**
 * PaymentRulesDisplay Component
 *
 * Displays payment rules in card format with edit/delete actions.
 */

import React from 'react';
import { Badge, Button, Card } from '@/components/ui';
import {
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi';
import type { PaymentRulesDisplayProps } from './PaymentRulesDisplay.types';
import type { PaymentRule } from '@/types/payment-rules.types';

export const PaymentRulesDisplay: React.FC<PaymentRulesDisplayProps> = ({
  rules,
  onEdit,
  onDelete,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          No Payment Rules Configured
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Add payment rules to define deposit requirements and payment schedules for guests booking
          this room.
        </p>
      </div>
    );
  }

  const formatDueTiming = (timing: string, days?: number | null): string => {
    switch (timing) {
      case 'at_booking':
        return 'at booking';
      case 'on_checkin':
        return 'on check-in';
      case 'days_before_checkin':
        return `${days || 0} days before check-in`;
      case 'days_after_booking':
        return `${days || 0} days after booking`;
      case 'specific_date':
        return 'on specific date';
      default:
        return timing;
    }
  };

  const formatAmount = (type: string | null, amount: number | null): string => {
    if (!amount) return '0';
    return type === 'percentage' ? `${amount}%` : `R${amount.toFixed(2)}`;
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <HiOutlineCash className="w-5 h-5" />;
      case 'payment_schedule':
        return <HiOutlineCalendar className="w-5 h-5" />;
      default:
        return <HiOutlineCash className="w-5 h-5" />;
    }
  };

  const getRuleTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      deposit: 'Deposit',
      payment_schedule: 'Payment Schedule',
      flexible: 'Flexible',
    };
    return (
      <Badge variant="default" size="sm">
        {labels[type] || type}
      </Badge>
    );
  };

  const renderRuleDetails = (rule: PaymentRule) => {
    if (rule.rule_type === 'deposit') {
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>
            • {formatAmount(rule.deposit_type, rule.deposit_amount)} deposit due{' '}
            {formatDueTiming(rule.deposit_due || '', rule.deposit_due_days)}
          </div>
          <div>
            • Balance due {formatDueTiming(rule.balance_due || '', rule.balance_due_days)}
          </div>
        </div>
      );
    }

    if (rule.rule_type === 'payment_schedule') {
      const milestones = rule.schedule_config || [];
      const milestoneCount = milestones.length;

      if (milestoneCount === 0) {
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            • No milestones configured yet
          </div>
        );
      }

      const summary = milestones.map((m) => formatAmount(m.amount_type, m.amount)).join(' → ');

      return (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>• {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''} configured</div>
          <div>• {summary}</div>
        </div>
      );
    }

    if (rule.rule_type === 'flexible') {
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          • No fixed payment schedule - guests pay as they go
        </div>
      );
    }

    return null;
  };

  const formatDateRange = (startDate: string | null, endDate: string | null): string => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const end = new Date(endDate).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <Card key={rule.id} variant="bordered">
          <Card.Body className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left side: Rule info */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-gray-400 dark:text-gray-500">{getRuleTypeIcon(rule.rule_type)}</div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {rule.rule_name}
                  </h4>
                  {getRuleTypeBadge(rule.rule_type)}
                  {rule.is_active ? (
                    <Badge variant="success" size="sm">
                      <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      <HiOutlineXCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {rule.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{rule.description}</p>
                )}

                {/* Rule details */}
                {renderRuleDetails(rule)}

                {/* Date range if seasonal */}
                {rule.applies_to_dates && rule.start_date && rule.end_date && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Applies: {formatDateRange(rule.start_date, rule.end_date)}
                  </div>
                )}

                {/* Priority indicator */}
                {rule.priority > 0 && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Priority: {rule.priority}
                  </div>
                )}
              </div>

              {/* Right side: Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(rule)}
                  title="Edit rule"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(rule.id)}
                  title="Delete rule"
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};
