import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100000 : 1000, // Limit each IP to 10 login requests per window (1000 for tests)
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  }
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
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
