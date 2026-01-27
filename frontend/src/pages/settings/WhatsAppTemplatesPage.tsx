import { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button, Input, Switch, Spinner, Select, Alert } from '@/components/ui';
import { whatsappService, companyService } from '@/services';
import { useToast } from '@/context/NotificationContext';
import type {
  WhatsAppMessageTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateType,
  MetaStatus,
  PlaceholderInfo,
} from '@/types/whatsapp.types';
import type { CompanyWithPropertyCount } from '@/types/company.types';

// ============================================================================
// ICONS
// ============================================================================

const WhatsAppIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill="#25D366"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// ============================================================================
// WHATSAPP PREVIEW COMPONENT
// ============================================================================

interface WhatsAppPreviewProps {
  template: WhatsAppMessageTemplate | null;
  formData?: CreateTemplateInput | UpdateTemplateInput;
}

function WhatsAppPreview({ template, formData }: WhatsAppPreviewProps) {
  // Sample data for preview
  const sampleData: Record<string, string> = {
    guest_name: 'John Smith',
    booking_reference: 'VILO-2024-1234',
    property_name: 'Sunset Villa',
    property_address: '123 Ocean Drive, Cape Town, South Africa',
    property_phone: '+27 21 123 4567',
    property_email: 'info@sunsetvilla.com',
    check_in_date: 'March 15, 2024',
    check_out_date: 'March 20, 2024',
    check_in_time: '3:00 PM',
    check_out_time: '11:00 AM',
    num_guests: '4',
    room_names: 'Deluxe Suite, Ocean View Room',
    total_nights: '5',
    total_amount: 'R 15,000.00',
    amount_paid: 'R 7,500.00',
    balance_due: 'R 7,500.00',
    currency: 'ZAR',
    payment_method: 'Credit Card',
    booking_url: 'https://vilo.com/bookings/1234',
    payment_url: 'https://vilo.com/payments/1234',
    invoice_url: 'https://vilo.com/invoices/1234',
  };

  const renderTemplate = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return sampleData[key] || match;
    });
  };

  const displayTemplate = template || {
    header_text: formData?.header_text,
    body_template: formData?.body_template,
    footer_text: formData?.footer_text,
  };

  const hasContent = displayTemplate.header_text || displayTemplate.body_template || displayTemplate.footer_text;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <WhatsAppIcon />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Template Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Select a template from the list or start editing to see a live preview of how your message will appear to guests.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Phone Header */}
      <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3 rounded-t-lg">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
          🏨
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">Guest Preview</div>
          <div className="text-xs opacity-75">Online</div>
        </div>
      </div>

      {/* Chat Background */}
      <div className="flex-1 bg-[#E5DDD5] dark:bg-gray-900 p-4 overflow-y-auto">
        <div className="max-w-md ml-auto">
          {/* Message Bubble */}
          <div className="bg-[#DCF8C6] dark:bg-[#005C4B] rounded-lg p-3 shadow-sm">
            {/* Header */}
            {displayTemplate.header_text && (
              <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                {renderTemplate(displayTemplate.header_text)}
              </div>
            )}

            {/* Body */}
            {displayTemplate.body_template && (
              <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {renderTemplate(displayTemplate.body_template)}
              </div>
            )}

            {/* Footer */}
            {displayTemplate.footer_text && (
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 pt-2 border-t border-gray-300 dark:border-gray-600 italic">
                {renderTemplate(displayTemplate.footer_text)}
              </div>
            )}

            {/* Timestamp & Checkmarks */}
            <div className="flex items-center justify-end gap-1 mt-2">
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414L8 16.586l7.293-7.293a1 1 0 011.414 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE TYPE METADATA
// ============================================================================

const TEMPLATE_TYPE_INFO: Record<
  TemplateType,
  { label: string; description: string; icon: string }
