import { getRedisClient } from '../config/redis.js';

class CacheService {
  constructor() {
    // We defer acquiring the client to when it's needed to allow init
  }

  get client() {
    return getRedisClient();
  }

  /**
   * Get a cached value
   * @param {string} key 
   * @returns {any} parsed JSON or null
   */
  async getCache(key) {
    try {
      if (this.client.status !== 'ready') return null;
      
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Cache GET error for key ${key}:`, error.message);
      return null; // Fallback gracefully
    }
  }

  /**
   * Set a cached value
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds Time to live in seconds
   */
  async setCache(key, value, ttlSeconds = 300) {
    try {
      if (this.client.status !== 'ready') return false;
      
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, 'EX', ttlSeconds);
      return true;
    } catch (error) {
      console.warn(`Cache SET error for key ${key}:`, error.message);
      return false; // Fallback gracefully
    }
  }

  /**
   * Delete a cached value
   * @param {string} key 
   */
  async deleteCache(key) {
    try {
      if (this.client.status !== 'ready') return false;
      
      await this.client.del(key);
      return true;
    } catch (error) {
      console.warn(`Cache DEL error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete cached values by pattern (e.g. "project:*")
   * Use with caution, can block Redis if too many keys
   * @param {string} pattern 
   */
  async deleteByPattern(pattern) {
    try {
      if (this.client.status !== 'ready') return false;
      
      const stream = this.client.scanStream({
        match: pattern,
        count: 100
      });

      return new Promise((resolve, reject) => {
        const pipeline = this.client.pipeline();
        
        stream.on('data', (keys) => {
          if (keys.length) {
            keys.forEach(key => pipeline.del(key));
          }
        });

        stream.on('end', () => {
          pipeline.exec((err) => {
            if (err) {
              console.warn(`Cache DEL pattern error for ${pattern}:`, err.message);
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
        
        stream.on('error', (err) => {
          console.warn(`Cache SCAN pattern error for ${pattern}:`, err.message);
          resolve(false);
        });
      });
    } catch (error) {
      console.warn(`Cache DEL pattern error for ${pattern}:`, error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key 
   */
  async exists(key) {
    try {
      if (this.client.status !== 'ready') return false;
      
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
