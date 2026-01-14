/**
 * Credit Note Service
 *
 * Handles all credit note-related API calls
 */

import { api } from './api.service';
import type {
  CreditNote,
  CreateCreditNoteInput,
  CreditNoteListParams,
  CreditNoteListResponse,
} from '../types/credit-note.types';

/**
 * Create a new credit note
 */
export const createCreditNote = async (input: CreateCreditNoteInput): Promise<CreditNote> => {
  const response = await api.post<CreditNote>('/credit-notes', input);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create credit note');
  }
  return response.data;
};

/**
 * Get a single credit note by ID
 */
export const getCreditNote = async (creditNoteId: string): Promise<CreditNote> => {
  const response = await api.get<CreditNote>(`/credit-notes/${creditNoteId}`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch credit note');
  }
  return response.data;
};

/**
 * List credit notes with optional filters
 */
export const listCreditNotes = async (
  params?: CreditNoteListParams
): Promise<CreditNoteListResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.user_id) queryParams.append('user_id', params.user_id);
  if (params?.invoice_id) queryParams.append('invoice_id', params.invoice_id);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.from_date) queryParams.append('from_date', params.from_date);
  if (params?.to_date) queryParams.append('to_date', params.to_date);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const queryString = queryParams.toString();
  const url = queryString ? `/credit-notes?${queryString}` : '/credit-notes';

  const response = await api.get<CreditNoteListResponse>(url);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list credit notes');
  }
  return response.data;
};

/**
 * Get credit note PDF download URL
 */
export const getCreditNoteDownloadUrl = async (creditNoteId: string): Promise<string> => {
  const response = await api.get<{ url: string }>(`/credit-notes/${creditNoteId}/download`);
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get download URL');
  }
  return response.data.url;
};

/**
 * Void a credit note (admin only)
 */
export const voidCreditNote = async (creditNoteId: string): Promise<CreditNote> => {
  const response = await api.post<CreditNote>(`/credit-notes/${creditNoteId}/void`, {});
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to void credit note');
  }
  return response.data;
};

/**
 * Regenerate credit note PDF (admin only)
 */
export const regenerateCreditNotePDF = async (creditNoteId: string): Promise<{ pdf_url: string }> => {
  const response = await api.post<{ pdf_url: string }>(`/credit-notes/${creditNoteId}/regenerate-pdf`, {});
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to regenerate PDF');
  }
  return response.data;
};
