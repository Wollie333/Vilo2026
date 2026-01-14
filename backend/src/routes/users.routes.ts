import { Router, RequestHandler } from 'express';
import multer from 'multer';
import * as usersController from '../controllers/users.controller';
import {
  authenticate,
  loadUserProfile,
  requirePermission,
  requireSuperAdmin,
  requireOwnershipOrAdmin,
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware';
import {
  userIdParamSchema,
  userListQuerySchema,
  updateUserSchema,
  approveUserSchema,
  assignRolesSchema,
  assignPermissionsSchema,
  assignPropertiesSchema,
  createUserSchema,
} from '../validators/user.validators';

// Configure multer for avatar uploads
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// Create user - super admin only
router.post(
  '/',
  validateBody(createUserSchema),
  requireSuperAdmin(),
  usersController.createUser
);

// List users - requires users:read permission
router.get(
  '/',
  requirePermission('users', 'read'),
  validateQuery(userListQuerySchema),
  usersController.listUsers
);

// Get single user - requires users:read or own profile
router.get(
  '/:id',
  validateParams(userIdParamSchema),
  requireOwnershipOrAdmin((req) => req.params.id),
  usersController.getUser
);

// Update user - requires users:update or own profile
router.patch(
  '/:id',
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  requireOwnershipOrAdmin((req) => req.params.id),
  usersController.updateUser
);

// Hard delete user (permanent) - requires users:delete
// IMPORTANT: This must come BEFORE the generic /:id route
router.delete(
  '/:id/hard',
  validateParams(userIdParamSchema),
  requirePermission('users', 'delete'),
  usersController.hardDeleteUser
);

// Delete user (soft delete) - requires users:delete
router.delete(
  '/:id',
  validateParams(userIdParamSchema),
  requirePermission('users', 'delete'),
  usersController.deleteUser
);

// Approve user - requires users:manage
router.post(
  '/:id/approve',
  validateParams(userIdParamSchema),
  validateBody(approveUserSchema),
  requirePermission('users', 'manage'),
  usersController.approveUser
);

// Assign roles - super admin only
router.post(
  '/:id/roles',
  validateParams(userIdParamSchema),
  validateBody(assignRolesSchema),
  requireSuperAdmin(),
  usersController.assignRoles
);

// Assign permissions - super admin only
router.post(
  '/:id/permissions',
  validateParams(userIdParamSchema),
  validateBody(assignPermissionsSchema),
  requireSuperAdmin(),
  usersController.assignPermissions
);

// Assign properties - requires users:manage
router.post(
  '/:id/properties',
  validateParams(userIdParamSchema),
  validateBody(assignPropertiesSchema),
  requirePermission('users', 'manage'),
  usersController.assignProperties
);

// Suspend user - requires users:manage
router.post(
  '/:id/suspend',
  validateParams(userIdParamSchema),
  requirePermission('users', 'manage'),
  usersController.suspendUser
);

// Reactivate user - requires users:manage
router.post(
  '/:id/reactivate',
  validateParams(userIdParamSchema),
  requirePermission('users', 'manage'),
  usersController.reactivateUser
);

// Upload avatar - requires ownership or admin
router.post(
  '/:id/avatar',
  validateParams(userIdParamSchema),
  requireOwnershipOrAdmin((req) => req.params.id),
  avatarUpload.single('avatar') as unknown as RequestHandler,
  usersController.uploadAvatar
);

export default router;
