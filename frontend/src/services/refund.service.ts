import { api } from './api.service';
import { API_URL } from '@/config';
import type {
  RefundRequest,
  RefundRequestWithDetails,
  RefundCalculation,
  RefundStatusResponse,
  CreateRefundRequestDTO,
  ApproveRefundDTO,
  RejectRefundDTO,
  MarkManualRefundCompleteDTO,
  RefundListParams,
  RefundListResponse,
  ProcessRefundResult,
  RefundComment,
  CreateRefundCommentRequest,
  RefundStatusHistory,
  RefundActivity,
  RefundDocument,
} from '@/types/refund.types';

class RefundService {
  // ============================================================================
  // GUEST ENDPOINTS
  // ============================================================================

  /**
   * Calculate suggested refund amount for a booking
   * GET /api/bookings/:bookingId/refunds/calculate
   */
  async calculateSuggestedRefund(bookingId: string): Promise<RefundCalculation> {
    const response = await api.get<RefundCalculation>(
      `/bookings/${bookingId}/refunds/calculate`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to calculate suggested refund');
    }

    return response.data;
  }

  /**
   * Create a new refund request
   * POST /api/bookings/:bookingId/refunds
   */
  async createRefundRequest(
    bookingId: string,
    data: CreateRefundRequestDTO
  ): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/bookings/${bookingId}/refunds`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create refund request');
    }

    return response.data;
  }

  /**
   * Get all refund requests for a booking
   * GET /api/bookings/:bookingId/refunds
   */
  async getBookingRefunds(bookingId: string): Promise<RefundRequest[]> {
    const response = await api.get<RefundRequest[]>(
      `/bookings/${bookingId}/refunds`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch booking refunds');
    }

    return response.data;
  }

  /**
   * Get refund request details
   * GET /api/refunds/:id
   */
  async getRefundDetails(refundId: string): Promise<RefundRequestWithDetails> {
    const response = await api.get<RefundRequestWithDetails>(`/refunds/${refundId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch refund details');
    }

