import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthenticatedLayout } from '@/components/layout';
import {
  Button,
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Alert,
  Input,
  Textarea,
  Skeleton,
  RefundStatusBadge,
  AmountDisplay,
} from '@/components/ui';
import {
  RefundStatusDisplay,
  RefundCommentThread,
  RefundActivityTimeline,
  CreditMemoViewer,
  RefundActionModal,
  DocumentList,
} from '@/components/features';
import { refundService } from '@/services';
import type { RefundRequestWithDetails, RefundComment, RefundDocument, MarkManualRefundCompleteDTO } from '@/types/refund.types';

export const RefundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [refund, setRefund] = useState<RefundRequestWithDetails | null>(null);
  const [comments, setComments] = useState<RefundComment[]>([]);
  const [documents, setDocuments] = useState<RefundDocument[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject' | 'process' | null>(null);

  // Manual completion state
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [refundReference, setRefundReference] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Document state
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRefundDetails();
      fetchDocuments();
    }
  }, [id]);

  const fetchRefundDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const refundData = await refundService.getAdminRefundDetails(id);
      setRefund(refundData);

      // Fetch comments
      try {
        const commentsData = await refundService.getComments(id);
        setComments(commentsData);
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refund details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;

    try {
      const docs = await refundService.getDocuments(id);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  // Modal handlers
  const handleOpenApproveModal = () => {
    setCurrentAction('approve');
    setShowActionModal(true);
  };

  const handleOpenRejectModal = () => {
    setCurrentAction('reject');
    setShowActionModal(true);
  };

  const handleOpenProcessModal = () => {
    setCurrentAction('process');
    setShowActionModal(true);
  };

  const handleModalSuccess = () => {
    setSuccess('Action completed successfully');
    fetchRefundDetails();
  };

  const handleCommentAdded = (comment: RefundComment) => {
    setComments((prev) => [...prev, comment]);
  };

  const handleMarkManualComplete = async () => {
    if (!id || !refund || !refundReference.trim()) return;

    setIsMarkingComplete(true);
    setError(null);
    try {
      const data: MarkManualRefundCompleteDTO = {
        refund_reference: refundReference,
        notes: manualNotes || undefined,
      };
      await refundService.markManualRefundComplete(id, data);
      setSuccess('Manual refund marked as complete');
      setRefundReference('');
      setManualNotes('');
      await fetchRefundDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark refund as complete');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleVerifyDocument = async (docId: string) => {
    if (!id) return;

    setVerifyingDocId(docId);
    try {
      await refundService.verifyDocument(id, docId);
      setSuccess('Document verified successfully');
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify document');
    } finally {
      setVerifyingDocId(null);
    }
  };

  const canApprove = refund && (refund.status === 'requested' || refund.status === 'under_review');
  const canProcess = refund && refund.status === 'approved';
  const canMarkManual = refund && refund.status === 'processing' && refund.refund_breakdown?.some(b => b.status === 'manual_pending');

  const formatCurrency = (amount: number, currency: string = 'ZAR'): string => {
    return `${currency} ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error && !refund) {
    return (
      <AuthenticatedLayout>
        <Alert variant="error">{error}</Alert>
      </AuthenticatedLayout>
    );
  }

  if (!refund) {
    return (
      <AuthenticatedLayout>
        <Alert variant="error">Refund request not found</Alert>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      title={`Refund Request #${refund.id.slice(0, 8).toUpperCase()}`}
      subtitle={`Booking: ${refund.booking?.booking_reference || refund.booking_id.slice(0, 8)}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => navigate('/admin/refunds')}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Refunds
        </Button>

        {/* Header Card */}
        <Card variant="gradient">
          <Card.Body>
            {/* Top Row - Status & Actions */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <RefundStatusBadge status={refund.status} size="lg" />
                {(refund.booking as any)?.property_name && (
                  <Badge variant="info" size="sm">
                    {(refund.booking as any).property_name}
                  </Badge>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                {canApprove && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleOpenApproveModal}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenRejectModal}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {canProcess && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenProcessModal}
                  >
                    Process Refund
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/50 dark:bg-dark-card/50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Requested Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(refund.requested_amount, refund.currency)}
                </p>
              </div>

              {refund.approved_amount && (
                <div className="bg-green-50/50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-400 mb-1">Approved Amount</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency(refund.approved_amount, refund.currency)}
                  </p>
                </div>
              )}

              {refund.refunded_amount > 0 && (
                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Refunded Amount</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(refund.refunded_amount, refund.currency)}
                  </p>
                </div>
              )}

              <div className="bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-400 mb-1">Requested Date</p>
                <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  {new Date(refund.requested_at || refund.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Alerts */}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">
              Comments {refund.comment_count ? `(${refund.comment_count})` : ''}
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="documents">
              Documents {refund.document_count ? `(${refund.document_count})` : ''}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Refund Status */}
                <Card>
                  <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Refund Details</h3>
                  </Card.Header>
                  <Card.Body>
                    <RefundStatusDisplay refundRequest={refund} currency={refund.currency} />
                  </Card.Body>
                </Card>

                {/* Cancellation Policy */}
                {refund.cancellation_policy && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Cancellation Policy</h3>
                    </Card.Header>
                    <Card.Body>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Policy Type</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                            {refund.cancellation_policy}
                          </p>
                        </div>
                        {refund.calculated_policy_amount !== null && refund.calculated_policy_amount !== undefined && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Policy Amount</p>
                            <AmountDisplay
                              amount={refund.calculated_policy_amount}
                              currency={refund.currency}
                              size="sm"
                            />
                          </div>
                        )}
                        {refund.suggested_amount !== null && refund.suggested_amount !== undefined && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Suggested Refund</p>
                            <AmountDisplay
                              amount={refund.suggested_amount}
                              currency={refund.currency}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Payment Breakdown */}
                {refund.refund_breakdown && refund.refund_breakdown.length > 0 && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Breakdown</h3>
                    </Card.Header>
                    <Card.Body>
                      <div className="space-y-3">
                        {refund.refund_breakdown.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-hover rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                {item.method.replace('_', ' ')}
                              </p>
                              {item.gateway_refund_id && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {item.gateway_refund_id}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <AmountDisplay
                                amount={item.amount}
                                currency={refund.currency}
                                size="sm"
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {item.status.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Credit Memo */}
                {refund.credit_memo && (
                  <CreditMemoViewer creditMemo={refund.credit_memo} />
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                {canApprove && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Refund Request</h3>
                    </Card.Header>
                    <Card.Body className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Review and take action on this refund request.
                      </p>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleOpenApproveModal}
                      >
                        Approve Refund
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        onClick={handleOpenRejectModal}
                      >
                        Reject Request
                      </Button>
                    </Card.Body>
                  </Card>
                )}

                {/* Processing Panel */}
                {canProcess && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Process Refund</h3>
                    </Card.Header>
                    <Card.Body className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Initiate automatic refund processing via payment gateways.
                      </p>
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleOpenProcessModal}
                      >
                        Process Refund
                      </Button>
                    </Card.Body>
                  </Card>
                )}

                {/* Manual Completion */}
                {canMarkManual && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Mark Manual Refund Complete</h3>
                    </Card.Header>
                    <Card.Body className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Refund Reference <span className="text-error">*</span>
                        </label>
                        <Input
                          value={refundReference}
                          onChange={(e) => setRefundReference(e.target.value)}
                          placeholder="e.g., Bank Transfer Ref: 123456"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notes (optional)
                        </label>
                        <Textarea
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          rows={3}
                          placeholder="Additional notes..."
                        />
                      </div>

                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleMarkManualComplete}
                        isLoading={isMarkingComplete}
                        disabled={isMarkingComplete || !refundReference.trim()}
                      >
                        Mark as Complete
                      </Button>
                    </Card.Body>
                  </Card>
                )}

                {/* Request Summary */}
                <Card>
                  <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Request Summary</h3>
                  </Card.Header>
                  <Card.Body className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Status</p>
                      <RefundStatusBadge status={refund.status} />
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requested By</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {refund.requested_by_user?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requested Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(refund.requested_at || refund.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {refund.reviewed_by_user && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Reviewed By</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {refund.reviewed_by_user.name}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Comments & Updates</h3>
              </Card.Header>
              <Card.Body>
                <RefundCommentThread
                  refundId={refund.id}
                  comments={comments}
                  onCommentAdded={handleCommentAdded}
                  currentUserId={user?.id || ''}
                  isAdmin={true}
                />
              </Card.Body>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Timeline</h3>
              </Card.Header>
              <Card.Body>
                <RefundActivityTimeline refundId={refund.id} />
              </Card.Body>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Supporting Documents</h3>
              </Card.Header>
              <Card.Body>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">
                      No documents uploaded
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-white dark:bg-dark-hover rounded">
                            {doc.file_type.includes('pdf') ? (
                              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{doc.file_name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Badge variant="info" size="sm">
                                {doc.document_type.replace('_', ' ')}
                              </Badge>
                              <span>•</span>
                              <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                              <span>•</span>
                              <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                              {doc.is_verified && (
                                <>
                                  <span>•</span>
                                  <Badge variant="success" size="sm">Verified</Badge>
                                </>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{doc.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!doc.is_verified && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleVerifyDocument(doc.id)}
                              isLoading={verifyingDocId === doc.id}
                              disabled={verifyingDocId === doc.id}
                            >
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(refundService.getDocumentDownloadUrl(refund.id, doc.id))}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refund Action Modal */}
        {showActionModal && currentAction && refund && (
          <RefundActionModal
            isOpen={showActionModal}
            onClose={() => {
              setShowActionModal(false);
              setCurrentAction(null);
            }}
            refund={refund}
            action={currentAction}
            onSuccess={handleModalSuccess}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
};
