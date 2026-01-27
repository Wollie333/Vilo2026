/**
 * Template Editor Page
 *
 * Create or edit email templates with full form, variable management, preview, and testing.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '@/components/layout';
import { Button, Input, Card, Badge } from '@/components/ui';
import { HiOutlineArrowLeft, HiOutlineEye, HiOutlineMail, HiOutlineRefresh, HiOutlineClock } from 'react-icons/hi';
import * as emailTemplateService from '@/services/email-template.service';
import {
  VariableDocumentation,
  PreviewModal,
  TestEmailModal,
  ChangelogModal,
} from './components';
import type {
  EmailTemplate,
  EmailTemplateCategory,
  EmailTemplateVariable,
  EmailTemplateChangelog,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types/email-template.types';

export const TemplateEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id && id !== 'new';

  const [categories, setCategories] = useState<EmailTemplateCategory[]>([]);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [previewData, setPreviewData] = useState({ subject: '', htmlBody: '' });
  const [changelog, setChangelog] = useState<EmailTemplateChangelog[]>([]);
  const [isLoadingChangelog, setIsLoadingChangelog] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateTemplateInput>>({
    category_id: '',
    template_key: '',
    display_name: '',
    description: '',
    template_type: 'application',
    supabase_template_name: '',
    subject_template: '',
    html_template: '',
    text_template: '',
    variables: [],
    feature_tag: '',
    stage_tag: '',
    is_active: true,
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load categories
      const categoriesData = await emailTemplateService.getCategories();
      setCategories(categoriesData);

      // Load template if editing
      if (isEditMode) {
        const templateData = await emailTemplateService.getTemplate(id!);
        setTemplate(templateData);
        setFormData({
          category_id: templateData.category_id,
          template_key: templateData.template_key,
          display_name: templateData.display_name,
          description: templateData.description || '',
          template_type: templateData.template_type,
          supabase_template_name: templateData.supabase_template_name || '',
          subject_template: templateData.subject_template,
          html_template: templateData.html_template,
          text_template: templateData.text_template || '',
          variables: templateData.variables,
          feature_tag: templateData.feature_tag || '',
          stage_tag: templateData.stage_tag || '',
          is_active: templateData.is_active,
        });
      }
    } catch (error) {
      console.error('[TemplateEditorPage] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleVariableAdd = () => {
    const newVariable: EmailTemplateVariable = {
      name: '',
      type: 'string',
      description: '',
      required: false,
      example: '',
    };
    setFormData((prev) => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable],
    }));
    setHasChanges(true);
  };

  const handleVariableChange = (index: number, field: keyof EmailTemplateVariable, value: any) => {
    const newVariables = [...(formData.variables || [])];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setFormData((prev) => ({ ...prev, variables: newVariables }));
    setHasChanges(true);
  };

  const handleVariableRemove = (index: number) => {
    const newVariables = (formData.variables || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, variables: newVariables }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      if (isEditMode) {
        // Update existing template
        const updateData: UpdateTemplateInput = {
          category_id: formData.category_id,
          display_name: formData.display_name,
          description: formData.description,
          subject_template: formData.subject_template,
          html_template: formData.html_template,
          text_template: formData.text_template,
          variables: formData.variables,
          feature_tag: formData.feature_tag,
          stage_tag: formData.stage_tag,
          is_active: formData.is_active,
        };
        await emailTemplateService.updateTemplate(id!, updateData);
        alert('Template updated successfully!');
      } else {
        // Create new template
        await emailTemplateService.createTemplate(formData as CreateTemplateInput);
        alert('Template created successfully!');
      }

      setHasChanges(false);
      navigate('/admin/email#templates');
    } catch (error) {
      console.error('[TemplateEditorPage] Error saving:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !confirm('You have unsaved changes. Discard them?')) {
      return;
    }
    navigate('/admin/email#templates');
  };

  const handlePreview = async () => {
    try {
      // Build test variables from variable definitions
      const testVars: Record<string, any> = {};
      (formData.variables || []).forEach((v) => {
        testVars[v.name] = v.example || `[${v.name}]`;
      });

      const preview = await emailTemplateService.previewTemplate({
        subject_template: formData.subject_template || '',
        html_template: formData.html_template || '',
        variables: testVars,
      });

      setPreviewData({
        subject: preview.subject,
        htmlBody: preview.html,
      });
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('[TemplateEditorPage] Error previewing:', error);
      alert('Failed to generate preview');
    }
  };

  const handleTestEmailOpen = () => {
    if (!isEditMode) {
      alert('Please save the template first before sending a test email');
      return;
    }
    setIsTestEmailOpen(true);
  };

  const handleTestEmailSend = async (recipientEmail: string) => {
    // Build test variables
    const testVars: Record<string, any> = {};
    (formData.variables || []).forEach((v) => {
      testVars[v.name] = v.example || `[${v.name}]`;
    });

    await emailTemplateService.sendTestEmail(id!, recipientEmail, testVars);
  };

  const handleViewChangelog = async () => {
    if (!isEditMode) return;

    try {
      setIsLoadingChangelog(true);
      setIsChangelogOpen(true);
      const changelogData = await emailTemplateService.getTemplateChangelog(id!);
      setChangelog(changelogData);
    } catch (error) {
      console.error('[TemplateEditorPage] Error loading changelog:', error);
      alert('Failed to load changelog');
    } finally {
      setIsLoadingChangelog(false);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!isEditMode || formData.template_type !== 'supabase_auth') {
      return;
    }

    if (!confirm('Sync this template to Supabase Auth?')) {
      return;
    }

    try {
      const result = await emailTemplateService.syncToSupabase(id!);
      if (result.success) {
        alert('Successfully synced to Supabase!');
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[TemplateEditorPage] Error syncing:', error);
      alert('Failed to sync to Supabase');
    }
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout title="Loading...">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={isEditMode ? 'Edit Email Template' : 'Create Email Template'}
      subtitle={isEditMode ? template?.display_name : 'Create a new email template'}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleCancel}>
            <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
            Back to List
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <HiOutlineEye className="w-5 h-5 mr-2" />
              Preview
            </Button>

            {isEditMode && (
              <>
                <Button variant="outline" onClick={handleTestEmailOpen}>
                  <HiOutlineMail className="w-5 h-5 mr-2" />
                  Send Test
                </Button>

                <Button variant="outline" onClick={handleViewChangelog}>
                  <HiOutlineClock className="w-5 h-5 mr-2" />
                  History
                </Button>
              </>
            )}

            {isEditMode && formData.template_type === 'supabase_auth' && (
              <Button variant="outline" onClick={handleSyncToSupabase}>
                <HiOutlineRefresh className="w-5 h-5 mr-2" />
                Sync to Supabase
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Basic Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Display Name"
                value={formData.display_name || ''}
                onChange={(e) => handleFieldChange('display_name', e.target.value)}
                placeholder="e.g., Booking Confirmation"
                required
                fullWidth
              />

              <Input
                label="Template Key"
                value={formData.template_key || ''}
                onChange={(e) => handleFieldChange('template_key', e.target.value)}
                placeholder="e.g., booking_confirmation"
                required
                disabled={isEditMode}
                fullWidth
              />
            </div>

            <Input
              label="Description"
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Brief description of what this email is for"
              fullWidth
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => handleFieldChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Type
                </label>
                <select
                  value={formData.template_type || 'application'}
                  onChange={(e) => handleFieldChange('template_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={isEditMode}
                >
                  <option value="application">Application</option>
                  <option value="supabase_auth">Supabase Auth</option>
                </select>
              </div>
            </div>

            {formData.template_type === 'supabase_auth' && (
              <Input
                label="Supabase Template Name"
                value={formData.supabase_template_name || ''}
                onChange={(e) => handleFieldChange('supabase_template_name', e.target.value)}
                placeholder="e.g., confirm_signup, recovery"
                fullWidth
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Feature Tag"
                value={formData.feature_tag || ''}
                onChange={(e) => handleFieldChange('feature_tag', e.target.value)}
                placeholder="e.g., reviews, bookings"
                fullWidth
              />

              <Input
                label="Stage Tag"
                value={formData.stage_tag || ''}
                onChange={(e) => handleFieldChange('stage_tag', e.target.value)}
                placeholder="e.g., initial, reminder"
                fullWidth
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active || false}
                onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                Template is active (emails will be sent)
              </label>
            </div>
          </div>
        </Card>

        {/* Email Content */}
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Content
            </h3>

            <Input
              label="Subject Template"
              value={formData.subject_template || ''}
              onChange={(e) => handleFieldChange('subject_template', e.target.value)}
              placeholder="Use {{variable_name}} for dynamic content"
              required
              fullWidth
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                HTML Template
              </label>
              <textarea
                value={formData.html_template || ''}
                onChange={(e) => handleFieldChange('html_template', e.target.value)}
                placeholder="HTML email content with {{variables}}"
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text Template (Optional)
              </label>
              <textarea
                value={formData.text_template || ''}
                onChange={(e) => handleFieldChange('text_template', e.target.value)}
                placeholder="Plain text version"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Variables */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Variables
              </h3>
              <Button variant="outline" size="sm" onClick={handleVariableAdd}>
                Add Variable
              </Button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Define the variables available in this template. Use <code>{'{{variable_name}}'}</code> syntax in your content.
            </p>

            {(formData.variables || []).length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-500 text-center py-8">
                No variables defined. Click "Add Variable" to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {(formData.variables || []).map((variable, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <Input
                        label="Variable Name"
                        value={variable.name}
                        onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                        placeholder="e.g., guest_name"
                        fullWidth
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Type
                        </label>
                        <select
                          value={variable.type}
                          onChange={(e) => handleVariableChange(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <Input
                        label="Description"
                        value={variable.description}
                        onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                        placeholder="What this variable represents"
                        fullWidth
                      />

                      <Input
                        label="Example"
                        value={variable.example}
                        onChange={(e) => handleVariableChange(index, 'example', e.target.value)}
                        placeholder="Example value for testing"
                        fullWidth
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={variable.required}
                          onChange={(e) => handleVariableChange(index, 'required', e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded"
                        />
                        <label htmlFor={`required-${index}`} className="text-sm text-gray-700 dark:text-gray-300">
                          Required
                        </label>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVariableRemove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Variable Documentation */}
        {(formData.variables || []).length > 0 && (
          <VariableDocumentation variables={formData.variables || []} />
        )}

        {/* Save Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        subject={previewData.subject}
        htmlBody={previewData.htmlBody}
      />

      <TestEmailModal
        isOpen={isTestEmailOpen}
        onClose={() => setIsTestEmailOpen(false)}
        onSend={handleTestEmailSend}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
        changelog={changelog}
        templateName={formData.display_name || 'Template'}
        isLoading={isLoadingChangelog}
      />
    </AuthenticatedLayout>
  );
};
