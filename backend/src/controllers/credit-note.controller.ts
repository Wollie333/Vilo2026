/**
 * Credit Note Controller
 *
 * API endpoints for managing credit notes (refunds, cancellations, adjustments)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireAdmin, loadUserProfile } from '../middleware';
import * as creditNoteService from '../services/credit-note.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import type { CreateCreditNoteInput, CreditNoteListParams } from '../types/credit-note.types';

const router = Router();

/**
 * POST /api/credit-notes
 * Create a new credit note
 * Requires: Admin role
 */
router.post('/', authenticate, loadUserProfile, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateCreditNoteInput = req.body;
    const actorId = req.user!.id;

    // Validate required fields
    if (!input.invoice_id) {
      throw new AppError('VALIDATION_ERROR', 'invoice_id is required');
    }

    if (!input.credit_subtotal_cents) {
      throw new AppError('VALIDATION_ERROR', 'credit_subtotal_cents is required');
    }

    if (!input.reason) {
      throw new AppError('VALIDATION_ERROR', 'reason is required');
    }

    if (!input.credit_type) {
      throw new AppError('VALIDATION_ERROR', 'credit_type is required');
    }

    if (!input.line_items || !Array.isArray(input.line_items) || input.line_items.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'line_items are required');
    }

    // Create credit note
    const creditNote = await creditNoteService.createCreditNote(input, actorId);

    res.status(201).json(creditNote);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/credit-notes
 * List credit notes with filters and pagination
 * Requires: Admin role (can see all) or authenticated user (can see their own)
 */
router.get('/', authenticate, loadUserProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: CreditNoteListParams = {
      user_id: req.query.user_id as string,
      invoice_id: req.query.invoice_id as string,
      status: req.query.status as any,
      from_date: req.query.from_date as string,
      to_date: req.query.to_date as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
    };

    // If not admin, filter to user's own credit notes
    const isAdmin = req.userProfile?.roles?.some(r => ['admin', 'super_admin'].includes(r.name));
    if (!isAdmin) {
      params.user_id = req.user!.id;
    }

    const result = await creditNoteService.listCreditNotes(params);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/credit-notes/:id
 * Get a single credit note by ID
 * Requires: Authentication (owner or admin)
 */
router.get('/:id', authenticate, loadUserProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creditNoteId = req.params.id;

    const creditNote = await creditNoteService.getCreditNote(creditNoteId);

    // Check access: must be owner or admin
    const isAdmin = req.userProfile?.roles?.some(r => ['admin', 'super_admin'].includes(r.name));
    if (creditNote.user_id !== req.user!.id && !isAdmin) {
      throw new AppError('FORBIDDEN', 'You do not have access to this credit note');
    }

    res.json(creditNote);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/credit-notes/:id/download
 * Get credit note PDF download URL (signed URL)
 * Requires: Authentication (owner or admin)
 */
router.get('/:id/download', authenticate, loadUserProfile, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creditNoteId = req.params.id;

    const creditNote = await creditNoteService.getCreditNote(creditNoteId);

    // Check access: must be owner or admin
    const isAdmin = req.userProfile?.roles?.some(r => ['admin', 'super_admin'].includes(r.name));
    if (creditNote.user_id !== req.user!.id && !isAdmin) {
      throw new AppError('FORBIDDEN', 'You do not have access to this credit note');
    }

    const downloadUrl = await creditNoteService.getCreditNoteDownloadUrl(creditNoteId);

    res.json({ url: downloadUrl });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/credit-notes/:id/void
 * Void a credit note
 * Requires: Admin role
 */
router.post('/:id/void', authenticate, loadUserProfile, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creditNoteId = req.params.id;
    const actorId = req.user!.id;

    const creditNote = await creditNoteService.voidCreditNote(creditNoteId, actorId);

    res.json(creditNote);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/credit-notes/:id/regenerate-pdf
 * Regenerate credit note PDF
 * Requires: Admin role
 */
router.post('/:id/regenerate-pdf', authenticate, loadUserProfile, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creditNoteId = req.params.id;

    const pdfUrl = await creditNoteService.generateCreditNotePDF(creditNoteId);

    res.json({ pdf_url: pdfUrl });
  } catch (error) {
    next(error);
  }
});

export default router;
