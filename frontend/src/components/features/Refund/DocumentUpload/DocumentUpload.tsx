import React, { useState } from 'react';
import { Card, Button, Textarea, Alert } from '@/components/ui';
import { refundService } from '@/services';
import { DocumentUploadProps } from './DocumentUpload.types';

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  refundId,
  onUploadComplete,
  disabled = false,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 10MB');
      setFile(null);
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF and image files (PNG, JPG, JPEG) are allowed');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file || !documentType) return;

    setIsUploading(true);
    setError(null);

    try {
      await refundService.uploadDocument(refundId, file, documentType, description);

      // Reset form
      setFile(null);
      setDocumentType('');
      setDescription('');

      // Reset file input
      const fileInput = document.getElementById('document-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const canUpload = file && documentType && !isUploading && !disabled;

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Upload Supporting Document
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Attach receipts, proof of cancellation, or other supporting documents for your refund request
        </p>
      </Card.Header>
      <Card.Body className="space-y-4">
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={disabled || isUploading}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-md bg-white dark:bg-dark-card text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select document type...</option>
            <option value="receipt">Receipt</option>
            <option value="proof_of_cancellation">Proof of Cancellation</option>
            <option value="bank_statement">Bank Statement</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            File <span className="text-red-500">*</span>
          </label>
          <input
            id="document-file-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="block w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-dark-border rounded-md cursor-pointer bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {file && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              <span className="font-medium">{file.name}</span> ({formatFileSize(file.size)})
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Max file size: 10MB. Supported formats: PDF, PNG, JPG, JPEG
          </p>
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this document..."
            disabled={disabled || isUploading}
            className="w-full"
          />
        </div>

        {/* Upload Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!canUpload}
            isLoading={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
