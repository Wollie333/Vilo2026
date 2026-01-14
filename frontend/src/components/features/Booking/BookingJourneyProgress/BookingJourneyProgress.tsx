/**
 * BookingJourneyProgress Component
 *
 * Vertical progress indicator showing booking lifecycle stages
 */

import React from 'react';
import type { BookingJourneyProgressProps } from './BookingJourneyProgress.types';
import { ProgressSteps } from '@/components/ui';
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  CheckInIcon,
  CheckOutIcon,
} from '@/components/ui';
import type { BookingStatus } from '@/types/booking.types';

const getCurrentStepIndex = (status: BookingStatus): number => {
  const stepMap: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 1,
    pending_modification: 1,
    checked_in: 2,
    checked_out: 3,
    completed: 4,
    cancelled: -1,
    no_show: -1,
  };
  return stepMap[status] ?? 0;
};

const formatStepDate = (date: string | null | undefined): string => {
  if (!date) return 'Pending';
  return new Date(date).toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const BookingJourneyProgress: React.FC<BookingJourneyProgressProps> = ({
  status,
  createdAt,
  confirmedAt,
  checkedInAt,
  checkedOutAt,
  completedAt,
}) => {
  const currentStep = getCurrentStepIndex(status);

  const steps = [
    {
      id: '1',
      label: 'Created',
      description: formatStepDate(createdAt),
      icon: <CheckCircleIcon />,
    },
    {
      id: '2',
      label: 'Confirmed',
      description: formatStepDate(confirmedAt),
      icon: <ShieldCheckIcon />,
    },
    {
      id: '3',
      label: 'Checked In',
      description: formatStepDate(checkedInAt),
      icon: <CheckInIcon />,
    },
    {
      id: '4',
      label: 'Checked Out',
      description: formatStepDate(checkedOutAt),
      icon: <CheckOutIcon />,
    },
    {
      id: '5',
      label: 'Completed',
      description: formatStepDate(completedAt),
      icon: <CheckCircleIcon />,
    },
  ];

  return (
    <ProgressSteps
      orientation="vertical"
      variant="icons"
      size="md"
      currentStep={currentStep}
      steps={steps}
    />
  );
};
