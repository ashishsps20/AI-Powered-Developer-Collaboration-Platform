import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import { githubSyncService } from '../services/githubSync.service.js';

let githubWorker;

export const initGithubWorker = () => {
  if (!githubWorker) {
    githubWorker = new Worker('github-webhook', async (job) => {
      const { eventType, payload, projectId } = job.data;
      
      console.log(`Processing GitHub webhook job ${job.id} - ${eventType}`);
      
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found for GitHub webhook event');
      }

      // Handle specific events
      if (eventType === 'push') {
        const branch = payload.ref.replace('refs/heads/', '');
        const commitCount = payload.commits ? payload.commits.length : 0;
        
        await Activity.create({
          project: project._id,
          action: 'GITHUB_PUSH',
          entityType: 'GITHUB',
          entityId: project._id,
          metadata: {
            branch,
            commitCount,
            pusher: payload.pusher?.name || payload.sender?.login
          }
        });
      } 
      else if (eventType === 'pull_request') {
        const action = payload.action;
        let activityAction = 'GITHUB_PR_UPDATED';
        
        if (action === 'opened') activityAction = 'GITHUB_PR_OPENED';
        if (action === 'closed') activityAction = 'GITHUB_PR_CLOSED';
        if (action === 'reopened') activityAction = 'GITHUB_PR_REOPENED';
        
        await Activity.create({
          project: project._id,
          action: activityAction,
          entityType: 'GITHUB',
          entityId: project._id,
          metadata: {
            prNumber: payload.pull_request.number,
            title: payload.pull_request.title,
            url: payload.pull_request.html_url,
            sourceBranch: payload.pull_request.head.ref,
            targetBranch: payload.pull_request.base.ref,
            author: payload.sender?.login
          }
        });
        
        // Trigger Module 11 synchronization logic
        await githubSyncService.handlePullRequestSync(project, payload);
      }
      else if (eventType === 'issues') {
        const action = payload.action;
        let activityAction = 'GITHUB_ISSUE_UPDATED';
        
        if (action === 'opened') activityAction = 'GITHUB_ISSUE_OPENED';
        if (action === 'closed') activityAction = 'GITHUB_ISSUE_CLOSED';
        if (action === 'reopened') activityAction = 'GITHUB_ISSUE_REOPENED';
        
        await Activity.create({
          project: project._id,
          action: activityAction,
          entityType: 'GITHUB',
          entityId: project._id,
          metadata: {
            issueNumber: payload.issue.number,
            title: payload.issue.title,
            url: payload.issue.html_url,
            author: payload.sender?.login
          }
        });
        
        // Trigger Module 11 synchronization logic
        await githubSyncService.handleGithubIssueSync(project, payload);
      }
      else if (eventType === 'pull_request_review') {
        if (payload.action === 'submitted') {
          await Activity.create({
            project: project._id,
            action: 'GITHUB_PR_REVIEWED',
            entityType: 'GITHUB',
            entityId: project._id,
            metadata: {
              prNumber: payload.pull_request.number,
              reviewState: payload.review.state,
              reviewer: payload.sender?.login,
              url: payload.review.html_url
            }
          });
        }
      }
      
      return { success: true };
    }, {
      connection: createRedisConnection()
    });

    githubWorker.on('completed', (job) => {
      console.log(`GitHub webhook job ${job.id} completed successfully`);
    });

    githubWorker.on('failed', (job, err) => {
      console.error(`GitHub webhook job ${job?.id} failed:`, err.message);
    });

    let workerErrorLogged = false;
    githubWorker.on('error', (err) => {
      if (!workerErrorLogged) {
        console.error('BullMQ Worker connection error (logging once):', err.message);
        workerErrorLogged = true;
      }
    });
  }
  return githubWorker;
};

export const closeGithubWorker = async () => {
  if (githubWorker) {
    await githubWorker.close();
    console.log('GitHub worker closed');
  }
};
