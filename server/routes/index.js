import express from 'express';
const router = express.Router();

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
