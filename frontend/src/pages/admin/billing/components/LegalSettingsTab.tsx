/**
 * Legal Settings Tab
 *
 * Main component for managing platform-level legal documents
 * (Terms of Service, Privacy Policy, Cookie Policy, Acceptable Use Policy)
 */

import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';
import { FileText, Shield, Cookie, AlertCircle, Save, X, Edit2 } from 'lucide-react';
import type {
  PlatformLegalDocument,
  PlatformLegalDocumentType,
  PlatformLegalDocumentTypeConfig,
} from '@/types/platform-legal.types';
import * as platformLegalService from '@/services/platform-legal.service';
import { useToast } from '@/context/NotificationContext';
import ReactQuill from 'react-quill'; // Direct import instead of lazy
import 'react-quill/dist/quill.snow.css'; // React Quill styles
import '@/pages/legal/components/TermsTab.css'; // Shared legal document styles

// Document type configurations
const DOCUMENT_TYPES: PlatformLegalDocumentTypeConfig[] = [
  {
    value: 'terms_of_service',
    label: 'Terms of Service',
    description: 'Platform terms and conditions for all users',
  },
  {
    value: 'privacy_policy',
    label: 'Privacy Policy',
    description: 'Data protection and privacy practices',
  },
  {
    value: 'cookie_policy',
    label: 'Cookie Policy',
    description: 'Cookie usage and tracking information',
  },
  {
    value: 'acceptable_use',
    label: 'Acceptable Use Policy',
    description: 'Rules for using the Vilo platform',
  },
];

// Document type button component (inline for simplicity)
interface DocumentTypeButtonProps {
  type: PlatformLegalDocumentTypeConfig;
  isSelected: boolean;
  onClick: () => void;
}