    return response.data;
  }

  /**
   * Get refund status for a booking
   * GET /api/refunds/booking/:bookingId/status
   */
  async getRefundStatus(bookingId: string): Promise<RefundStatusResponse> {
    const response = await api.get<RefundStatusResponse>(
      `/refunds/booking/${bookingId}/status`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch refund status');
    }

    return response.data;
  }

  /**
   * List user's own refund requests
   * GET /api/refunds
   */
  async listMyRefunds(params?: Partial<RefundListParams>): Promise<RefundListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach(s => queryParams.append('status', s));
    }
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/refunds${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get<{ data: any[]; pagination: any }>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch refunds');
    }

    // Transform API response to match RefundListResponse interface
    return {
      refunds: response.data,
      total: response.pagination?.total || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.limit || 20,
      totalPages: response.pagination?.totalPages || 0,
    };
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /**
   * List all refund requests (admin)
   * GET /api/admin/refunds
   */
  async listRefunds(params?: RefundListParams): Promise<RefundListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach(s => queryParams.append('status', s));
    }
    if (params?.property_id) queryParams.set('property_id', params.property_id);
    if (params?.booking_id) queryParams.set('booking_id', params.booking_id);
    if (params?.from_date) queryParams.set('from_date', params.from_date);
    if (params?.to_date) queryParams.set('to_date', params.to_date);
    if (params?.min_amount !== undefined) {
      queryParams.set('min_amount', String(params.min_amount));
    }
    if (params?.max_amount !== undefined) {
      queryParams.set('max_amount', String(params.max_amount));
    }
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/admin/refunds${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get<RefundListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch refunds');
    }

    return response.data;
  }

  /**
   * Get refund request details (admin)
   * GET /api/admin/refunds/:id
   */
  async getAdminRefundDetails(refundId: string): Promise<RefundRequestWithDetails> {
    const response = await api.get<RefundRequestWithDetails>(
      `/admin/refunds/${refundId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch refund details');
    }

    return response.data;
  }

  /**
   * Get all refund requests for a specific user (super admin only)
   * GET /api/users/:userId/refunds
   */
  async getUserRefunds(
    userId: string,
    params?: Omit<RefundListParams, 'requested_by'>
  ): Promise<RefundListResponse> {
    const response = await api.get<RefundListResponse>(
      `/users/${userId}/refunds`,
      { params }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch user refunds');
    }

    return response.data;
  }

  /**
   * Approve a refund request
   * POST /api/admin/refunds/:id/approve
   */
  async approveRefund(
    refundId: string,
    data: ApproveRefundDTO
  ): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/admin/refunds/${refundId}/approve`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to approve refund');
    }

    return response.data;
  }

  /**
   * Reject a refund request
   * POST /api/admin/refunds/:id/reject
   */
  async rejectRefund(
    refundId: string,
    data: RejectRefundDTO
  ): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/admin/refunds/${refundId}/reject`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to reject refund');
    }

    return response.data;
  }

  /**
   * Process a refund (automatic)
   * POST /api/admin/refunds/:id/process
   */
  async processRefund(refundId: string): Promise<ProcessRefundResult> {
    const response = await api.post<ProcessRefundResult>(
      `/admin/refunds/${refundId}/process`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process refund');
    }

    return response.data;
  }

  /**
   * Mark manual refund as complete
   * POST /api/admin/refunds/:id/mark-complete
   */
  async markManualRefundComplete(
    refundId: string,
    data: MarkManualRefundCompleteDTO
  ): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/admin/refunds/${refundId}/mark-complete`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark refund as complete');
    }

    return response.data;
  }

  /**
   * Retry failed refund
   * POST /api/admin/refunds/:id/retry
   */
  async retryFailedRefund(refundId: string): Promise<ProcessRefundResult> {
    const response = await api.post<ProcessRefundResult>(
      `/admin/refunds/${refundId}/retry`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to retry refund');
    }

    return response.data;
  }

  /**
   * Process a specific payment method for a refund
   * POST /api/admin/refunds/:id/process-method/:methodId
   */
  async processRefundForMethod(refundId: string, methodId: string): Promise<void> {
    const response = await api.post<void>(
      `/admin/refunds/${refundId}/process-method/${methodId}`,
      {}
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to process refund for payment method');
    }
  }

  /**
   * Withdraw a refund request
   * POST /api/refunds/:id/withdraw
   */
  async withdrawRefund(refundId: string): Promise<RefundRequest> {
    const response = await api.post<RefundRequest>(
      `/refunds/${refundId}/withdraw`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to withdraw refund request');
    }

    return response.data;
  }

  // ============================================================================
  // COMMENT SYSTEM
  // ============================================================================

  /**
   * Add a comment to a refund request
   * POST /api/refunds/:id/comments
   */
  async addComment(
    refundId: string,
    data: CreateRefundCommentRequest
  ): Promise<RefundComment> {
    const response = await api.post<RefundComment>(
      `/refunds/${refundId}/comments`,
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add comment');
    }

    return response.data;
  }

  /**
   * Get all comments for a refund request
   * GET /api/refunds/:id/comments
   */
  async getComments(refundId: string): Promise<RefundComment[]> {
    const response = await api.get<RefundComment[]>(
      `/refunds/${refundId}/comments`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch comments');
    }

    return response.data || [];
  }

  /**
   * Get activity feed (comments + status changes) for a refund
   * GET /api/refunds/:id/activity
   */
  async getActivityFeed(refundId: string): Promise<RefundActivity[]> {
    const response = await api.get<RefundActivity[]>(
      `/refunds/${refundId}/activity`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch activity feed');
    }

    return response.data || [];
  }

  /**
   * Get status history for a refund
   * GET /api/refunds/:id/history
   */
  async getStatusHistory(refundId: string): Promise<RefundStatusHistory[]> {
    const response = await api.get<RefundStatusHistory[]>(
      `/refunds/${refundId}/history`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch status history');
    }

    return response.data || [];
  }

  // ============================================================================
  // DOCUMENT MANAGEMENT (Migration 046)
  // ============================================================================

  /**
   * Upload a document for a refund request
   * POST /api/refunds/:id/documents
   */
  async uploadDocument(
    refundId: string,
    file: File,
    documentType: string,
    description?: string
  ): Promise<RefundDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.upload<RefundDocument>(
      `/refunds/${refundId}/documents`,
      formData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload document');
    }

    return response.data;
  }

  /**
   * Get documents for a refund request
   * GET /api/refunds/:id/documents
   */
  async getDocuments(refundId: string): Promise<RefundDocument[]> {
    const response = await api.get<RefundDocument[]>(
      `/refunds/${refundId}/documents`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch documents');
    }

    return response.data || [];
  }

  /**
   * Delete a document
   * DELETE /api/refunds/:id/documents/:docId
   */
  async deleteDocument(refundId: string, docId: string): Promise<void> {
    const response = await api.delete<void>(
      `/refunds/${refundId}/documents/${docId}`
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete document');
    }
  }

  /**
   * Verify a document (admin only)
   * POST /api/admin/refunds/:id/documents/:docId/verify
   */
  async verifyDocument(refundId: string, docId: string): Promise<RefundDocument> {
    const response = await api.post<RefundDocument>(
      `/admin/refunds/${refundId}/documents/${docId}/verify`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to verify document');
    }

    return response.data;
  }

  /**
   * Reject a document (admin only)
   * POST /api/admin/refunds/:id/documents/:docId/reject
   */
  async rejectDocument(refundId: string, docId: string, reason: string): Promise<RefundDocument> {
    const response = await api.post<RefundDocument>(
      `/admin/refunds/${refundId}/documents/${docId}/reject`,
      { reason }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to reject document');
    }

    return response.data;
  }

  /**
   * Get download URL for a document
   * Returns the API endpoint that will redirect to the signed URL
   */
  getDocumentDownloadUrl(refundId: string, docId: string): string {
    return `${API_URL}/refunds/${refundId}/documents/${docId}/download`;
  }
}

// Export singleton instance
export const refundService = new RefundService();
export default refundService;
