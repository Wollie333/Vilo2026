/**
 * Changelog Modal Component
 *
 * Displays the change history for an email template with timeline view.
 */

import React from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import { HiOutlineX, HiOutlineClock } from 'react-icons/hi';
import type { EmailTemplateChangelog } from '@/types/email-template.types';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  changelog: EmailTemplateChangelog[];
  templateName: string;
  isLoading?: boolean;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
  changelog,
  templateName,
  isLoading = false,
}) => {
  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return <Badge variant="success" size="sm">Created</Badge>;
      case 'updated':
        return <Badge variant="info" size="sm">Updated</Badge>;
      case 'enabled':
        return <Badge variant="success" size="sm">Enabled</Badge>;
      case 'disabled':
        return <Badge variant="warning" size="sm">Disabled</Badge>;
      case 'synced_to_supabase':
        return <Badge variant="default" size="sm">Synced to Supabase</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{changeType}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {/* Modal Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <HiOutlineClock className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Change History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {templateName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <HiOutlineX className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading changelog...</p>
          </div>
        ) : changelog.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No changes recorded yet</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Timeline Items */}
            <div className="space-y-6">
              {changelog.map((entry) => (
                <div key={entry.id} className="relative pl-10">
                  {/* Timeline Dot */}
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-gray-900" />

                  {/* Change Card */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getChangeTypeBadge(entry.change_type)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      {entry.changed_by_user && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          by {entry.changed_by_user.full_name || entry.changed_by_user.email}
                        </span>
                      )}
                    </div>

                    {/* Changes Summary */}
                    {entry.changes_summary && (
                      <p className="text-sm text-gray-900 dark:text-white mb-2">
                        {entry.changes_summary}
                      </p>
                    )}

                    {/* Field Changes */}
                    {entry.field_changes && Object.keys(entry.field_changes).length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                          Fields Changed:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.keys(entry.field_changes).map((field) => (
                            <Badge key={field} variant="secondary" size="sm">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Previous State (collapsed by default) */}
                    {entry.previous_state && (
                      <details className="mt-3">
                        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                          View previous state
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {JSON.stringify(entry.previous_state, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
