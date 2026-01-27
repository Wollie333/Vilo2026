/**
 * Platform Legal Documents Controller
 *
 * HTTP request handlers for platform legal documents endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import * as platformLegalService from '../services/platform-legal.service';
import { sendSuccess, sendError } from '../utils/response';
import type { PlatformLegalDocumentType } from '../types/platform-legal.types';

/**
 * GET /api/admin/platform-legal/documents
 * List all platform legal documents (admin only)
 */
export const listAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] listAllDocuments called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);

    const documents = await platformLegalService.getAllPlatformLegalDocuments();

    console.log('[PLATFORM_LEGAL_CONTROLLER] Returning', documents.length, 'documents');
    sendSuccess(res, documents);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] listAllDocuments failed:', error);
    next(error);
  }
};

/**
 * GET /api/admin/platform-legal/documents/:id
 * Get single platform legal document by ID (admin only)
 */
export const getDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] getDocument called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document ID:', req.params.id);
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);

    const document = await platformLegalService.getPlatformLegalDocument(req.params.id);

    if (!document) {
      console.log('[PLATFORM_LEGAL_CONTROLLER] Document not found');
      return sendError(res, 'Document not found', 404);
    }

    console.log('[PLATFORM_LEGAL_CONTROLLER] Document found');
    sendSuccess(res, document);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] getDocument failed:', error);
    next(error);
  }
};

/**
 * GET /api/admin/platform-legal/documents/type/:type
 * Get active document by type (admin only)
 */
export const getDocumentByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] getDocumentByType called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document type:', req.params.type);
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);

    const documentType = req.params.type as PlatformLegalDocumentType;
    const document = await platformLegalService.getPlatformLegalDocumentByType(documentType);

    if (!document) {
      console.log('[PLATFORM_LEGAL_CONTROLLER] No active document found for type');
      return sendError(res, 'No active document found for this type', 404);
    }

    console.log('[PLATFORM_LEGAL_CONTROLLER] Document found');
    sendSuccess(res, document);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] getDocumentByType failed:', error);
    next(error);
  }
};

/**
 * GET /api/admin/platform-legal/documents/type/:type/versions
 * Get all versions of a document type (admin only)
 */
export const getDocumentVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] getDocumentVersions called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document type:', req.params.type);
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);

    const documentType = req.params.type as PlatformLegalDocumentType;
    const versions = await platformLegalService.getPlatformLegalDocumentVersions(documentType);

    console.log('[PLATFORM_LEGAL_CONTROLLER] Returning', versions.length, 'versions');
    sendSuccess(res, versions);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] getDocumentVersions failed:', error);
    next(error);
  }
};

/**
 * POST /api/admin/platform-legal/documents
 * Create new platform legal document (admin only)
 */
export const createDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] createDocument called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);
    console.log('[PLATFORM_LEGAL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    if (!req.user?.id) {
      console.error('[PLATFORM_LEGAL_CONTROLLER] User ID missing');
      return sendError(res, 'User not authenticated', 401);
    }

    const document = await platformLegalService.createPlatformLegalDocument(
      req.user.id,
      req.body
    );

    console.log('[PLATFORM_LEGAL_CONTROLLER] Document created:', document.id);
    sendSuccess(res, document, 201);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] createDocument failed:', error);
    next(error);
  }
};

/**
 * PUT /api/admin/platform-legal/documents/:id
 * Update platform legal document (admin only)
 */
export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] updateDocument called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document ID:', req.params.id);
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);
    console.log('[PLATFORM_LEGAL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

    const document = await platformLegalService.updatePlatformLegalDocument(
      req.params.id,
      req.body
    );

    console.log('[PLATFORM_LEGAL_CONTROLLER] Document updated successfully');
    sendSuccess(res, document);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] updateDocument failed:', error);
    next(error);
  }
};

/**
 * PUT /api/admin/platform-legal/documents/:id/activate
 * Activate a document version (deactivates other versions) (admin only)
 */
export const activateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] activateDocument called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document ID:', req.params.id);
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);

    const document = await platformLegalService.activatePlatformLegalDocument(req.params.id);

    console.log('[PLATFORM_LEGAL_CONTROLLER] Document activated successfully');
    sendSuccess(res, document);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] activateDocument failed:', error);
    next(error);
  }
};

/**
 * DELETE /api/admin/platform-legal/documents/:id
 * Delete platform legal document (soft delete) (admin only)
 */
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] deleteDocument called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document ID:', req.params.id);
    console.log('[PLATFORM_LEGAL_CONTROLLER] User:', req.user?.id);

    await platformLegalService.deletePlatformLegalDocument(req.params.id);

    console.log('[PLATFORM_LEGAL_CONTROLLER] Document deleted successfully');
    sendSuccess(res, { message: 'Document deleted successfully' });
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] deleteDocument failed:', error);
    next(error);
  }
};

/**
 * GET /api/platform-legal/active/:type
 * Get active document by type (PUBLIC - no auth required)
 */
export const getActiveDocumentByType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== [PLATFORM_LEGAL_CONTROLLER] getActiveDocumentByType (PUBLIC) called ===');
    console.log('[PLATFORM_LEGAL_CONTROLLER] Document type:', req.params.type);

    const documentType = req.params.type as PlatformLegalDocumentType;
    const document = await platformLegalService.getPlatformLegalDocumentByType(documentType);

    if (!document) {
      console.log('[PLATFORM_LEGAL_CONTROLLER] No active document found');
      return sendError(res, 'No active document found for this type', 404);
    }

    console.log('[PLATFORM_LEGAL_CONTROLLER] Active document found');
    sendSuccess(res, document);
  } catch (error) {
    console.error('[PLATFORM_LEGAL_CONTROLLER] getActiveDocumentByType failed:', error);
    next(error);
  }
};
