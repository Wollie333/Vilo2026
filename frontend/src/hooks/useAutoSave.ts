import { useState, useCallback, useRef, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions<T = Record<string, unknown>> {
  /** Function to save a single field */
  saveField?: (field: keyof T, value: T[keyof T]) => Promise<void>;
  /** Function to save multiple fields at once */
  saveFields?: (fields: Partial<T>) => Promise<void>;
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;
  /** How long to show "saved" status before returning to idle (default: 2000ms) */
  savedDisplayMs?: number;
  /** Callback when save succeeds */
  onSaveSuccess?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn<T = Record<string, unknown>> {
  /** Current save status */
  saveStatus: SaveStatus;
  /** Error message if status is 'error' */
  errorMessage: string | null;
  /** Handle field change with debounced save */
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  /** Handle field blur with immediate save */
  handleBlur: (field: keyof T, value: T[keyof T]) => void;
  /** Save a field immediately (no debounce) */
  saveNow: (field: keyof T, value: T[keyof T]) => Promise<void>;
  /** Save multiple fields immediately */
  saveFieldsNow: (fields: Partial<T>) => Promise<void>;
  /** Reset status to idle */
  resetStatus: () => void;
  /** Check if currently saving */
  isSaving: boolean;
}

export function useAutoSave<T = Record<string, unknown>>(
  options: UseAutoSaveOptions<T>
): UseAutoSaveReturn<T> {
  const {
    saveField,
    saveFields,
    debounceMs = 500,
    savedDisplayMs = 2000,
    onSaveSuccess,
    onSaveError,
  } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs for debounce timers
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<T>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  // Clear saved timer and set to idle after delay
  const showSavedStatus = useCallback(() => {
    setSaveStatus('saved');
    setErrorMessage(null);

    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }

    savedTimerRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, savedDisplayMs);
  }, [savedDisplayMs]);

  // Core save function
  const performSave = useCallback(
    async (field: keyof T, value: T[keyof T]) => {
      if (!saveField) {
        console.warn('useAutoSave: saveField function not provided');
        return;
      }

      setSaveStatus('saving');
      setErrorMessage(null);

      try {
        await saveField(field, value);
        showSavedStatus();
        onSaveSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Save failed');
        setSaveStatus('error');
        setErrorMessage(error.message);
        onSaveError?.(error);
      }
    },
    [saveField, showSavedStatus, onSaveSuccess, onSaveError]
  );

  // Save multiple fields
  const saveFieldsNow = useCallback(
    async (fields: Partial<T>) => {
      if (!saveFields) {
        console.warn('useAutoSave: saveFields function not provided');
        return;
      }

      setSaveStatus('saving');
      setErrorMessage(null);

      try {
        await saveFields(fields);
        showSavedStatus();
        onSaveSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Save failed');
        setSaveStatus('error');
        setErrorMessage(error.message);
        onSaveError?.(error);
      }
    },
    [saveFields, showSavedStatus, onSaveSuccess, onSaveError]
  );

  // Save immediately (no debounce)
  const saveNow = useCallback(
    async (field: keyof T, value: T[keyof T]) => {
      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      await performSave(field, value);
    },
    [performSave]
  );

  // Handle change with debounce
  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      // Store the pending change
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        [field]: value,
      };

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        performSave(field, value);
        delete (pendingChangesRef.current as Record<string, unknown>)[field as string];
      }, debounceMs);
    },
    [debounceMs, performSave]
  );

  // Handle blur - save immediately
  const handleBlur = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      // Clear any pending debounce for this field
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // Only save if there's a pending change or value differs
      if (field in pendingChangesRef.current) {
        performSave(field, value);
        delete (pendingChangesRef.current as Record<string, unknown>)[field as string];
      }
    },
    [performSave]
  );

  // Reset status to idle
  const resetStatus = useCallback(() => {
    setSaveStatus('idle');
    setErrorMessage(null);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
  }, []);

  return {
    saveStatus,
    errorMessage,
    handleChange,
    handleBlur,
    saveNow,
    saveFieldsNow,
    resetStatus,
    isSaving: saveStatus === 'saving',
  };
}

// Export a simpler version for immediate saves (no debounce needed)
export function useImmediateSave<T = Record<string, unknown>>(
  saveFunction: (field: keyof T, value: T[keyof T]) => Promise<void>,
  options?: Pick<UseAutoSaveOptions<T>, 'savedDisplayMs' | 'onSaveSuccess' | 'onSaveError'>
): Pick<UseAutoSaveReturn<T>, 'saveStatus' | 'errorMessage' | 'saveNow' | 'isSaving' | 'resetStatus'> {
  const result = useAutoSave<T>({
    saveField: saveFunction,
    debounceMs: 0,
    ...options,
  });

  return {
    saveStatus: result.saveStatus,
    errorMessage: result.errorMessage,
    saveNow: result.saveNow,
    isSaving: result.isSaving,
    resetStatus: result.resetStatus,
  };
}
