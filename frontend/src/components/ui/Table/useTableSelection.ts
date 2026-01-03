import { useState, useCallback, useMemo } from 'react';
import type { TableSelectionState, UseTableSelectionOptions } from './Table.types';

/**
 * Hook for managing table row selection state
 *
 * @param items - Array of items with id property
 * @param options - Configuration options
 * @returns Selection state and methods
 *
 * @example
 * ```tsx
 * const selection = useTableSelection(users);
 *
 * // In header
 * <TableCheckboxCell
 *   checked={selection.isAllSelected}
 *   indeterminate={selection.isIndeterminate}
 *   onChange={() => selection.isAllSelected ? selection.deselectAll() : selection.selectAll()}
 * />
 *
 * // In rows
 * <TableCheckboxCell
 *   checked={selection.isSelected(user.id)}
 *   onChange={() => selection.toggleSelection(user.id)}
 * />
 * ```
 */
export function useTableSelection<T extends { id: string }>(
  items: T[],
  options: UseTableSelectionOptions = {}
): TableSelectionState<T> {
  const { initialSelectedIds = [], onSelectionChange } = options;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  );

  // Notify parent of selection changes
  const updateSelection = useCallback(
    (newSelection: Set<string>) => {
      setSelectedIds(newSelection);
      onSelectionChange?.(newSelection);
    },
    [onSelectionChange]
  );

  // Check if all items are selected
  const isAllSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  // Check if some but not all items are selected
  const isIndeterminate = useMemo(
    () => !isAllSelected && items.some((item) => selectedIds.has(item.id)),
    [items, selectedIds, isAllSelected]
  );

  // Select all items
  const selectAll = useCallback(() => {
    const newSelection = new Set(items.map((item) => item.id));
    updateSelection(newSelection);
  }, [items, updateSelection]);

  // Deselect all items
  const deselectAll = useCallback(() => {
    updateSelection(new Set());
  }, [updateSelection]);

  // Toggle selection of a single item
  const toggleSelection = useCallback(
    (id: string) => {
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      updateSelection(newSelection);
    },
    [selectedIds, updateSelection]
  );

  // Check if an item is selected
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  // Get array of selected items
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  // Get count of selected items
  const selectedCount = selectedIds.size;

  return {
    selectedIds,
    isAllSelected,
    isIndeterminate,
    selectAll,
    deselectAll,
    toggleSelection,
    isSelected,
    selectedItems,
    selectedCount,
  };
}
