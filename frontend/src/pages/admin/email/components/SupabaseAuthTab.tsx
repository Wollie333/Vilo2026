/**
 * Supabase Auth Tab
 *
 * Manage Supabase authentication email templates.
 * Allows syncing templates to Supabase via Management API.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@/components/ui';
import { HiOutlineRefresh, HiOutlinePencil, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';
import * as emailTemplateService from '@/services/email-template.service';
import type { EmailTemplate } from '@/types/email-template.types';

export const SupabaseAuthTab: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadSupabaseTemplates();
  }, []);

  const loadSupabaseTemplates = async () => {
    try {
      setIsLoading(true);
      const { templates: templatesData } = await emailTemplateService.getTemplates({
        template_type: 'supabase_auth',
      });
      setTemplates(templatesData);
    } catch (error) {
      console.error('[SupabaseAuthTab] Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (template: EmailTemplate) => {
    try {
      setSyncingId(template.id);
      const result = await emailTemplateService.syncToSupabase(template.id);

      if (result.success) {
        alert(`Successfully synced "${template.display_name}" to Supabase`);
      } else {
        alert(`Failed to sync: ${result.error}`);
      }
    } catch (error) {
      console.error('[SupabaseAuthTab] Error syncing:', error);
      alert('Failed to sync template to Supabase');
    } finally {
      setSyncingId(null);
    }
  };

  const handleEdit = (templateId: string) => {
    navigate(`/admin/email/templates/${templateId}`);
  };

  const handleSyncAll = async () => {
    if (!confirm('Sync all Supabase auth templates? This may take a moment.')) {
      return;
    }

    for (const template of templates) {
      if (template.is_active) {
        await handleSync(template);
      }
    }

    alert('All active templates synced!');
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading Supabase templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supabase Auth Templates
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage authentication email templates synced to Supabase
          </p>
        </div>
        <Button variant="primary" onClick={handleSyncAll}>
          <HiOutlineRefresh className="w-5 h-5 mr-2" />
          Sync All Active
        </Button>
      </div>

      {/* Info Card */}
      <Card>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Supabase auth templates use Go template syntax (e.g., <code>{'{{ .ConfirmationURL }}'}</code>).
            Changes here will update your Supabase project's auth email templates via the Management API.
          </p>
        </div>
      </Card>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                {/* Template Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.display_name}
                    </h3>
                    <Badge variant={template.is_active ? 'success' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    <span>
                      Supabase Template: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {template.supabase_template_name}
                      </code>
                    </span>
                    <span>•</span>
                    <span>{template.send_count} sends</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template.id)}
                  >
                    <HiOutlinePencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>

                  {template.is_active && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSync(template)}
                      disabled={syncingId === template.id}
                    >
                      {syncingId === template.id ? (
                        <>Syncing...</>
                      ) : (
                        <>
                          <HiOutlineRefresh className="w-4 h-4 mr-1" />
                          Sync to Supabase
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No Supabase auth templates found</p>
          </div>
        </Card>
      )}
    </div>
  );
};
