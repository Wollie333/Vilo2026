import { Router } from 'express';
import { z } from 'zod';
import * as rolesController from '../controllers/roles.controller';
import {
  authenticate,
  loadUserProfile,
  requirePermission,
  requireSuperAdmin,
  validateBody,
  validateParams,
} from '../middleware';

const router = Router();

// Validation schemas
const roleIdParamSchema = z.object({
  id: z.string().uuid('Invalid role ID'),
});

const createRoleSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z_]+$/, 'Name must be lowercase with underscores only'),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(1).max(999).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(1).max(999).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// List all roles - requires roles:read
router.get('/', requirePermission('roles', 'read'), rolesController.listRoles);

// List all permissions - requires roles:read
router.get(
  '/permissions',
  requirePermission('roles', 'read'),
  rolesController.listPermissions
);

// Get permissions grouped by resource - requires roles:read
router.get(
  '/permissions/grouped',
  requirePermission('roles', 'read'),
  rolesController.getPermissionsByResource
);

// Get single role - requires roles:read
router.get(
  '/:id',
  validateParams(roleIdParamSchema),
  requirePermission('roles', 'read'),
  rolesController.getRole
);

// Create role - super admin only
router.post(
  '/',
  validateBody(createRoleSchema),
  requireSuperAdmin(),
  rolesController.createRole
);

// Update role - super admin only
router.patch(
  '/:id',
  validateParams(roleIdParamSchema),
  validateBody(updateRoleSchema),
  requireSuperAdmin(),
  rolesController.updateRole
);

// Delete role - super admin only
router.delete(
  '/:id',
  validateParams(roleIdParamSchema),
  requireSuperAdmin(),
  rolesController.deleteRole
);

export default router;
