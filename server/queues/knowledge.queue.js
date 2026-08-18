import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

export const knowledgeQueue = new Queue('knowledgeProcessing', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
