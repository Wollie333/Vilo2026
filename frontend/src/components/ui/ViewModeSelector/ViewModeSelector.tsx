/**
 * ViewModeSelector Component
 *
 * Allows users to switch between different view modes (table, grid, list)
 * and set a default view via right-click context menu.
 */

import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineViewGrid, HiOutlineViewList, HiOutlineTable, HiOutlineCheck } from 'react-icons/hi';

export type ViewMode = 'table' | 'grid' | 'list';

interface ViewModeOption {
  mode: ViewMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface ViewModeSelectorProps {
  /** Current view mode */
  value: ViewMode;
  /** Callback when view mode changes */
  onChange: (mode: ViewMode) => void;
  /** LocalStorage key for persisting default view */
  storageKey?: string;
}

const VIEW_OPTIONS: ViewModeOption[] = [
  { mode: 'table', icon: HiOutlineTable, label: 'Table view' },
  { mode: 'grid', icon: HiOutlineViewGrid, label: 'Grid view' },
  { mode: 'list', icon: HiOutlineViewList, label: 'List view' },
];

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  value,
  onChange,
  storageKey = 'room-list-default-view',
}) => {
  const [defaultView, setDefaultView] = useState<ViewMode | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mode: ViewMode;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Load default view from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved && (saved === 'table' || saved === 'grid' || saved === 'list')) {
      setDefaultView(saved as ViewMode);
    }
  }, [storageKey]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleScroll = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [contextMenu]);

  const handleViewModeClick = (mode: ViewMode) => {
    onChange(mode);
  };

  const handleContextMenu = (event: React.MouseEvent, mode: ViewMode) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      mode,
    });
  };

  const handleSetDefault = () => {
    if (contextMenu) {
      setDefaultView(contextMenu.mode);
      localStorage.setItem(storageKey, contextMenu.mode);
      setContextMenu(null);
    }
  };

  const handleClearDefault = () => {
    setDefaultView(null);
    localStorage.removeItem(storageKey);
    setContextMenu(null);
  };

  return (
    <>
      <div className="hidden sm:flex items-center border border-gray-200 dark:border-dark-border rounded-md overflow-hidden">
        {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => {
          const isActive = value === mode;
          const isDefault = defaultView === mode;

          return (
            <button
              key={mode}
              onClick={() => handleViewModeClick(mode)}
              onContextMenu={(e) => handleContextMenu(e, mode)}
              className={`relative p-2 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-dark-card text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title={`${label}${isDefault ? ' (default)' : ''}`}
            >
              <Icon className="w-5 h-5" />
              {isDefault && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-dark-bg" />
              )}
            </button>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg shadow-lg py-1 min-w-[180px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            onClick={handleSetDefault}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-sidebar flex items-center gap-2"
          >
            {defaultView === contextMenu.mode && (
              <HiOutlineCheck className="w-4 h-4 text-primary" />
            )}
            <span>Set as default view</span>
          </button>
          {defaultView && (
            <button
              onClick={handleClearDefault}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-sidebar"
            >
              Clear default view
            </button>
          )}
          <div className="border-t border-gray-200 dark:border-dark-border my-1" />
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            Right-click to set default
          </div>
        </div>
      )}
    </>
  );
};
