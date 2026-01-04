/**
 * Notification Preferences Routes
 * FEATURE-03: Notification System (User Preferences)
 *
 * Route definitions for notification preference endpoints.
 */

import { Router } from 'express';
import * as preferencesController from '../controllers/notification-preferences.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
} from '../middleware';
import {
  togglePreferenceSchema,
  bulkUpdatePreferencesSchema,
} from '../validators/notification.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(loadUserProfile);

// ============================================================================
// Preference Management Routes
// ============================================================================

/**
 * GET /api/notification-preferences
 * Get all preferences for current user, grouped by notification type
 */
router.get('/', preferencesController.getPreferences);

/**
 * PATCH /api/notification-preferences
 * Toggle a single preference (template + channel + enabled)
 */
router.patch(
  '/',
  validateBody(togglePreferenceSchema),
  preferencesController.togglePreference
);

/**
 * PUT /api/notification-preferences/bulk
 * Bulk update multiple preferences at once
 */
router.put(
  '/bulk',
  validateBody(bulkUpdatePreferencesSchema),
  preferencesController.bulkUpdatePreferences
);

/**
 * DELETE /api/notification-preferences
 * Reset all preferences to defaults (delete custom preferences)
 */
router.delete('/', preferencesController.resetPreferences);

export default router;
