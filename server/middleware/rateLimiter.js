import { rateLimit, MemoryStore, ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';

// Fallback memory store when Redis is unavailable
const memoryStore = new MemoryStore();

const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
      // Use user ID if authenticated, else use IP
      return req.user ? req.user.id : ipKeyGenerator(req, res);
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    },
    store: {
      // We implement a custom adapter to fallback gracefully to memory if Redis is down
      async increment(key) {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
          // Initialize a temporary RedisStore instance just to process this request
          // (In a real app you'd instantiate the store once, but we need graceful failover dynamically)
          const redisStore = new RedisStore({
            sendCommand: (...args) => client.call(...args),
            prefix: `rate-limit:${options.prefix || 'api'}:`
          });
          return redisStore.increment(key);
        } else {
          // Fallback to memory
          return memoryStore.increment(key);
        }
      },
      async decrement(key) {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
          const redisStore = new RedisStore({
            sendCommand: (...args) => client.call(...args),
            prefix: `rate-limit:${options.prefix || 'api'}:`
          });
          return redisStore.decrement(key);
        } else {
          return memoryStore.decrement(key);
        }
      },
      async resetKey(key) {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
          const redisStore = new RedisStore({
            sendCommand: (...args) => client.call(...args),
            prefix: `rate-limit:${options.prefix || 'api'}:`
          });
          return redisStore.resetKey(key);
        } else {
          return memoryStore.resetKey(key);
        }
      }
    }
  });
};

export const apiLimiter = createLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  prefix: 'general'
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  prefix: 'auth'
});

export const githubProxyLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.GITHUB_RATE_LIMIT_MAX) || 30,
  prefix: 'github'
});
