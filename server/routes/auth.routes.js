import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  }
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);

export default router;
