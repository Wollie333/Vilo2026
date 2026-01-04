/**
 * Notification Preferences Controller
 * FEATURE-03: Notification System (User Preferences)
 *
 * HTTP request handlers for notification preference endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import * as preferencesService from '../services/notification-preferences.service';

// ============================================================================
// Get Preferences
// ============================================================================

/**
 * GET /api/notification-preferences
 * Get all notification preferences for current user, grouped by type
 */
export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await preferencesService.getUserPreferences(req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Update Preferences
// ============================================================================

/**
 * PATCH /api/notification-preferences
 * Toggle a single notification preference
 */
export const togglePreference = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { template_id, channel, enabled } = req.body;
    const preference = await preferencesService.togglePreference(
      req.user!.id,
      template_id,
      channel,
      enabled
    );
    sendSuccess(res, { preference, message: 'Preference updated successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notification-preferences/bulk
 * Bulk update multiple preferences
 */
export const bulkUpdatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { preferences } = req.body;
    const result = await preferencesService.bulkUpdatePreferences(
      req.user!.id,
      preferences
    );
    sendSuccess(res, {
      ...result,
      message: `Updated ${result.updated} preference(s)`,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// Reset Preferences
// ============================================================================

/**
 * DELETE /api/notification-preferences
 * Reset all preferences to defaults
 */
export const resetPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await preferencesService.resetPreferences(req.user!.id);
    sendSuccess(res, {
      ...result,
      message: 'Preferences reset to defaults',
    });
  } catch (error) {
    next(error);
  }
};
