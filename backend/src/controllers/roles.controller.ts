import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as rolesService from '../services/roles.service';

/**
 * GET /api/roles
 * List all roles
 */
export const listRoles = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roles = await rolesService.listRoles();
    sendSuccess(res, { roles });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roles/permissions
 * List all permissions
 */
export const listPermissions = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await rolesService.listPermissions();
    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roles/permissions/grouped
 * Get permissions grouped by resource
 */
export const getPermissionsByResource = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const permissions = await rolesService.getPermissionsByResource();
    sendSuccess(res, { permissions });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roles/:id
 * Get single role by ID
 */
export const getRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = await rolesService.getRole(req.params.id);
    sendSuccess(res, { role });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roles
 * Create a new role
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = await rolesService.createRole(req.body, req.user!.id);
    sendSuccess(res, { role, message: 'Role created successfully' }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/roles/:id
 * Update an existing role
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = await rolesService.updateRole(
      req.params.id,
      req.body,
      req.user!.id
    );
    sendSuccess(res, { role, message: 'Role updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await rolesService.deleteRole(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
};
