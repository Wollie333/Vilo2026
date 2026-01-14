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
  Spinner,
  RefundStatusBadge,
  AmountDisplay,
} from '@/components/ui';
import {
  RefundCommentThread,
  RefundActivityTimeline,
  CreditMemoViewer,
  DocumentUpload,
  DocumentList,
} from '@/components/features';
import { refundService } from '@/services';
import type { RefundRequest, RefundDocument } from '@/types/refund.types';

export const RefundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [refund, setRefund] = useState<RefundRequest | null>(null);
  const [documents, setDocuments] = useState<RefundDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Action states
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRefundDetails();
      fetchDocuments();
    }
  }, [id]);

  const fetchRefundDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const data = await refundService.getRefundDetails(id);
      setRefund(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load refund details');
    } finally {
      setLoading(false);
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

  const handleWithdraw = async () => {
    if (!id) return;

    setIsWithdrawing(true);
    setError(null);
    try {
      await refundService.withdrawRefund(id);
      setSuccess('Refund request withdrawn successfully');
      await fetchRefundDetails();
      setShowWithdrawConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw refund request');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!id) return;

    setDeletingDocId(docId);
    setError(null);
    try {
      await refundService.deleteDocument(id, docId);
      setSuccess('Document deleted successfully');
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const canWithdraw = refund && ['requested', 'under_review'].includes(refund.status);

  const formatCurrency = (amount: number, currency: string = 'ZAR'): string => {
    return `${currency} ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
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
      subtitle={`Requested on ${new Date(refund.requested_at || refund.created_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="outline" onClick={() => navigate('/refunds')}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Refunds
        </Button>

        {/* Header Card */}
        <Card variant="gradient">
          <Card.Body>
            {/* Top Row - Status & Actions */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <RefundStatusBadge status={refund.status} size="lg" />
                {refund.booking_id && (
                  <Badge variant="info" size="sm">
                    Booking #{refund.booking_id.slice(0, 8).toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Withdraw Button */}
              {canWithdraw && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWithdrawConfirm(true)}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 dark:text-red-400 dark:hover:text-red-300"
                >
                  Withdraw Request
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Status</p>
                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100 capitalize">
                  {refund.status.replace('_', ' ')}
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
                {/* Refund Reason */}
                <Card>
                  <Card.Header>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Refund Reason</h3>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-gray-900 dark:text-gray-100">{refund.reason}</p>
                  </Card.Body>
                </Card>

                {/* Review Notes (if rejected) */}
                {refund.status === 'rejected' && refund.review_notes && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Admin Response</h3>
                    </Card.Header>
                    <Card.Body>
                      <Alert variant="error">
                        <p>{refund.review_notes}</p>
                      </Alert>
                    </Card.Body>
                  </Card>
                )}

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
                        {refund.calculated_policy_amount !== null && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">Policy Amount</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(refund.calculated_policy_amount, refund.currency)}
                            </p>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
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
                      <p className="text-gray-500 dark:text-gray-400">Requested Amount</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(refund.requested_amount, refund.currency)}
                      </p>
                    </div>
                    {refund.approved_amount && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Approved Amount</p>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(refund.approved_amount, refund.currency)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requested Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(refund.requested_at || refund.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Card.Body>
                </Card>

                {canWithdraw && (
                  <Card>
                    <Card.Header>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
                    </Card.Header>
                    <Card.Body>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                        onClick={() => setShowWithdrawConfirm(true)}
                      >
                        Withdraw Request
                      </Button>
                    </Card.Body>
                  </Card>
                )}
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
                  comments={[]}
                  onCommentAdded={() => fetchRefundDetails()}
                  currentUserId={user?.id || ''}
                  isAdmin={false}
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
            <div className="space-y-6">
              {/* Upload Document Card */}
              {canWithdraw && (
                <DocumentUpload
                  refundId={refund.id}
                  onUploadComplete={fetchDocuments}
                  disabled={false}
                />
              )}

              {/* Documents List */}
              <DocumentList
                documents={documents}
                refundId={refund.id}
                isAdmin={false}
                onDelete={handleDeleteDocument}
                deletingDocId={deletingDocId}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Withdraw Confirmation Modal */}
        {showWithdrawConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <Card.Header>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirm Withdrawal</h3>
              </Card.Header>
              <Card.Body>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Are you sure you want to withdraw this refund request? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowWithdrawConfirm(false)}
                    disabled={isWithdrawing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleWithdraw}
                    isLoading={isWithdrawing}
                    disabled={isWithdrawing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Withdraw Request
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
};
