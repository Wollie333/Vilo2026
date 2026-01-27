/**
 * Platform Legal Documents Service
 *
 * API client for managing platform-level legal documents
 */

import { api } from './api.service';
import type {
  PlatformLegalDocument,
  PlatformLegalDocumentType,
  CreatePlatformLegalDocumentData,
  UpdatePlatformLegalDocumentData,
} from '../types/platform-legal.types';

/**
 * Get all platform legal documents (admin only)
 */
export const getAllPlatformLegalDocuments = async (): Promise<PlatformLegalDocument[]> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Fetching all documents');

  try {
    const response = await api.get<PlatformLegalDocument[]>('/admin/platform-legal/documents');

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching documents:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch documents');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Fetched', response.data?.length || 0, 'documents');
    return response.data || [];
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getAllPlatformLegalDocuments failed:', error);
    throw error;
  }
};

/**
 * Get single platform legal document by ID (admin only)
 */
export const getPlatformLegalDocument = async (id: string): Promise<PlatformLegalDocument> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Fetching document:', id);

  try {
    const response = await api.get<PlatformLegalDocument>(`/admin/platform-legal/documents/${id}`);

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching document:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch document');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document fetched successfully');
    return response.data!;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getPlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Get active document by type (admin only)
 */
export const getPlatformLegalDocumentByType = async (
  documentType: PlatformLegalDocumentType
): Promise<PlatformLegalDocument | null> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Fetching active document for type:', documentType);

  try {
    const response = await api.get<PlatformLegalDocument>(
      `/admin/platform-legal/documents/type/${documentType}`
    );

    if (!response.success) {
      if (response.error?.message?.includes('not found')) {
        console.log('[PLATFORM_LEGAL_SERVICE] No active document found for type');
        return null;
      }
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching document by type:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch document');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Active document fetched successfully');
    return response.data || null;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getPlatformLegalDocumentByType failed:', error);
    throw error;
  }
};

/**
 * Get all versions of a document type (admin only)
 */
export const getPlatformLegalDocumentVersions = async (
  documentType: PlatformLegalDocumentType
): Promise<PlatformLegalDocument[]> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Fetching versions for type:', documentType);

  try {
    const response = await api.get<PlatformLegalDocument[]>(
      `/admin/platform-legal/documents/type/${documentType}/versions`
    );

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching versions:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch versions');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Fetched', response.data?.length || 0, 'versions');
    return response.data || [];
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getPlatformLegalDocumentVersions failed:', error);
    throw error;
  }
};

/**
 * Create new platform legal document (admin only)
 */
export const createPlatformLegalDocument = async (
  data: CreatePlatformLegalDocumentData
): Promise<PlatformLegalDocument> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Creating document:', data.document_type, 'v' + data.version);
  console.log('[PLATFORM_LEGAL_SERVICE] Data size:', JSON.stringify(data).length, 'bytes');

  try {
    // Increase timeout for large documents (2 minutes)
    const response = await api.post<PlatformLegalDocument>(
      '/admin/platform-legal/documents',
      data,
      {
        timeout: 120000, // 2 minutes for large content
      }
    );

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error creating document:', response.error);
      throw new Error(response.error?.message || 'Failed to create document');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document created successfully');
    return response.data!;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] createPlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Update platform legal document (admin only)
 */
export const updatePlatformLegalDocument = async (
  id: string,
  data: UpdatePlatformLegalDocumentData
): Promise<PlatformLegalDocument> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Updating document:', id);
  console.log('[PLATFORM_LEGAL_SERVICE] Data size:', JSON.stringify(data).length, 'bytes');

  try {
    // Increase timeout for large documents (2 minutes)
    const response = await api.put<PlatformLegalDocument>(
      `/admin/platform-legal/documents/${id}`,
      data,
      {
        timeout: 120000, // 2 minutes for large content
      }
    );

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error updating document:', response.error);
      throw new Error(response.error?.message || 'Failed to update document');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document updated successfully');
    return response.data!;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] updatePlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Activate a document version (admin only)
 */
export const activatePlatformLegalDocument = async (id: string): Promise<PlatformLegalDocument> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Activating document:', id);

  try {
    const response = await api.put<PlatformLegalDocument>(
      `/admin/platform-legal/documents/${id}/activate`
    );

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error activating document:', response.error);
      throw new Error(response.error?.message || 'Failed to activate document');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document activated successfully');
    return response.data!;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] activatePlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Delete platform legal document (admin only)
 */
export const deletePlatformLegalDocument = async (id: string): Promise<void> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Deleting document:', id);

  try {
    const response = await api.delete<void>(`/admin/platform-legal/documents/${id}`);

    if (!response.success) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error deleting document:', response.error);
      throw new Error(response.error?.message || 'Failed to delete document');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document deleted successfully');
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] deletePlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Get active document by type (PUBLIC - no auth required)
 */
export const getActiveDocumentByType = async (
  documentType: PlatformLegalDocumentType
): Promise<PlatformLegalDocument | null> => {
  console.log('[PLATFORM_LEGAL_SERVICE] Fetching public active document for type:', documentType);

  try {
    const response = await api.get<PlatformLegalDocument>(
      `/platform-legal/active/${documentType}`
    );

    if (!response.success) {
      if (response.error?.message?.includes('not found')) {
        console.log('[PLATFORM_LEGAL_SERVICE] No active document found');
        return null;
      }
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching public document:', response.error);
      throw new Error(response.error?.message || 'Failed to fetch document');
    }

    return response.data || null;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getActiveDocumentByType (public) failed:', error);
    throw error;
  }
};
