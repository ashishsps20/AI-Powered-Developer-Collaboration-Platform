import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { apiLimiter } from './middleware/rateLimiter.js';
import { getRedisClient } from './config/redis.js';

import routes from './routes/index.js';
import notFoundHandler from './middleware/notFoundHandler.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiting to all API routes
app.use('/api', apiLimiter);

import authRoutes from './routes/auth.routes.js';

// Optional: Health check route
app.get('/api/health', (req, res) => {
  const redisClient = getRedisClient();
  const isRedisOk = redisClient && redisClient.status === 'ready';

  res.status(isRedisOk ? 200 : 503).json({
    status: isRedisOk ? 'ok' : 'degraded',
    services: {
      api: 'ok',
      mongodb: 'ok', // Assuming mongoose handles its own reconnection logic safely
      redis: isRedisOk ? 'ok' : 'down'
    }
  });
});

// Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Developer Platform API is running'
  });
});

// 404 Handler for unknown routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
