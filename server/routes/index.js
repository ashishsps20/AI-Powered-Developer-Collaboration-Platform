import express from 'express';
import authRoutes from './auth.routes.js';
import organizationRoutes from './organization.routes.js';
import { globalGithubRouter } from './github.routes.js';
import notificationRoutes from './notification.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/github', globalGithubRouter);
router.use('/notifications', notificationRoutes);

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    data: {
      service: 'developer-platform-api',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

export default router;
