/**
 * Schedule Rule Form Component
 *
 * Form for configuring payment schedule with multiple milestones.
 */

import React from 'react';
import { Button, Input, Select } from '@/components/ui';
import { ScheduleRuleFormProps } from './PaymentRuleEditor.types';
import {
  MilestoneFormData,
  AmountType,
  DueTiming,
} from '@/types/payment-rules.types';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';

export const ScheduleRuleForm: React.FC<ScheduleRuleFormProps> = ({ rule, onChange, disabled = false }) => {
  // Ensure schedule_config is always an array (defensive programming)
  const milestones = rule.schedule_config || [];

  // Add new milestone
  const handleAddMilestone = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    const newSequence = milestones.length + 1;
    const newMilestone: MilestoneFormData = {
      sequence: newSequence,
      name: `Payment ${newSequence}`,
      amount_type: 'percentage',
      amount: 0,
      due: 'at_booking',
    };
    const updatedMilestones = [...milestones, newMilestone];
    onChange({ ...rule, schedule_config: updatedMilestones });
  };

  // Remove milestone
  const handleRemoveMilestone = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const updated = milestones.filter((_, i) => i !== index);
    // Resequence remaining milestones
    const resequenced = updated.map((m, i) => ({ ...m, sequence: i + 1 }));
    onChange({ ...rule, schedule_config: resequenced });
  };

  // Update milestone
  const handleUpdateMilestone = (index: number, updated: MilestoneFormData) => {
    const newMilestones = [...milestones];
    newMilestones[index] = updated;
    onChange({ ...rule, schedule_config: newMilestones });
  };

  // Calculate total percentage
  const totalPercentage = milestones
    .filter((m) => m.amount_type === 'percentage')
    .reduce((sum, m) => sum + m.amount, 0);

  const allPercentages = milestones.every((m) => m.amount_type === 'percentage');
  const isPercentageValid = !allPercentages || Math.abs(totalPercentage - 100) < 0.01;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Payment Schedule</h4>
        <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone} disabled={disabled}>
          <HiOutlinePlus className="w-4 h-4 mr-1" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            No payment milestones defined. Add milestones to create a payment schedule.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone} disabled={disabled}>
            <HiOutlinePlus className="w-4 h-4 mr-1" />
            Add First Milestone
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                {/* Sequence Badge */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs">
                  {milestone.sequence}
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-3">
                  {/* Name */}
                  <Input
                    label="Milestone Name *"
                    value={milestone.name}
                    onChange={(e) =>
                      handleUpdateMilestone(index, { ...milestone, name: e.target.value })
                    }
                    disabled={disabled}
                    placeholder="e.g., Deposit, First Payment, Balance"
                    fullWidth
                  />

                  {/* Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Amount Type"
                      value={milestone.amount_type}
                      onChange={(e) =>
                        handleUpdateMilestone(index, {
                          ...milestone,
                          amount_type: e.target.value as AmountType,
                        })
                      }
                      disabled={disabled}
                      options={[
                        { value: 'percentage', label: 'Percentage' },
                        { value: 'fixed_amount', label: 'Fixed Amount' },
                      ]}
                    />

                    <Input
                      label={`Amount * (${milestone.amount_type === 'percentage' ? '%' : 'ZAR'})`}
                      type="number"
                      value={milestone.amount}
                      onChange={(e) =>
                        handleUpdateMilestone(index, {
                          ...milestone,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      min={0}
                      max={milestone.amount_type === 'percentage' ? 100 : undefined}
                      step={milestone.amount_type === 'percentage' ? 1 : 100}
                      disabled={disabled}
                      fullWidth
                    />
                  </div>

                  {/* Due Timing */}
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Due Timing *"
                      value={milestone.due}
                      onChange={(e) =>
                        handleUpdateMilestone(index, { ...milestone, due: e.target.value as DueTiming })
                      }
                      disabled={disabled}
                      options={[
                        { value: 'at_booking', label: 'At Booking' },
                        { value: 'days_before_checkin', label: 'Days Before Check-in' },
                        { value: 'days_after_booking', label: 'Days After Booking' },
                        { value: 'on_checkin', label: 'On Check-in' },
                      ]}
                    />

                    {(milestone.due === 'days_before_checkin' || milestone.due === 'days_after_booking') && (
                      <Input
                        label="Days *"
                        type="number"
                        value={milestone.days || 0}
                        onChange={(e) =>
                          handleUpdateMilestone(index, {
                            ...milestone,
                            days: parseInt(e.target.value) || 0,
                          })
                        }
                        min={0}
                        disabled={disabled}
                        placeholder="e.g., 7"
                        fullWidth
                      />
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleRemoveMilestone(e, index)}
                  disabled={disabled || milestones.length === 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mt-6"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Another Milestone Button - at bottom of list for easy access */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMilestone}
              disabled={disabled}
              className="w-full"
            >
              <HiOutlinePlus className="w-4 h-4 mr-1" />
              Add Another Milestone
            </Button>
          </div>
        </div>
      )}

      {/* Validation Summary - More compact */}
      {milestones.length > 0 && (
        <div
          className={`p-3 rounded-md border ${
            isPercentageValid
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <h5
            className={`text-xs font-semibold mb-1.5 ${
              isPercentageValid ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'
            }`}
          >
            Schedule Summary
          </h5>
          <div
            className={`space-y-0.5 text-xs ${
              isPercentageValid ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}
          >
            <p>
              <strong>Total Milestones:</strong> {milestones.length}
            </p>
            {allPercentages && (
              <p>
                <strong>Total Percentage:</strong> {totalPercentage.toFixed(1)}%
                {!isPercentageValid && ' (must equal 100%)'}
              </p>
            )}
            {!allPercentages && (
              <p className="text-amber-600 dark:text-amber-400">
                <strong>Note:</strong> Mixed amount types. Ensure they cover the full booking amount
                amount.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
