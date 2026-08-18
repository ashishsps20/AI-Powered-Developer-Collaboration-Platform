import { rateLimit, MemoryStore, ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';

// Rate limiters

const createLimiter = (options) => {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  
  return rateLimit({
    windowMs,
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
      init(initOptions) {
        this.memoryStore = new MemoryStore();
        this.memoryStore.init(initOptions);
        
        this.redisStore = new RedisStore({
          sendCommand: (...args) => {
            const client = getRedisClient();
            if (client) return client.call(...args);
            throw new Error('Redis client unavailable');
          },
          prefix: `rate-limit:${options.prefix || 'api'}:`
        });
        this.redisStore.init(initOptions);
      },
      async increment(key) {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
          return this.redisStore.increment(key);
        } else {
          return this.memoryStore.increment(key);
        }
      },
      async decrement(key) {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
          return this.redisStore.decrement(key);
        } else {
          return this.memoryStore.decrement(key);
        }
      },
      async resetKey(key) {
        const client = getRedisClient();
        if (client && client.status === 'ready') {
          return this.redisStore.resetKey(key);
        } else {
          return this.memoryStore.resetKey(key);
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
