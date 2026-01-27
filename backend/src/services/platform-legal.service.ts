/**
 * Platform Legal Documents Service
 *
 * Business logic for managing Vilo SaaS platform-level legal documents
 */

import { getAdminClient } from '../config/supabase';
import type {
  PlatformLegalDocument,
  PlatformLegalDocumentType,
  CreatePlatformLegalDocumentData,
  UpdatePlatformLegalDocumentData,
} from '../types/platform-legal.types';

// Get Supabase admin client for database operations
const supabase = getAdminClient();

/**
 * Get all active platform legal documents (public access)
 */
export const getActivePlatformLegalDocuments = async (): Promise<PlatformLegalDocument[]> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] getActivePlatformLegalDocuments called ===');

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .select('*')
      .eq('is_active', true)
      .order('document_type', { ascending: true });

    if (error) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching active documents:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Found', data?.length || 0, 'active documents');
    return data || [];
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getActivePlatformLegalDocuments failed:', error);
    throw error;
  }
};

/**
 * Get all platform legal documents including inactive (admin only)
 */
export const getAllPlatformLegalDocuments = async (): Promise<PlatformLegalDocument[]> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] getAllPlatformLegalDocuments called ===');

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .select('*')
      .order('document_type', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching all documents:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Found', data?.length || 0, 'total documents');
    return data || [];
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getAllPlatformLegalDocuments failed:', error);
    throw error;
  }
};

/**
 * Get platform legal document by ID
 */
export const getPlatformLegalDocument = async (id: string): Promise<PlatformLegalDocument | null> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] getPlatformLegalDocument called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] Document ID:', id);

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[PLATFORM_LEGAL_SERVICE] Document not found');
        return null;
      }
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching document:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document found:', data.document_type, 'v' + data.version);
    return data;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getPlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Get active platform legal document by type
 */
export const getPlatformLegalDocumentByType = async (
  documentType: PlatformLegalDocumentType
): Promise<PlatformLegalDocument | null> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] getPlatformLegalDocumentByType called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] Document type:', documentType);

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .select('*')
      .eq('document_type', documentType)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[PLATFORM_LEGAL_SERVICE] No active document found for type:', documentType);
        return null;
      }
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching document by type:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Active document found:', data.title, 'v' + data.version);
    return data;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getPlatformLegalDocumentByType failed:', error);
    throw error;
  }
};

/**
 * Get all versions of a document type
 */
export const getPlatformLegalDocumentVersions = async (
  documentType: PlatformLegalDocumentType
): Promise<PlatformLegalDocument[]> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] getPlatformLegalDocumentVersions called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] Document type:', documentType);

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .select('*')
      .eq('document_type', documentType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error fetching versions:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Found', data?.length || 0, 'versions for', documentType);
    return data || [];
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] getPlatformLegalDocumentVersions failed:', error);
    throw error;
  }
};

/**
 * Create platform legal document
 */
export const createPlatformLegalDocument = async (
  userId: string,
  documentData: CreatePlatformLegalDocumentData
): Promise<PlatformLegalDocument> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] createPlatformLegalDocument called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] User ID:', userId);
  console.log('[PLATFORM_LEGAL_SERVICE] Document type:', documentData.document_type);
  console.log('[PLATFORM_LEGAL_SERVICE] Version:', documentData.version);

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .insert({
        ...documentData,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error creating document:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] createPlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Update platform legal document
 */
export const updatePlatformLegalDocument = async (
  id: string,
  updateData: UpdatePlatformLegalDocumentData
): Promise<PlatformLegalDocument> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] updatePlatformLegalDocument called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] Document ID:', id);
  console.log('[PLATFORM_LEGAL_SERVICE] Update data:', JSON.stringify(updateData, null, 2));

  try {
    const { data, error } = await supabase
      .from('platform_legal_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error updating document:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document updated successfully');
    return data;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] updatePlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Activate platform legal document version
 * (Deactivates all other versions of the same document type)
 */
export const activatePlatformLegalDocument = async (id: string): Promise<PlatformLegalDocument> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] activatePlatformLegalDocument called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] Document ID to activate:', id);

  try {
    // Step 1: Get the document to activate
    console.log('[PLATFORM_LEGAL_SERVICE] Step 1: Fetching document to activate');
    const doc = await getPlatformLegalDocument(id);

    if (!doc) {
      console.error('[PLATFORM_LEGAL_SERVICE] Document not found');
      throw new Error('Document not found');
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document to activate:', doc.document_type, 'v' + doc.version);

    // Step 2: Deactivate all other versions of the same type
    console.log('[PLATFORM_LEGAL_SERVICE] Step 2: Deactivating other versions of', doc.document_type);
    const { error: deactivateError } = await supabase
      .from('platform_legal_documents')
      .update({ is_active: false })
      .eq('document_type', doc.document_type)
      .neq('id', id);

    if (deactivateError) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error deactivating other versions:', deactivateError);
      throw deactivateError;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Other versions deactivated');

    // Step 3: Activate this version
    console.log('[PLATFORM_LEGAL_SERVICE] Step 3: Activating version', doc.version);
    const { data, error: activateError } = await supabase
      .from('platform_legal_documents')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (activateError) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error activating version:', activateError);
      throw activateError;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Version activated successfully');
    return data;
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] activatePlatformLegalDocument failed:', error);
    throw error;
  }
};

/**
 * Delete platform legal document (soft delete - set is_active to false)
 */
export const deletePlatformLegalDocument = async (id: string): Promise<void> => {
  console.log('=== [PLATFORM_LEGAL_SERVICE] deletePlatformLegalDocument called ===');
  console.log('[PLATFORM_LEGAL_SERVICE] Document ID:', id);

  try {
    const { error } = await supabase
      .from('platform_legal_documents')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('[PLATFORM_LEGAL_SERVICE] Error deleting document:', error);
      throw error;
    }

    console.log('[PLATFORM_LEGAL_SERVICE] Document soft deleted successfully');
  } catch (error) {
    console.error('[PLATFORM_LEGAL_SERVICE] deletePlatformLegalDocument failed:', error);
    throw error;
  }
};