> = {
  booking_confirmation: {
    label: 'Booking Confirmation',
    description: 'Sent immediately after booking is created',
    icon: '✅',
  },
  payment_received: {
    label: 'Payment Received',
    description: 'Sent when payment is recorded',
    icon: '💰',
  },
  payment_reminder: {
    label: 'Payment Reminder',
    description: 'Sent before check-in if balance is due',
    icon: '⏰',
  },
  pre_arrival: {
    label: 'Pre-Arrival',
    description: 'Sent 1-3 days before check-in',
    icon: '🏠',
  },
  booking_modified: {
    label: 'Booking Modified',
    description: 'Sent when booking details change',
    icon: '✏️',
  },
  booking_cancelled: {
    label: 'Booking Cancelled',
    description: 'Sent when booking is cancelled',
    icon: '❌',
  },
};

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'af', label: 'Afrikaans' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WhatsAppTemplatesPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<CompanyWithPropertyCount[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [templates, setTemplates] = useState<WhatsAppMessageTemplate[]>([]);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppMessageTemplate | null>(null);
  const [editing, setEditing] = useState<WhatsAppMessageTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateTemplateInput | UpdateTemplateInput>({
    template_type: 'booking_confirmation',
    template_name: '',
    language_code: 'en',
    body_template: '',
    header_text: '',
    footer_text: '',
    send_timing_days_before: undefined,
    is_enabled: true,
  });

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Load templates when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      loadTemplates();
    }
  }, [selectedCompanyId]);

  // Load placeholders when editing or creating
  useEffect(() => {
    if (editing) {
      loadPlaceholders(editing.template_type);
    } else if (isCreating && formData.template_type) {
      loadPlaceholders(formData.template_type as TemplateType);
    }
  }, [editing, isCreating, formData.template_type]);

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await companyService.getMyCompanies({ is_active: true });
      setCompanies(response.companies);

      // Auto-select first company
      if (response.companies.length > 0) {
        setSelectedCompanyId(response.companies[0].id);
      }
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to load companies' });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadTemplates = async (selectTemplateId?: string) => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      const response = await whatsappService.listTemplates({
        property_id: selectedCompanyId,
      });
      setTemplates(response.templates);

      // If a specific template ID was provided, select it
      if (selectTemplateId) {
        const templateToSelect = response.templates.find(t => t.id === selectTemplateId);
        if (templateToSelect) {
          setSelectedTemplate(templateToSelect);
        }
      } else if (response.templates.length > 0 && !selectedTemplate) {
        // Auto-select first template if none selected
        setSelectedTemplate(response.templates[0]);
      }
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to load WhatsApp templates' });
    } finally {
      setLoading(false);
    }
  };

  const loadPlaceholders = async (templateType: TemplateType) => {
    try {
      const data = await whatsappService.getPlaceholders(templateType);
      setPlaceholders(data);
    } catch (error) {
      console.error('Failed to load placeholders:', error);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: MetaStatus) => {
    if (status === 'approved') return <Badge variant="success">Approved</Badge>;
    if (status === 'rejected') return <Badge variant="error">Rejected</Badge>;
    if (status === 'pending') return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="default">Draft</Badge>;
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedCompanyId) return;

    try {
      setSaving(true);

      let savedTemplateId: string;

      if (editing) {
        // Update existing
        await whatsappService.updateTemplate(editing.id, formData as UpdateTemplateInput);
        savedTemplateId = editing.id;
        toast({ variant: 'success', title: 'Template updated successfully' });
      } else {
        // Create new
        const newTemplate = await whatsappService.createTemplate({
          ...formData,
          property_id: selectedCompanyId,
        } as CreateTemplateInput);
        savedTemplateId = newTemplate.id;
        toast({ variant: 'success', title: 'Template created successfully' });
      }

      // Reload templates and auto-select the saved one
      await loadTemplates(savedTemplateId);

      setEditing(null);
      setIsCreating(false);
      resetForm();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await whatsappService.deleteTemplate(id);
      toast({ variant: 'success', title: 'Template deleted successfully' });
      await loadTemplates();
      setEditing(null);
      setIsCreating(false);
      setSelectedTemplate(null);
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to delete template' });
    }
  };

  // Handle submit to Meta
  const handleSubmitToMeta = async (id: string) => {
    try {
      setSubmitting(id);
      await whatsappService.submitTemplateToMeta(id);
      toast({
        variant: 'success',
        title: 'Template submitted to Meta',
        description: 'Approval usually takes 1-2 business days',
      });
      await loadTemplates();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to submit template to Meta' });
    } finally {
      setSubmitting(null);
    }
  };

  // Handle toggle enabled
  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      await whatsappService.updateTemplate(id, { is_enabled: enabled });
      toast({ variant: 'success', title: enabled ? 'Template enabled' : 'Template disabled' });
      await loadTemplates();
    } catch (error) {
      toast({ variant: 'error', title: 'Failed to update template' });
    }
  };

  // Handle edit
  const handleEdit = (template: WhatsAppMessageTemplate) => {
    setEditing(template);
    setIsCreating(false);
    setSelectedTemplate(template);
    setFormData({
      template_name: template.template_name,
      language_code: template.language_code,
      body_template: template.body_template,
      header_text: template.header_text || '',
      footer_text: template.footer_text || '',
      send_timing_days_before: template.send_timing_days_before || undefined,
      is_enabled: template.is_enabled,
    });
  };

  // Handle create new
  const handleCreateNew = () => {
    setEditing(null);
    setIsCreating(true);
    setSelectedTemplate(null);
    setFormData({
      template_type: 'booking_confirmation',
      template_name: 'booking_confirmation_en',
      language_code: 'en',
      body_template: '',
      header_text: '',
      footer_text: '',
      send_timing_days_before: undefined,
      is_enabled: true,
    });
  };

  // Insert placeholder
  const insertPlaceholder = (key: string) => {
    setFormData({
      ...formData,
      body_template: (formData.body_template || '') + `{{${key}}}`,
    });
  };

  // Reset form
  const resetForm = () => {
    setIsCreating(false);
    setFormData({
      template_type: 'booking_confirmation',
      template_name: '',
      language_code: 'en',
      body_template: '',
      header_text: '',
      footer_text: '',
      send_timing_days_before: undefined,
      is_enabled: true,
    });
  };

  // Get preview template
  const previewTemplate = useMemo(() => {
    if (editing) return null; // Show form data in preview when editing
    return selectedTemplate;
  }, [editing, selectedTemplate]);

  // Loading state
  if (loadingCompanies) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // No companies found
  if (companies.length === 0) {
    return (
      <Alert variant="warning">
        <p className="font-medium">No companies found</p>
        <p className="text-sm mt-1">
          You need to create a company before configuring WhatsApp templates.
        </p>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Selector */}
      {companies.length > 1 && (
        <Card>
          <Card.Body>
            <Select
              label="Select Company"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              options={[
                { value: '', label: 'Select a company' },
                ...companies.map((company) => ({
                  value: company.id,
                  label: company.display_name || company.name,
                })),
              ]}
            />
          </Card.Body>
        </Card>
      )}

      {/* Loading templates */}
      {loading && selectedCompanyId && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Split Pane Layout */}
      {!loading && selectedCompanyId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Template List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Templates ({templates.length})
              </h3>
              <Button variant="primary" size="sm" onClick={handleCreateNew}>
                Create New
              </Button>
            </div>

            {/* Template List */}
            <div className="space-y-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? 'highlight' : 'default'}
                  interactive
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setEditing(null);
                    setIsCreating(false);
                  }}
                >
                  <Card.Body>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{TEMPLATE_TYPE_INFO[template.template_type].icon}</span>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {TEMPLATE_TYPE_INFO[template.template_type].label}
                          </h4>
                          <Badge size="sm">{template.language_code.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {TEMPLATE_TYPE_INFO[template.template_type].description}
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(template.meta_status)}
                          <Switch
                            checked={template.is_enabled}
                            onCheckedChange={(checked) => handleToggleEnabled(template.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}

              {templates.length === 0 && (
                <Card>
                  <Card.Body className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No templates created yet. Click "Create New" to get started.
                    </p>
                  </Card.Body>
                </Card>
              )}
            </div>
          </div>

          {/* Right Panel - Preview or Editor */}
          <div className="lg:sticky lg:top-6 h-fit">
            {editing || isCreating ? (
              // Editor Card
              <Card>
                <Card.Header>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {editing ? 'Edit Template' : 'Create Template'}
                  </h4>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-4">
                    {/* Language & Type */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        label="Type"
                        value={formData.template_type || 'booking_confirmation'}
                        onChange={(e) =>
                          setFormData({ ...formData, template_type: e.target.value as TemplateType })
                        }
                        options={Object.keys(TEMPLATE_TYPE_INFO).map((type) => ({
                          value: type,
                          label: TEMPLATE_TYPE_INFO[type as TemplateType].label,
                        }))}
                        disabled={!!editing}
                      />
                      <Select
                        label="Language"
                        value={formData.language_code || 'en'}
                        onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                        options={LANGUAGE_OPTIONS}
                      />
                    </div>

                    <Input
                      label="Template Name"
                      placeholder="e.g., booking_confirmation_en"
                      value={formData.template_name || ''}
                      onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                      helperText="Unique identifier for this template"
                    />

                    <Input
                      label="Header Text (Optional)"
                      placeholder="e.g., Booking Confirmation"
                      value={formData.header_text || ''}
                      onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Message Body *
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px]"
                        placeholder="Enter your message. Use {{placeholder}} for dynamic values."
                        value={formData.body_template || ''}
                        onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                      />

                      {/* Placeholder Picker */}
                      {placeholders.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Click to insert placeholder:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {placeholders.map((placeholder) => (
                              <button
                                key={placeholder.key}
                                type="button"
                                onClick={() => insertPlaceholder(placeholder.key)}
                                className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-primary hover:text-white transition-colors"
                                title={placeholder.description}
                              >
                                {`{{${placeholder.key}}}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Input
                      label="Footer Text (Optional)"
                      placeholder="e.g., Powered by Vilo"
                      value={formData.footer_text || ''}
                      onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                    />

                    {/* Timing for scheduled messages */}
                    {(formData.template_type === 'payment_reminder' ||
                      formData.template_type === 'pre_arrival') && (
                      <Input
                        type="number"
                        label="Send Days Before Check-in"
                        placeholder="e.g., 3"
                        value={formData.send_timing_days_before || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            send_timing_days_before: parseInt(e.target.value) || undefined,
                          })
                        }
                        helperText="When to send this message before guest check-in"
                      />
                    )}

                    {/* Preview Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Live Preview
                      </label>
                      <div className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden h-[300px]">
                        <WhatsAppPreview template={null} formData={formData} />
                      </div>
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer className="flex justify-between items-center">
                  <div>
                    {editing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(editing.id)}
                      >
                        <TrashIcon />
                        <span className="ml-2">Delete</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editing && editing.meta_status === 'draft' && (
                      <Button
                        variant="outline"
                        onClick={() => handleSubmitToMeta(editing.id)}
                        disabled={submitting === editing.id}
                      >
                        {submitting === editing.id ? <Spinner size="sm" /> : 'Submit to Meta'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(null);
                        setIsCreating(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                      {saving ? <Spinner size="sm" /> : editing ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            ) : (
              // Preview Card
              <Card className="h-[600px]">
                <Card.Header>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    WhatsApp Preview
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    How this message will appear to guests
                  </p>
                </Card.Header>
                <Card.Body className="p-0 h-[calc(100%-80px)]">
                  <WhatsAppPreview template={previewTemplate} formData={undefined} />
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
