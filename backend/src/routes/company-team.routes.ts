import { Router } from 'express';
import * as companyTeamController from '../controllers/company-team.controller';
import {
  authenticate,
  loadUserProfile,
  requirePermission,
} from '../middleware';

const router = Router();

// ============================================================================
// COMPANY TEAM MEMBER ROUTES
// ============================================================================

// List team members for a company
router.get(
  '/companies/:companyId/team-members',
  authenticate,
  loadUserProfile,
  requirePermission('users' as any, 'read'),
  companyTeamController.listTeamMembers
);

// Add team member to company
router.post(
  '/companies/:companyId/team-members',
  authenticate,
  loadUserProfile,
  requirePermission('users' as any, 'manage'),
  companyTeamController.addTeamMember
);

// Get team member details
router.get(
  '/companies/:companyId/team-members/:id',
  authenticate,
  loadUserProfile,
  requirePermission('users' as any, 'read'),
  companyTeamController.getTeamMember
);

// Update team member
router.patch(
  '/companies/:companyId/team-members/:id',
  authenticate,
  loadUserProfile,
  requirePermission('users' as any, 'manage'),
  companyTeamController.updateTeamMember
);

// Remove team member
router.delete(
  '/companies/:companyId/team-members/:id',
  authenticate,
  loadUserProfile,
  requirePermission('users' as any, 'manage'),
  companyTeamController.removeTeamMember
);

// ============================================================================
// USER'S COMPANY MEMBERSHIPS
// ============================================================================

// Get companies where current user is a team member
router.get(
  '/users/me/company-memberships',
  authenticate,
  loadUserProfile,
  companyTeamController.getMyCompanyMemberships
);

export default router;
