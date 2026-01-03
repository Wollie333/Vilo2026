import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import {
  authenticate,
  loadUserProfile,
  validateBody,
  validateQuery,
} from '../middleware';
import {
  signUpSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validators';

const router = Router();

// Public routes
router.post('/signup', validateBody(signUpSchema), authController.signUp);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
router.get('/verify-email', validateQuery(verifyEmailSchema), authController.verifyEmail);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, loadUserProfile, authController.getMe);

export default router;
