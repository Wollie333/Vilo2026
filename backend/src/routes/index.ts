import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import rolesRoutes from './roles.routes';
import billingRoutes from './billing.routes';
import notificationsRoutes from './notifications.routes';
import notificationPreferencesRoutes from './notification-preferences.routes';
import paymentRoutes from './payment.routes';
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
import addonRoutes from './addon.routes';
import roomRoutes, { propertyRoomRoutes } from './room.routes';
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

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/billing', billingRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/notification-preferences', notificationPreferencesRoutes);
router.use('/payment-integrations', paymentRoutes);
router.use('/companies', companyRoutes);
router.use('/', companyTeamRoutes); // NEW - Company team members (uses /companies/:id/team-members)
router.use('/properties', propertyRoutes);
router.use('/locations', locationRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/credit-notes', creditNoteRoutes);
router.use('/chat', chatRoutes);
router.use('/legal', legalRoutes);
router.use('/addons', addonRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analytics', analyticsRoutes); // Analytics endpoints (auth required)
router.use('/reviews', reviewRoutes);
router.use('/discovery', discoveryRoutes);  // Public property directory (no auth required)
router.use('/wishlist', wishlistRoutes);  // User wishlist/favorites (auth required)
router.use('/booking-wizard', bookingWizardRoutes);  // Guest booking wizard (no auth required)
router.use('/', globalPaymentRulesRouter);  // Centralized payment rules management
router.use('/', promotionsRoutes);  // Centralized promotions management
router.use('/', refundManagementRoutes);  // Comprehensive refund management (guest & admin)
router.use('/', creditMemoRoutes);  // Credit memo management

// Rooms & Bookings
router.use('/rooms', roomRoutes);
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
