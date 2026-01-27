import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import rolesRoutes from './roles.routes';
import billingRoutes from './billing.routes';
import adminSubscriptionRoutes from './admin-subscription.routes';
import adminEmailRoutes from './admin-email.routes';
import notificationsRoutes from './notifications.routes';
import notificationPreferencesRoutes from './notification-preferences.routes';
import paymentRoutes from './payment.routes';
import companyPaymentIntegrationRoutes from './company-payment-integration.routes';
import companyWhatsAppConfigRoutes from './company-whatsapp-config.routes';
import companyRoutes from './company.routes';
import companyTeamRoutes from './company-team.routes'; // NEW
import propertyRoutes from './property.routes';
import locationRoutes from './location.routes';
import checkoutRoutes from './checkout.routes';
import webhookRoutes from './webhook.routes';
import onboardingRoutes from './onboarding.routes';
import invoiceRoutes from './invoice.routes';
import chatRoutes from './chat.routes';
import legalRoutes from './legal.routes';
import platformLegalRoutes from './platform-legal.routes';
import addonRoutes from './addon.routes';
import roomRoutes, { propertyRoomRoutes, publicRoomRoutes } from './room.routes';
import bookingRoutes, { refundRoutes, propertyBookingRoutes } from './booking.routes';
import { globalPaymentRulesRouter, roomPaymentRulesRouter } from './payment-rules.routes';
import promotionsRoutes from './promotions.routes';
import creditNoteRoutes from './credit-note.routes';
import refundManagementRoutes from './refund.routes';
import creditMemoRoutes from './credit-memo.routes';
import dashboardRoutes from './dashboard.routes';
import reviewRoutes from './review.routes';
import discoveryRoutes from './discovery.routes';
import wishlistRoutes from './wishlist.routes';
import bookingWizardRoutes from './booking-wizard.routes';
import analyticsRoutes from './analytics.routes';
import customerRoutes from './customer.routes';
import whatsappRoutes from './whatsapp.routes';
import supportRoutes from './support.routes';
import uploadRoutes from './upload.routes';
import quoteRequestRoutes from './quote-request.routes';

const router = Router();

// ============================================================================
// DIRECT PUBLIC ROUTES (NO AUTH REQUIRED)
// ============================================================================
// These routes are defined BEFORE any other routes to ensure they're checked first
// and bypass any potential authentication middleware in the routers
import { promotionController } from '../controllers/promotion.controller';
import * as roomController from '../controllers/room.controller';
import { validateParams, validateBody } from '../middleware';
import {
  roomIdParamSchema,
  availabilityCheckSchema,
} from '../validators/room.validators';

// Promo Code Validation
router.post('/promotions/validate', (req, res, next) => {
  console.log('🎯 [INDEX.TS] Direct /promotions/validate route HIT - NO AUTH REQUIRED');
  console.log('🎯 [INDEX.TS] Method:', req.method);
  console.log('🎯 [INDEX.TS] Path:', req.path);
  console.log('🎯 [INDEX.TS] Body:', req.body);
  next();
}, promotionController.validatePromoCode);

// Room Availability Check (for guest bookings)
router.post('/rooms/:id/availability/public', (req, res, next) => {
  console.log('🔓 [INDEX.TS] Direct /rooms/:id/availability/public route HIT - NO AUTH REQUIRED');
  console.log('🔓 [INDEX.TS] Room ID:', req.params.id);
  console.log('🔓 [INDEX.TS] Check-in:', req.body.check_in);
  console.log('🔓 [INDEX.TS] Check-out:', req.body.check_out);
  next();
},
  validateParams(roomIdParamSchema),
  validateBody(availabilityCheckSchema),
  roomController.checkAvailability
);

// Mount routes
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/billing', billingRoutes);
// IMPORTANT: Mount platform-legal BEFORE /admin to prevent route conflicts
router.use('/', platformLegalRoutes); // Platform-level legal documents (includes /admin/platform-legal/* and public routes)

// CRITICAL: Mount /admin/email BEFORE /admin to prevent route conflicts
// More specific routes must come before less specific routes in Express
router.use('/admin/email', (req, _res, next) => {
  console.log('💌 [INDEX.TS] Request reached /admin/email:', req.path);
  next();
});
router.use('/admin/email', adminEmailRoutes); // Email template management (super admin only)

// Less specific /admin route comes AFTER more specific /admin/email
router.use('/admin', adminSubscriptionRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/notification-preferences', notificationPreferencesRoutes);
router.use('/payment-integrations', paymentRoutes);
router.use('/company-payment-integrations', companyPaymentIntegrationRoutes);
router.use('/company-whatsapp-config', companyWhatsAppConfigRoutes);
router.use('/companies', companyRoutes);
router.use('/', companyTeamRoutes); // NEW - Company team members (uses /companies/:id/team-members)
router.use('/customers', customerRoutes); // Customer CRM management
router.use('/properties', propertyRoutes);
router.use('/locations', locationRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/credit-notes', creditNoteRoutes);
router.use('/chat', chatRoutes);
router.use('/whatsapp', whatsappRoutes); // WhatsApp Business API integration
router.use('/support', supportRoutes); // Support ticket system
router.use('/legal', legalRoutes);
// Platform legal routes moved earlier to prevent /admin route conflict (see line 66)
router.use('/addons', addonRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes); // Analytics endpoints (auth required)
router.use('/reviews', reviewRoutes);
router.use('/discovery', discoveryRoutes);  // Public property directory (no auth required)
router.use('/wishlist', wishlistRoutes);  // User wishlist/favorites (auth required)
router.use('/booking-wizard', bookingWizardRoutes);  // Guest booking wizard (no auth required)
router.use('/quote-requests', quoteRequestRoutes);  // Quote request system (public + auth)
router.use('/', globalPaymentRulesRouter);  // Centralized payment rules management
router.use('/', promotionsRoutes);  // Centralized promotions management
router.use('/', refundManagementRoutes);  // Comprehensive refund management (guest & admin)
router.use('/', creditMemoRoutes);  // Credit memo management

// Rooms & Bookings
router.use('/rooms', (req, _res, next) => {
  console.log('🔍 [INDEX.TS] Checking PUBLIC room routes for:', req.method, req.path);
  next();
}, publicRoomRoutes);  // Public room routes (no auth required) - must come BEFORE authenticated routes

router.use('/rooms', (req, _res, next) => {
  console.log('🔒 [INDEX.TS] Checking AUTHENTICATED room routes for:', req.method, req.path);
  next();
}, roomRoutes);
router.use('/rooms', roomPaymentRulesRouter);  // Room-specific payment rules endpoints
router.use('/bookings', bookingRoutes);
router.use('/refunds', refundRoutes);

// Property-scoped routes for rooms, bookings, calendar
router.use('/properties/:propertyId', propertyRoomRoutes);
router.use('/properties/:propertyId', propertyBookingRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
