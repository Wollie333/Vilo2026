import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { companyTeamService } from '../services';
import { AppError } from '../utils/errors';

// ============================================================================
// COMPANY TEAM MEMBERS
// ============================================================================

/**
 * GET /api/companies/:companyId/team-members
 * List team members for a company
 */
export const listTeamMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const teamMembers = await companyTeamService.listCompanyTeamMembers(companyId);
    sendSuccess(res, { team_members: teamMembers });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/companies/:companyId/team-members
 * Add team member to company
 */
export const addTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { companyId } = req.params;
    const input = {
      company_id: companyId,
      ...req.body,
    };

    const teamMember = await companyTeamService.addTeamMember(input, req.user!.id);

    sendSuccess(res, {
      team_member: teamMember,
      message: 'Team member added successfully'
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/companies/:companyId/team-members/:id
 * Get team member details
 */
export const getTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const teamMember = await companyTeamService.getTeamMember(id);
    sendSuccess(res, { team_member: teamMember });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/:companyId/team-members/:id
 * Update team member
 */
export const updateTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const teamMember = await companyTeamService.updateTeamMember(
      id,
      req.body,
      req.user!.id
    );

    sendSuccess(res, {
      team_member: teamMember,
      message: 'Team member updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/companies/:companyId/team-members/:id
 * Remove team member from company
 */
export const removeTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await companyTeamService.removeTeamMember(id, req.user!.id);

    sendSuccess(res, {
      message: 'Team member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/me/company-memberships
 * Get companies where current user is a team member
 */
export const getMyCompanyMemberships = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const memberships = await companyTeamService.getUserCompanyMemberships(req.user!.id);
    sendSuccess(res, { memberships });
  } catch (error) {
    next(error);
  }
};
