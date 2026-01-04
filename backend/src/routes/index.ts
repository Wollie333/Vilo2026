import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import rolesRoutes from './roles.routes';
import auditRoutes from './audit.routes';
import billingRoutes from './billing.routes';
import notificationsRoutes from './notifications.routes';
import notificationPreferencesRoutes from './notification-preferences.routes';
import paymentRoutes from './payment.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/roles', rolesRoutes);
router.use('/audit', auditRoutes);
router.use('/billing', billingRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/notification-preferences', notificationPreferencesRoutes);
router.use('/payment-integrations', paymentRoutes);

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
