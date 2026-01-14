/**
 * PaymentScheduleDisplay Component
 *
 * Displays payment schedule milestones with status tracking.
 * Shows scheduled vs actual payments with visual indicators.
 */

import React from 'react';
import { Badge, Card } from '@/components/ui';
import { HiOutlineCalendar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamation } from 'react-icons/hi';
import type { PaymentScheduleMilestone } from '@/services/payment-schedule.service';

interface PaymentScheduleDisplayProps {
  schedule: PaymentScheduleMilestone[];
  currency: string;
  totalAmount: number;
  amountPaid: number;
}

export const PaymentScheduleDisplay: React.FC<PaymentScheduleDisplayProps> = ({
  schedule,
  currency,
  totalAmount,
  amountPaid,
}) => {
  if (schedule.length === 0) {
    return (
      <Card variant="bordered" padding="md">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No payment schedule configured for this booking.
        </p>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (milestone: PaymentScheduleMilestone) => {
    const daysUntil = getDaysUntilDue(milestone.due_date);

    switch (milestone.status) {
      case 'paid':
        return (
          <Badge variant="success" size="sm">
            <HiOutlineCheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="warning" size="sm">
            <HiOutlineClock className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="danger" size="sm">
            <HiOutlineExclamation className="w-3 h-3 mr-1" />
            Overdue ({Math.abs(daysUntil)} days)
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="default" size="sm">
            Cancelled
          </Badge>
        );
      default: // pending
        if (daysUntil < 0) {
          return (
            <Badge variant="danger" size="sm">
              <HiOutlineExclamation className="w-3 h-3 mr-1" />
              Due {Math.abs(daysUntil)} days ago
            </Badge>
          );
        } else if (daysUntil === 0) {
          return (
            <Badge variant="warning" size="sm">
              <HiOutlineClock className="w-3 h-3 mr-1" />
              Due Today
            </Badge>
          );
        } else if (daysUntil <= 7) {
          return (
            <Badge variant="warning" size="sm">
              <HiOutlineClock className="w-3 h-3 mr-1" />
              Due in {daysUntil} days
            </Badge>
          );
        } else {
          return (
            <Badge variant="default" size="sm">
              <HiOutlineCalendar className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          );
        }
    }
  };

  const progressPercentage = (amountPaid / totalAmount) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <Card variant="bordered" padding="md">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Progress</h3>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {progressPercentage.toFixed(0)}% Complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                progressPercentage >= 100
                  ? 'bg-green-500'
                  : progressPercentage > 0
                  ? 'bg-primary'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>

          {/* Amount Summary */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Paid: </span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(amountPaid)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total: </span>
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {amountPaid < totalAmount && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Outstanding:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(totalAmount - amountPaid)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Milestones List */}
      <div className="space-y-3">
        {schedule.map((milestone) => {
          const percentagePaid = (milestone.amount_paid / milestone.amount_due) * 100;

          return (
            <Card
              key={milestone.id}
              variant="bordered"
              className={`${
                milestone.status === 'overdue'
                  ? 'border-red-300 dark:border-red-800'
                  : milestone.status === 'paid'
                  ? 'border-green-300 dark:border-green-800'
                  : ''
              }`}
            >
              <Card.Body className="p-4">
                <div className="flex items-start gap-4">
                  {/* Sequence Badge */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      milestone.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : milestone.status === 'overdue'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-primary/10 text-primary dark:bg-primary/20'
                    }`}
                  >
                    {milestone.milestone_sequence}
                  </div>

                  {/* Milestone Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {milestone.milestone_name}
                      </h4>
                      {getStatusBadge(milestone)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Due Date: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatDate(milestone.due_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Amount Due: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(milestone.amount_due)}
                        </span>
                      </div>
                    </div>

                    {milestone.amount_paid > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            Paid: {formatCurrency(milestone.amount_paid)}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {percentagePaid.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              milestone.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(percentagePaid, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {milestone.paid_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Paid on {formatDate(milestone.paid_at)}
                      </div>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
