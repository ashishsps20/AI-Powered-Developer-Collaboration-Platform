import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} from '../validation/auth.validation.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

export default router;
