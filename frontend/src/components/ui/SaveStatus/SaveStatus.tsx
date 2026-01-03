import React from 'react';
import { Spinner } from '../Spinner';

export type SaveStatusType = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveStatusProps {
  status: SaveStatusType;
  savedText?: string;
  savingText?: string;
  errorText?: string;
  showSpinner?: boolean;
  className?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
  status,
  savedText = 'Saved',
  savingText = 'Saving...',
  errorText = 'Save failed',
  showSpinner = true,
  className = '',
}) => {
  if (status === 'idle') return null;

  const statusStyles = {
    saving: 'text-gray-500 dark:text-gray-400',
    saved: 'text-success dark:text-success',
    error: 'text-error dark:text-error',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusStyles[status]} ${className}`}
    >
      {status === 'saving' && showSpinner && <Spinner size="xs" />}
      {status === 'saving' && savingText}
      {status === 'saved' && (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {savedText}
        </>
      )}
      {status === 'error' && (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {errorText}
        </>
      )}
    </span>
  );
};
