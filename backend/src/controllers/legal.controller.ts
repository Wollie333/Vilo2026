import { Request, Response, NextFunction } from 'express';
import { legalService } from '../services/legal.service';
import { propertyService } from '../services/property.service';
import { generateCancellationPolicyPDF } from '../services/pdf.service';
import { sendSuccess, sendError } from '../utils/response';
import type {
  CreateCancellationPolicyData,
  UpdateCancellationPolicyData,
} from '../types/legal.types';

// ============================================================================
// Legal Controller - Cancellation Policies
// ============================================================================

export const legalController = {
  // --------------------------------------------------------------------------
  // GET /api/legal/cancellation-policies
  // List all active cancellation policies (system defaults + user's custom policies)
  // --------------------------------------------------------------------------
  async getCancellationPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== [LEGAL_CONTROLLER] Get cancellation policies ===');
      console.log('[LEGAL_CONTROLLER] User:', (req as any).user?.id);

      // Check if admin wants to see all (including inactive)
      const includeInactive = req.query.includeInactive === 'true';

      const userId = (req as any).user?.id;

      const policies = includeInactive
        ? await legalService.getAllCancellationPolicies()
        : await legalService.getCancellationPolicies(userId);

      console.log('[LEGAL_CONTROLLER] Found', policies.length, 'policies');

      sendSuccess(res, policies);
    } catch (error) {
      console.error('[LEGAL_CONTROLLER] Failed to fetch policies:', error);
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/legal/cancellation-policies/:id
  // Get a single cancellation policy
  // --------------------------------------------------------------------------
  async getCancellationPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const policy = await legalService.getCancellationPolicyById(id);

      if (!policy) {
        sendError(res, 'NOT_FOUND', 'Cancellation policy not found', 404);
        return;
      }

      sendSuccess(res, policy);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // POST /api/legal/cancellation-policies
  // Create a new cancellation policy
  // --------------------------------------------------------------------------
  async createCancellationPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== [LEGAL_CONTROLLER] Create cancellation policy ===');
      console.log('[LEGAL_CONTROLLER] User:', (req as any).user?.id);
      console.log('[LEGAL_CONTROLLER] Body:', JSON.stringify(req.body, null, 2));

      const data: CreateCancellationPolicyData = req.body;

      // Validation
      if (!data.name || !data.name.trim()) {
        sendError(res, 'VALIDATION_ERROR', 'Policy name is required', 400);
        return;
      }

      if (!data.tiers || !Array.isArray(data.tiers) || data.tiers.length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'At least one tier is required', 400);
        return;
      }

      // Validate tier structure
      for (const tier of data.tiers) {
        if (typeof tier.days !== 'number' || tier.days < 0) {
          sendError(res, 'VALIDATION_ERROR', 'Each tier must have a valid days value (>= 0)', 400);
          return;
        }
        if (typeof tier.refund !== 'number' || tier.refund < 0 || tier.refund > 100) {
          sendError(res, 'VALIDATION_ERROR', 'Each tier must have a valid refund percentage (0-100)', 400);
          return;
        }
      }

      // Set ownership fields for user-created custom policies
      const policyData: CreateCancellationPolicyData = {
        ...data,
        created_by: (req as any).user?.id,
        is_custom: true,
        is_default: false, // User-created policies cannot be system defaults
      };

      console.log('[LEGAL_CONTROLLER] Creating policy with data:', JSON.stringify(policyData, null, 2));

      const policy = await legalService.createCancellationPolicy(policyData);

      console.log('[LEGAL_CONTROLLER] Policy created successfully:', policy.id);

      sendSuccess(res, policy, 201);
    } catch (error) {
      console.error('[LEGAL_CONTROLLER] Failed to create policy:', error);
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // PUT /api/legal/cancellation-policies/:id
  // Update a cancellation policy
  // --------------------------------------------------------------------------
  async updateCancellationPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== [LEGAL_CONTROLLER] Update cancellation policy ===');
      console.log('[LEGAL_CONTROLLER] User:', (req as any).user?.id);
      console.log('[LEGAL_CONTROLLER] Policy ID:', req.params.id);
      console.log('[LEGAL_CONTROLLER] Update data:', JSON.stringify(req.body, null, 2));

      const { id } = req.params;
      const data: UpdateCancellationPolicyData = req.body;

      // Check if policy exists
      const existing = await legalService.getCancellationPolicyById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Cancellation policy not found', 404);
        return;
      }

      console.log('[LEGAL_CONTROLLER] Existing policy:', {
        id: existing.id,
        is_custom: existing.is_custom,
        created_by: existing.created_by,
      });

      // Prevent non-admins from modifying system default policies
      // RLS will handle this, but we provide a better error message here
      if (!existing.is_custom) {
        sendError(res, 'VALIDATION_ERROR', 'Cannot modify system default policies', 403);
        return;
      }

      // Validate tiers if provided
      if (data.tiers) {
        if (!Array.isArray(data.tiers) || data.tiers.length === 0) {
          sendError(res, 'VALIDATION_ERROR', 'At least one tier is required', 400);
          return;
        }

        for (const tier of data.tiers) {
          if (typeof tier.days !== 'number' || tier.days < 0) {
            sendError(res, 'VALIDATION_ERROR', 'Each tier must have a valid days value (>= 0)', 400);
            return;
          }
          if (typeof tier.refund !== 'number' || tier.refund < 0 || tier.refund > 100) {
            sendError(res, 'VALIDATION_ERROR', 'Each tier must have a valid refund percentage (0-100)', 400);
            return;
          }
        }
      }

      const policy = await legalService.updateCancellationPolicy(id, data);

      console.log('[LEGAL_CONTROLLER] Policy updated successfully');

      sendSuccess(res, policy);
    } catch (error) {
      console.error('[LEGAL_CONTROLLER] Failed to update policy:', error);
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // DELETE /api/legal/cancellation-policies/:id
  // Delete (soft delete) a cancellation policy
  // --------------------------------------------------------------------------
  async deleteCancellationPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== [LEGAL_CONTROLLER] Delete cancellation policy ===');
      console.log('[LEGAL_CONTROLLER] User:', (req as any).user?.id);
      console.log('[LEGAL_CONTROLLER] Policy ID:', req.params.id);

      const { id } = req.params;

      // Check if policy exists
      const existing = await legalService.getCancellationPolicyById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Cancellation policy not found', 404);
        return;
      }

      console.log('[LEGAL_CONTROLLER] Existing policy:', {
        id: existing.id,
        is_custom: existing.is_custom,
        is_default: existing.is_default,
        created_by: existing.created_by,
      });

      // Prevent deleting system default policies
      if (existing.is_default || !existing.is_custom) {
        sendError(res, 'VALIDATION_ERROR', 'Cannot delete system default policies', 403);
        return;
      }

      await legalService.deleteCancellationPolicy(id);

      console.log('[LEGAL_CONTROLLER] Policy deleted successfully');

      res.status(204).send();
    } catch (error) {
      console.error('[LEGAL_CONTROLLER] Failed to delete policy:', error);
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // GET /api/legal/cancellation-policies/:id/pdf
  // Download cancellation policy as PDF
  // --------------------------------------------------------------------------
  async downloadCancellationPolicyPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('=== [LEGAL_CONTROLLER] Download cancellation policy PDF ===');
      console.log('[LEGAL_CONTROLLER] Policy ID:', req.params.id);

      const { id } = req.params;
      const propertyId = req.query.propertyId as string | undefined;

      // Get policy
      const policy = await legalService.getCancellationPolicyById(id);
      if (!policy) {
        sendError(res, 'NOT_FOUND', 'Cancellation policy not found', 404);
        return;
      }

      console.log('[LEGAL_CONTROLLER] Generating PDF for policy:', policy.name);

      // Get property name if propertyId provided
      let propertyName: string | undefined;
      if (propertyId) {
        try {
          const property = await propertyService.getProperty(propertyId);
          propertyName = property.name;
          console.log('[LEGAL_CONTROLLER] Property name:', propertyName);
        } catch (err) {
          console.warn('[LEGAL_CONTROLLER] Could not fetch property name:', err);
        }
      }

      // Generate PDF
      const pdfBuffer = await generateCancellationPolicyPDF(
        {
          name: policy.name,
          description: policy.description,
          tiers: policy.tiers,
        },
        propertyName
      );

      console.log('[LEGAL_CONTROLLER] PDF generated successfully, size:', pdfBuffer.length, 'bytes');

      // Set response headers
      const filename = `${policy.name.replace(/[^a-z0-9]/gi, '_')}_Policy.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[LEGAL_CONTROLLER] Failed to generate PDF:', error);
      next(error);
    }
  },
};
