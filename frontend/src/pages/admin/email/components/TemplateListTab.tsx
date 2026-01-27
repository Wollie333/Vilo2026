/**
 * Template List Tab
 *
 * Displays list of email templates with filters, search, and quick actions.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Badge, Card } from '@/components/ui';
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineMail } from 'react-icons/hi';
import * as emailTemplateService from '@/services/email-template.service';
import type { EmailTemplate, EmailTemplateCategory, EmailTemplateType } from '@/types/email-template.types';

export const TemplateListTab: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<EmailTemplateCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<EmailTemplateType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | ''>('');

  // Load categories and templates
  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedType, selectedStatus, search]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load categories once
      if (categories.length === 0) {
        const categoriesData = await emailTemplateService.getCategories();
        setCategories(categoriesData);
      }

      // Load templates with filters
      const params: any = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedType) params.template_type = selectedType;
      if (selectedStatus === 'active') params.is_active = true;
      if (selectedStatus === 'inactive') params.is_active = false;
      if (search) params.search = search;

      const { templates: templatesData } = await emailTemplateService.getTemplates(params);
      setTemplates(templatesData);
    } catch (error) {
      console.error('[TemplateListTab] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (template: EmailTemplate) => {
    try {
      await emailTemplateService.toggleTemplate(template.id, !template.is_active);
      loadData(); // Reload list
    } catch (error) {
      console.error('[TemplateListTab] Error toggling template:', error);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (template.is_system_template) {
      alert('Cannot delete system templates');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${template.display_name}"?`)) {
      return;
    }

    try {
      await emailTemplateService.deleteTemplate(template.id);
      loadData(); // Reload list
    } catch (error) {
      console.error('[TemplateListTab] Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleEdit = (templateId: string) => {
    navigate(`/admin/email/templates/${templateId}`);
  };

  const handleCreate = () => {
    navigate('/admin/email/templates/new');
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Templates
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage platform-wide email templates
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates by name or key..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<HiOutlineSearch className="w-5 h-5" />}
                fullWidth
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.display_name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="application">Application</option>
              <option value="supabase_auth">Supabase Auth</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Reset Filters */}
            {(selectedCategory || selectedType || selectedStatus || search) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedType('');
                  setSelectedStatus('');
                  setSearch('');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <HiOutlineMail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No templates found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Try adjusting your filters or create a new template
            </p>
          </div>
        </Card>
      ) : (
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
                      {template.template_type === 'supabase_auth' && (
                        <Badge variant="info">Supabase Auth</Badge>
                      )}
                      {template.is_system_template && (
                        <Badge variant="warning">System</Badge>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Key: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                        {template.template_key}
                      </code>
                    </p>

                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      {template.category && (
                        <span>{template.category.display_name}</span>
                      )}
                      <span>•</span>
                      <span>{template.send_count} sends</span>
                      {template.last_sent_at && (
                        <>
                          <span>•</span>
                          <span>Last sent {new Date(template.last_sent_at).toLocaleDateString()}</span>
                        </>
                      )}
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

                    <Button
                      variant={template.is_active ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleActive(template)}
                    >
                      {template.is_active ? 'Disable' : 'Enable'}
                    </Button>

                    {!template.is_system_template && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template)}
                        className="text-red-600 hover:text-red-700 hover:border-red-600"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && templates.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
