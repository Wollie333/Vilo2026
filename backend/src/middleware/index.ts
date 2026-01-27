// Authentication middleware
export {
  authenticate,
  optionalAuth,
  loadUserProfile,
} from './auth.middleware';

// Role-based access control
export {
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireManager,
  hasRole,
  isSuperAdmin,
  requirePropertyRole,
  requireOwnershipOrAdmin,
  requireCompanyOwnership,
} from './rbac.middleware';

// Permission checking
export {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requirePropertyPermission,
  hasPermission,
  checkPermissions,
  formatPermissionKey,
  type PermissionResource,
} from './permission.middleware';

// Request validation
export {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  commonSchemas,
} from './validate.middleware';

// Error handling
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from './errorHandler.middleware';

// Subscription access control
export {
  requireActiveSubscription,
  requireWriteAccess,
  checkTrialStatus,
  blockIfPaused,
  requireMinimumPlan,
} from './subscription-access.middleware';
