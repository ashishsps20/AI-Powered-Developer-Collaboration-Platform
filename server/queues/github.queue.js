import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

// We create a new connection specifically for BullMQ
let githubQueue;

export const initGithubQueue = () => {
  if (!githubQueue) {
    githubQueue = new Queue('github-webhook', {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: parseInt(process.env.BULLMQ_ATTEMPTS) || 3,
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.BULLMQ_BACKOFF_MS) || 1000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection
      }
    });

    let queueErrorLogged = false;
    githubQueue.on('error', (err) => {
      if (!queueErrorLogged) {
        console.error('BullMQ Queue connection error (logging once):', err.message);
        queueErrorLogged = true;
      }
    });
  }
  return githubQueue;
};

export const addGithubJob = async (jobName, payload) => {
  try {
    const queue = initGithubQueue();
    // Use deliveryId as jobId to enforce idempotency at the queue level
    const options = payload.deliveryId ? { jobId: payload.deliveryId } : {};
    await queue.add(jobName, payload, options);
    return true;
  } catch (error) {
    console.error(`Failed to add job to GitHub queue: ${error.message}`);
    return false;
  }
};
