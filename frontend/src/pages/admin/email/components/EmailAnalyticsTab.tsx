/**
 * Email Analytics Tab
 *
 * View email sending statistics and audit trails.
 */

import React, { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import * as emailTemplateService from '@/services/email-template.service';
import type { EmailTemplate } from '@/types/email-template.types';

export const EmailAnalyticsTab: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const { templates: templatesData } = await emailTemplateService.getTemplates({
        is_active: true,
      });
      setTemplates(templatesData);
    } catch (error) {
      console.error('[EmailAnalyticsTab] Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSends = templates.reduce((sum, t) => sum + t.send_count, 0);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Analytics
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Overview of email sending activity
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {templates.length}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sends</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {totalSends.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Templates</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {templates.filter(t => t.is_active).length}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {new Set(templates.map(t => t.category_id)).size}
            </p>
          </div>
        </Card>
      </div>

      {/* Top Templates by Usage */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Most Used Templates
          </h3>
          <div className="space-y-3">
            {[...templates]
              .sort((a, b) => b.send_count - a.send_count)
              .slice(0, 10)
              .map((template) => (
                <div key={template.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {template.display_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.template_key}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {template.category && (
                      <Badge variant="default" size="sm">
                        {template.category.display_name}
                      </Badge>
                    )}
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.send_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {templates.length === 0 && (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No template data available
            </p>
          )}
        </div>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Email Sends
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
            Detailed send history coming soon
          </p>
        </div>
      </Card>
    </div>
  );
};
