import { Request, Response, NextFunction } from 'express';
import { legalService } from '../services/legal.service';
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
  // List all active cancellation policies
  // --------------------------------------------------------------------------
  async getCancellationPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check if admin wants to see all (including inactive)
      const includeInactive = req.query.includeInactive === 'true';

      const policies = includeInactive
        ? await legalService.getAllCancellationPolicies()
        : await legalService.getCancellationPolicies();

      sendSuccess(res, policies);
    } catch (error) {
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

      const policy = await legalService.createCancellationPolicy(data);

      sendSuccess(res, policy, 201);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // PUT /api/legal/cancellation-policies/:id
  // Update a cancellation policy
  // --------------------------------------------------------------------------
  async updateCancellationPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateCancellationPolicyData = req.body;

      // Check if policy exists
      const existing = await legalService.getCancellationPolicyById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Cancellation policy not found', 404);
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

      sendSuccess(res, policy);
    } catch (error) {
      next(error);
    }
  },

  // --------------------------------------------------------------------------
  // DELETE /api/legal/cancellation-policies/:id
  // Delete (soft delete) a cancellation policy
  // --------------------------------------------------------------------------
  async deleteCancellationPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check if policy exists
      const existing = await legalService.getCancellationPolicyById(id);
      if (!existing) {
        sendError(res, 'NOT_FOUND', 'Cancellation policy not found', 404);
        return;
      }

      // Prevent deleting default policies
      if (existing.is_default) {
        sendError(res, 'VALIDATION_ERROR', 'Cannot delete default policies', 400);
        return;
      }

      await legalService.deleteCancellationPolicy(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
