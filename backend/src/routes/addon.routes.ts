import { Router } from 'express';
import multer from 'multer';
import { addonController } from '../controllers/addon.controller';
import { authenticate, loadUserProfile } from '../middleware';

const router = Router();

// Configure multer for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============================================================================
// Add-on Routes
// ============================================================================

// --------------------------------------------------------------------------
// Read routes (authenticated users)
// --------------------------------------------------------------------------

// List all add-ons with filters
router.get(
  '/',
  authenticate,
  addonController.getAddOns
);

// Get a single add-on
router.get(
  '/:id',
  authenticate,
  addonController.getAddOn
);

// Calculate price for an add-on
router.post(
  '/:id/calculate-price',
  authenticate,
  addonController.calculatePrice
);

// --------------------------------------------------------------------------
// Write routes (authenticated users with user profile loaded)
// Property ownership validation happens in the service layer
// --------------------------------------------------------------------------

// Create a new add-on
router.post(
  '/',
  authenticate,
  loadUserProfile,
  addonController.createAddOn
);

// Update an add-on
router.put(
  '/:id',
  authenticate,
  loadUserProfile,
  addonController.updateAddOn
);

// Delete an add-on
router.delete(
  '/:id',
  authenticate,
  loadUserProfile,
  addonController.deleteAddOn
);

// --------------------------------------------------------------------------
// Image routes
// --------------------------------------------------------------------------

// Upload add-on image
router.post(
  '/:id/image',
  authenticate,
  loadUserProfile,
  imageUpload.single('image') as any,
  addonController.uploadImage
);

// Delete add-on image
router.delete(
  '/:id/image',
  authenticate,
  loadUserProfile,
  addonController.deleteImage
);

// --------------------------------------------------------------------------
// Room-Addon Assignment routes
// --------------------------------------------------------------------------

// Assign add-on to room
router.post(
  '/rooms/:roomId/assign',
  authenticate,
  loadUserProfile,
  addonController.assignToRoom
);

// Unassign add-on from room
router.delete(
  '/rooms/:roomId/unassign/:addonId',
  authenticate,
  loadUserProfile,
  addonController.unassignFromRoom
);

// Sync room add-ons (bulk replace)
router.post(
  '/rooms/:roomId/sync',
  authenticate,
  loadUserProfile,
  addonController.syncRoomAddons
);

export default router;
