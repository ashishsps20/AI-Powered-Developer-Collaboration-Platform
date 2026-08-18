import express from 'express';
import authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/logout', authController.logout);

// Temporary test route for verifying middleware
router.get('/protected-test', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    data: {
      userId: req.user.id
    }
  });
});

export default router;