const DocumentTypeButton: React.FC<DocumentTypeButtonProps> = ({ type, isSelected, onClick }) => {
  const getIcon = (value: PlatformLegalDocumentType) => {
    switch (value) {
      case 'terms_of_service':
        return <FileText className="w-5 h-5" />;
      case 'privacy_policy':
        return <Shield className="w-5 h-5" />;
      case 'cookie_policy':
        return <Cookie className="w-5 h-5" />;
      case 'acceptable_use':
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 p-4 rounded-lg border-2 transition-all
        ${
          isSelected
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
    >
      <div className={isSelected ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}>
        {getIcon(type.value)}
      </div>
      <div className="flex-1 text-left">
        <div className={`font-medium ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
          {type.label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {type.description}
        </div>
      </div>
    </button>
  );
};

export const LegalSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<PlatformLegalDocumentType>('terms_of_service');
  const [activeDocument, setActiveDocument] = useState<PlatformLegalDocument | null>(null);
  const [allVersions, setAllVersions] = useState<PlatformLegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedVersion, setEditedVersion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load documents for selected type
  const loadDocuments = async () => {
    console.log('[LegalSettingsTab] Loading documents for type:', selectedType);
    setIsLoading(true);
    setError(null);

    try {
      // Load active document using PUBLIC endpoint (faster, no auth required for reading)
      const active = await platformLegalService.getActiveDocumentByType(selectedType);
      setActiveDocument(active);
      console.log('[LegalSettingsTab] Active document:', active?.version || 'none');

      // For now, just show active version in history
      // TODO: Implement admin endpoint for version history once auth middleware is fixed
      const versions = active ? [active] : [];
      setAllVersions(versions);
      console.log('[LegalSettingsTab] Total versions:', versions.length);
    } catch (err) {
      console.error('[LegalSettingsTab] Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      toast({ variant: 'error', title: 'Failed to load documents' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents when selected type changes
  useEffect(() => {
    loadDocuments();
    setIsEditing(false); // Exit edit mode when switching documents
    setHasUnsavedChanges(false);
  }, [selectedType]);

  // Initialize edit form when activeDocument changes
  useEffect(() => {
    if (activeDocument && !isEditing) {
      setEditedTitle(activeDocument.title);
      setEditedContent(activeDocument.content);
      setEditedVersion(activeDocument.version);
    }
  }, [activeDocument, isEditing]);

  const handleStartEdit = () => {
    console.log('[LegalSettingsTab] handleStartEdit called');
    console.log('[LegalSettingsTab] activeDocument:', activeDocument);

    if (activeDocument) {
      console.log('[LegalSettingsTab] Setting edit mode with document:', {
        title: activeDocument.title,
        version: activeDocument.version,
        contentLength: activeDocument.content?.length || 0
      });

      setEditedTitle(activeDocument.title);
      setEditedContent(activeDocument.content);
      setEditedVersion(activeDocument.version);
      setIsEditing(true);
      setHasUnsavedChanges(false);

      console.log('[LegalSettingsTab] isEditing should now be true');
    } else {
      console.error('[LegalSettingsTab] No active document to edit!');
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleSave = async () => {
    console.log('====================================');
    console.log('[LegalSettingsTab] 🚀 START SAVE PROCESS');
    console.log('[LegalSettingsTab] Mode:', activeDocument ? 'UPDATE' : 'CREATE');
    console.log('[LegalSettingsTab] Selected Type:', selectedType);
    console.log('[LegalSettingsTab] Active Document ID:', activeDocument?.id || 'none');
    console.log('====================================');

    setIsSaving(true);
    console.log('[LegalSettingsTab] ✓ Set isSaving to true');

    try {
      // Validate inputs
      console.log('[LegalSettingsTab] 📋 Validating inputs...');
      console.log('[LegalSettingsTab] - Title:', editedTitle);
      console.log('[LegalSettingsTab] - Version:', editedVersion);
      console.log('[LegalSettingsTab] - Content length:', editedContent?.length || 0);

      if (!editedTitle.trim()) {
        console.error('[LegalSettingsTab] ❌ Validation failed: Title is empty');
        toast({ variant: 'error', title: 'Title is required' });
        setIsSaving(false);
        return;
      }
      console.log('[LegalSettingsTab] ✓ Title validation passed');

      if (!editedContent.trim()) {
        console.error('[LegalSettingsTab] ❌ Validation failed: Content is empty');
        toast({ variant: 'error', title: 'Content is required' });
        setIsSaving(false);
        return;
      }
      console.log('[LegalSettingsTab] ✓ Content validation passed');

      if (!editedVersion.match(/^\d+\.\d+(\.\d+)?$/)) {
        console.error('[LegalSettingsTab] ❌ Validation failed: Invalid version format');
        toast({ variant: 'error', title: 'Version must be in format X.Y or X.Y.Z' });
        setIsSaving(false);
        return;
      }
      console.log('[LegalSettingsTab] ✓ Version validation passed');

      if (activeDocument) {
        // Update existing document
        console.log('[LegalSettingsTab] 📝 UPDATING existing document...');
        console.log('[LegalSettingsTab] Document ID:', activeDocument.id);
        console.log('[LegalSettingsTab] Payload:', {
          title: editedTitle,
          version: editedVersion,
          contentLength: editedContent.length
        });

        console.log('[LegalSettingsTab] 🔄 Calling updatePlatformLegalDocument...');
        const result = await platformLegalService.updatePlatformLegalDocument(activeDocument.id, {
          title: editedTitle,
          content: editedContent,
          version: editedVersion,
        });
        console.log('[LegalSettingsTab] ✅ Update completed successfully:', result);
      } else {
        // Create new document
        console.log('[LegalSettingsTab] ➕ CREATING new document...');
        const payload = {
          document_type: selectedType,
          title: editedTitle,
          content: editedContent,
          version: editedVersion,
          is_active: true,
        };
        console.log('[LegalSettingsTab] Payload:', payload);

        console.log('[LegalSettingsTab] 🔄 Calling createPlatformLegalDocument...');
        const result = await platformLegalService.createPlatformLegalDocument(payload);
        console.log('[LegalSettingsTab] ✅ Create completed successfully:', result);
      }

      console.log('[LegalSettingsTab] 🎉 Save operation successful!');
      console.log('[LegalSettingsTab] 📢 Showing success toast...');
      toast({
        variant: 'success',
        title: activeDocument ? '✅ Document Updated' : '✅ Document Created',
        description: `${editedTitle} version ${editedVersion} saved successfully`
      });

      console.log('[LegalSettingsTab] 🔄 Exiting edit mode...');
      setIsEditing(false);
      setHasUnsavedChanges(false);

      console.log('[LegalSettingsTab] 🔄 Reloading documents...');
      await loadDocuments();
      console.log('[LegalSettingsTab] ✅ Documents reloaded successfully');
    } catch (err) {
      console.error('====================================');
      console.error('[LegalSettingsTab] ❌ ERROR OCCURRED DURING SAVE');
      console.error('[LegalSettingsTab] Error object:', err);
      console.error('[LegalSettingsTab] Error type:', typeof err);
      console.error('[LegalSettingsTab] Error message:', err instanceof Error ? err.message : 'Unknown');
      console.error('[LegalSettingsTab] Error stack:', err instanceof Error ? err.stack : 'N/A');
      console.error('====================================');

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast({
        variant: 'error',
        title: '❌ Failed to save document',
        description: errorMessage
      });
    } finally {
      console.log('[LegalSettingsTab] 🏁 FINALLY BLOCK - Setting isSaving to false');
      setIsSaving(false);
      console.log('[LegalSettingsTab] ✓ isSaving set to false');
      console.log('====================================');
      console.log('[LegalSettingsTab] 🏁 END SAVE PROCESS');
      console.log('====================================');
    }
  };

  const handleActivateVersion = async (id: string) => {
    console.log('[LegalSettingsTab] Activating version:', id);

    try {
      await platformLegalService.activatePlatformLegalDocument(id);
      toast({ variant: 'success', title: 'Document version activated successfully' });
      await loadDocuments(); // Reload to reflect changes
    } catch (err) {
      console.error('[LegalSettingsTab] Error activating version:', err);
      toast({ variant: 'error', title: 'Failed to activate document version' });
    }
  };

  const handleCreateNewVersion = () => {
    console.log('[LegalSettingsTab] Creating new document for type:', selectedType);

    // Initialize with empty document
    setEditedTitle(DOCUMENT_TYPES.find(t => t.value === selectedType)?.label || '');
    setEditedContent('<h1>Document Title</h1><p>Start writing your document here...</p>');
    setEditedVersion('1.0');
    setIsEditing(true);
    setHasUnsavedChanges(false);
  };

  const handleFieldChange = () => {
    setHasUnsavedChanges(true);
  };

  if (isLoading && !activeDocument) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Document Type Selector */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Document Type
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DOCUMENT_TYPES.map((type) => (
            <DocumentTypeButton
              key={type.value}
              type={type}
              isSelected={selectedType === type.value}
              onClick={() => setSelectedType(type.value)}
            />
          ))}
        </div>
      </Card>

      {/* Active Document Editor */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeDocument ? activeDocument.title : 'No Active Document'}
          </h3>
          {activeDocument && !isEditing && (
            <Button
              variant="outline"
              onClick={handleStartEdit}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Document
            </Button>
          )}
        </div>

        {activeDocument || isEditing ? (
          <div className="space-y-4">
            {/* Document Info */}
            {!isEditing && activeDocument && (
              <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Version: <span className="font-medium text-gray-900 dark:text-white">{activeDocument.version}</span>
                </span>
                <span>•</span>
                <span>
                  Last updated: {new Date(activeDocument.updated_at).toLocaleString()}
                </span>
              </div>
            )}

            {/* Edit Mode */}
            {isEditing ? (
              <div className="space-y-4 relative">
                {/* Loading Overlay */}
                {isSaving && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Saving document...</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait</p>
                    </div>
                  </div>
                )}

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Title
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => {
                      setEditedTitle(e.target.value);
                      handleFieldChange();
                    }}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Document title"
                  />
                </div>

                {/* Version Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version (format: X.Y or X.Y.Z)
                  </label>
                  <input
                    type="text"
                    value={editedVersion}
                    onChange={(e) => {
                      setEditedVersion(e.target.value);
                      handleFieldChange();
                    }}
                    disabled={isSaving}
                    className="w-64 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="1.0"
                  />
                </div>

                {/* Content Editor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Content
                  </label>
                  <div className="quill-wrapper">
                    <ReactQuill
                      value={editedContent || ''}
                      onChange={(content) => {
                        setEditedContent(content);
                        handleFieldChange();
                      }}
                      readOnly={isSaving}
                      theme="snow"
                      placeholder="Start writing or paste from Word (Ctrl+V)..."
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          [{ font: [] }],
                          [{ size: ['small', false, 'large', 'huge'] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ color: [] }, { background: [] }],
                          [{ script: 'sub' }, { script: 'super' }],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          [{ indent: '-1' }, { indent: '+1' }],
                          [{ align: [] }],
                          ['blockquote', 'code-block'],
                          ['link', 'image'],
                          ['clean'],
                        ],
                        clipboard: {
                          matchVisual: false,
                        },
                      }}
                      formats={[
                        'header',
                        'font',
                        'size',
                        'bold',
                        'italic',
                        'underline',
                        'strike',
                        'color',
                        'background',
                        'script',
                        'list',
                        'bullet',
                        'indent',
                        'align',
                        'link',
                        'image',
                        'blockquote',
                        'code-block',
                      ]}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-border">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : activeDocument ? (
              /* View Mode - Show HTML content */
              <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-dark-bg-secondary rounded-lg p-6 overflow-auto max-h-[600px]">
                <div dangerouslySetInnerHTML={{ __html: activeDocument.content }} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No active document found for this type.
            </p>
            <Button
              variant="primary"
              onClick={handleCreateNewVersion}
            >
              Create First Version
            </Button>
          </div>
        )}
      </Card>

      {/* Version History - Placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Version History
          </h3>
          {allVersions.length > 0 && (
            <button
              onClick={handleCreateNewVersion}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
            >
              Create New Version
            </button>
          )}
        </div>

        {allVersions.length > 0 ? (
          <div className="space-y-3">
            {allVersions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-dark-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {version.title} v{version.version}
                    </span>
                    {version.is_active && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Created: {new Date(version.created_at).toLocaleDateString()}
                  </p>
                </div>
                {!version.is_active && (
                  <button
                    onClick={() => handleActivateVersion(version.id)}
                    className="px-3 py-1.5 border border-primary text-primary rounded hover:bg-primary/5 text-sm"
                  >
                    Activate
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No versions found. Create the first version to get started.
          </p>
        )}
      </Card>
    </div>
  );
};
