import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'active', 'suspended', 'deactivated']).optional(),
  roleId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['created_at', 'email', 'full_name']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  avatar_url: z.string().url().optional().nullable(),
  timezone: z.string().max(100).optional(),
  address_street: z.string().max(255).optional().nullable(),
  address_city: z.string().max(100).optional().nullable(),
  address_state: z.string().max(100).optional().nullable(),
  address_postal_code: z.string().max(20).optional().nullable(),
  address_country: z.string().max(100).optional().nullable(),
  company_name: z.string().max(255).optional().nullable(),
  vat_number: z.string().max(20).optional().nullable(),
  company_registration: z.string().max(20).optional().nullable(),
  preferences: z.record(z.unknown()).optional(),
});

export const approveUserSchema = z.object({
  defaultRole: z.string().default('readonly'),
  propertyIds: z.array(z.string().uuid()).optional(),
});

export const assignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role is required'),
  propertyId: z.string().uuid().optional(),
  replaceExisting: z.boolean().default(false),
});

export const assignPermissionsSchema = z.object({
  permissions: z.array(z.object({
    permissionId: z.string().uuid(),
    overrideType: z.enum(['grant', 'deny']),
    propertyId: z.string().uuid().optional(),
    expiresAt: z.string().datetime().optional(),
    reason: z.string().max(500).optional(),
  })).min(1, 'At least one permission is required'),
  replaceExisting: z.boolean().default(false),
});

export const assignPropertiesSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(1, 'At least one property is required'),
  replaceExisting: z.boolean().default(false),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required').max(255),
  phone: z.string().max(50).optional(),
  status: z.enum(['active', 'pending']).default('active'),
  roleIds: z.array(z.string().uuid()).optional(),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ApproveUserInput = z.infer<typeof approveUserSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type AssignPropertiesInput = z.infer<typeof assignPropertiesSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
