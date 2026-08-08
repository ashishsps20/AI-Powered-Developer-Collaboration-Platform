import { Router } from 'express';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/auth', authRoutes);

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

export default router;
