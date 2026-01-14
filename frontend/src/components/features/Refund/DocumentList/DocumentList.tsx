import React from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { refundService } from '@/services';
import { DocumentListProps } from './DocumentList.types';

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  refundId,
  isAdmin = false,
  onDelete,
  onVerify,
  isLoading = false,
  verifyingDocId = null,
  deletingDocId = null,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      receipt: 'Receipt',
      proof_of_cancellation: 'Proof of Cancellation',
      bank_statement: 'Bank Statement',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getFileIcon = (fileType: string): JSX.Element => {
    if (fileType.includes('pdf')) {
      return (
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const handleDownload = (docId: string) => {
    const url = refundService.getDocumentDownloadUrl(refundId, docId);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Body className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading documents...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <Card.Body className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No documents uploaded
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? 'No documents have been uploaded for this refund request yet.'
              : 'Upload receipts or proof to support your refund request.'}
          </p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const canDelete = !isAdmin && !doc.is_verified && onDelete;
        const canVerify = isAdmin && !doc.is_verified && onVerify;

        return (
          <Card key={doc.id} variant="elevated">
            <Card.Body className="flex items-start justify-between gap-4">
              {/* Left: Icon + Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-dark-hover rounded-md">
                  {getFileIcon(doc.file_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {doc.file_name}
                    </p>
                    {doc.is_verified && (
                      <Badge variant="success" size="sm">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                    <Badge variant="info" size="sm">
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                    <span>•</span>
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    {doc.user && (
                      <>
                        <span>•</span>
                        <span>
                          {doc.user.first_name} {doc.user.last_name}
                        </span>
                      </>
                    )}
                  </div>

                  {doc.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  {doc.is_verified && doc.verified_at && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Verified on {new Date(doc.verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(doc.id)}
                  className="flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </Button>

                {/* Verify Button (Admin Only) */}
                {canVerify && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onVerify(doc.id)}
                    isLoading={verifyingDocId === doc.id}
                    disabled={verifyingDocId === doc.id}
                    className="flex items-center gap-1"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Verify
                  </Button>
                )}

                {/* Delete Button (Guest Only, Unverified) */}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(doc.id)}
                    isLoading={deletingDocId === doc.id}
                    disabled={deletingDocId === doc.id}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 dark:text-red-400 dark:hover:text-red-300 dark:border-red-600 dark:hover:border-red-500"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};
