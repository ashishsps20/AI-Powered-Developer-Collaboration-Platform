import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Main redis client for caching and rate limiting
let redisClient = null;

export const initRedis = () => {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        // Retry connection with exponential backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    let errorLogged = false;

    redisClient.on('error', (err) => {
      if (!errorLogged) {
        console.error('Redis connection error (logging once):', err.message);
        errorLogged = true;
      }
    });
  }
  return redisClient;
};

export const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

// BullMQ usually prefers separate connections for publisher, subscriber, and bclient.
// However, to keep it simple, we can provide a helper to create new connections.
export const createRedisConnection = () => {
  const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      // Slower backoff for background connections
      return Math.min(times * 100, 3000);
    }
  });

  let connectionErrorLogged = false;
  connection.on('error', (err) => {
    if (!connectionErrorLogged) {
      console.error('Redis background connection error (logging once):', err.message);
      connectionErrorLogged = true;
    }
  });

  return connection;
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis client closed');
  }
};
