import { api } from './api.service';
import type {
  CreditMemo,
  CreditMemoListParams,
  CreditMemoListResponse,
  CreditMemoDownloadURLResponse,
  GenerateCreditMemoDTO,
  VoidCreditMemoDTO,
} from '@/types/credit-memo.types';

class CreditMemoService {
  // ============================================================================
  // USER ENDPOINTS
  // ============================================================================

  /**
   * Get credit memo details
   * GET /api/credit-memos/:id
   */
  async getCreditMemo(id: string): Promise<CreditMemo> {
    const response = await api.get<CreditMemo>(`/credit-memos/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch credit memo');
    }

    return response.data;
  }

  /**
   * Get credit memo download URL
   * GET /api/credit-memos/:id/download
   */
  async getCreditMemoDownloadUrl(id: string): Promise<CreditMemoDownloadURLResponse> {
    const response = await api.get<CreditMemoDownloadURLResponse>(
      `/credit-memos/${id}/download`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to generate download URL');
    }

    return response.data;
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  /**
   * List all credit memos (admin)
   * GET /api/admin/credit-memos
   */
  async listCreditMemos(params?: CreditMemoListParams): Promise<CreditMemoListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.set('status', params.status);
    if (params?.property_id) queryParams.set('property_id', params.property_id);
    if (params?.user_id) queryParams.set('user_id', params.user_id);
    if (params?.booking_id) queryParams.set('booking_id', params.booking_id);
    if (params?.invoice_id) queryParams.set('invoice_id', params.invoice_id);
    if (params?.refund_request_id) {
      queryParams.set('refund_request_id', params.refund_request_id);
    }
    if (params?.from_date) queryParams.set('from_date', params.from_date);
    if (params?.to_date) queryParams.set('to_date', params.to_date);
    if (params?.min_amount_cents !== undefined) {
      queryParams.set('min_amount_cents', String(params.min_amount_cents));
    }
    if (params?.max_amount_cents !== undefined) {
      queryParams.set('max_amount_cents', String(params.max_amount_cents));
    }
    if (params?.search) queryParams.set('search', params.search);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const url = `/admin/credit-memos${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await api.get<CreditMemoListResponse>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch credit memos');
    }

    return response.data;
  }

  /**
   * Void a credit memo
   * POST /api/admin/credit-memos/:id/void
   */
  async voidCreditMemo(id: string, data?: VoidCreditMemoDTO): Promise<CreditMemo> {
    const response = await api.post<CreditMemo>(
      `/admin/credit-memos/${id}/void`,
      data || {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to void credit memo');
    }

    return response.data;
  }

  /**
   * Regenerate PDF for credit memo
   * POST /api/admin/credit-memos/:id/regenerate-pdf
   */
  async regeneratePDF(id: string): Promise<{ pdf_url: string; credit_memo_id: string }> {
    const response = await api.post<{ pdf_url: string; credit_memo_id: string }>(
      `/admin/credit-memos/${id}/regenerate-pdf`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to regenerate PDF');
    }

    return response.data;
  }

  /**
   * Generate credit memo for refund request (manual trigger)
   * POST /api/admin/refunds/:refundId/generate-credit-memo
   */
  async generateCreditMemo(refundId: string): Promise<CreditMemo> {
    const response = await api.post<CreditMemo>(
      `/admin/refunds/${refundId}/generate-credit-memo`,
      {}
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to generate credit memo');
    }

    return response.data;
  }
}

// Export singleton instance
export const creditMemoService = new CreditMemoService();
export default creditMemoService;
