import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import {
  authenticate,
  loadUserProfile,
  requireSuperAdmin,
  validateQuery,
} from '../middleware';
import { z } from 'zod';

const router = Router();

// Query validation schema
const auditListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.enum(['user', 'role', 'permission', 'property', 'session']).optional(),
  entityId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
  action: z.string().max(50).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// All routes require authentication and super admin
router.use(authenticate);
router.use(loadUserProfile);

// List audit logs - super admin only
router.get(
  '/',
  requireSuperAdmin(),
  validateQuery(auditListQuerySchema),
  auditController.listAuditLogs
);

export default router;
