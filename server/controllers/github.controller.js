import crypto from 'crypto';
import GitHubConnection from '../models/GitHubConnection.js';
import WebhookEvent from '../models/WebhookEvent.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import { githubService } from '../services/github.service.js';
import { encrypt } from '../utils/encryption.js';

class GitHubController {
  
  // ==========================================
  // OAUTH FLOW
  // ==========================================

  async getOAuthUrl(req, res, next) {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const callbackUrl = process.env.GITHUB_CALLBACK_URL;
      
      // Generate a state to prevent CSRF
      const state = crypto.randomBytes(16).toString('hex');
      
      // In a production app, we would save this state to the user's session or a cache
      // Here, we can send it to the frontend or embed it in a signed cookie
      res.cookie('github_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });

      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo,read:user,user:email&state=${state}`;

      res.status(200).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }

  async oauthCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      
      // Verify state
      const savedState = req.cookies.github_oauth_state;
      if (!state || state !== savedState) {
        return res.status(403).json({ success: false, message: 'Invalid state parameter' });
      }

      // Exchange code for token
      const token = await githubService.exchangeCodeForToken(code);
      
      // Fetch user profile
      const githubUser = await githubService.getAuthenticatedUser(token);
      
      // Encrypt token
      const encryptedToken = encrypt(token);
      
      // Save or update connection
      await GitHubConnection.findOneAndUpdate(
        { user: req.user.id },
        {
          githubUserId: String(githubUser.id),
          githubUsername: githubUser.login,
          githubAvatarUrl: githubUser.avatar_url,
          accessTokenEncrypted: encryptedToken,
          scopes: ['repo', 'read:user', 'user:email']
        },
        { upsert: true, new: true }
      );
      
      // Clear state cookie
      res.clearCookie('github_oauth_state');
      
      // Redirect to frontend (adjust URL as needed)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/settings/integrations?success=true`);
    } catch (error) {
      console.error('OAuth Callback Error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/settings/integrations?error=oauth_failed`);
    }
  }

  // ==========================================
  // REPOSITORY MANAGEMENT
  // ==========================================

  async getRepositories(req, res, next) {
    try {
      const repos = await githubService.getRepositories(req.user.id);
      
      const formattedRepos = repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch
      }));

      res.status(200).json({ success: true, data: { repositories: formattedRepos } });
    } catch (error) {
      next(error);
    }
  }

  async connectRepository(req, res, next) {
    try {
      const { projectId } = req.params;
      const { repositoryId, owner, name } = req.body;

      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

      // Fetch repo details directly from GitHub to ensure access and metadata
      const repoDetails = await githubService.getRepository(req.user.id, owner, name);
      
      project.githubRepository = {
        githubRepositoryId: repoDetails.id,
        owner: repoDetails.owner.login,
        name: repoDetails.name,
        fullName: repoDetails.full_name,
        htmlUrl: repoDetails.html_url,
        defaultBranch: repoDetails.default_branch,
        private: repoDetails.private
      };
      
      // Attempt to create webhook
      const webhookUrl = `${process.env.BACKEND_URL || 'https://example.com'}/api/github/webhook`;
      const webhookSecret = process.env.WEBHOOK_SECRET;
      
      try {
        await githubService.createWebhook(req.user.id, owner, name, webhookUrl, webhookSecret);
      } catch (hookErr) {
        console.warn('Failed to create webhook. Might already exist or lack admin rights:', hookErr.message);
      }

      await project.save();

      // Log activity
      await Activity.create({
        project: project._id,
        actor: req.user.id,
        action: 'GITHUB_REPOSITORY_CONNECTED',
        entityType: 'GITHUB',
        entityId: project._id,
        metadata: { repository: repoDetails.full_name }
      });

      res.status(200).json({ success: true, data: { project } });
    } catch (error) {
      next(error);
    }
  }

  async disconnectRepository(req, res, next) {
    try {
      const { projectId } = req.params;
      
      const project = await Project.findById(projectId);
      if (!project || !project.githubRepository) {
        return res.status(404).json({ success: false, message: 'Repository not connected' });
      }

      // We won't strictly enforce webhook deletion here to avoid locking disconnect if token is invalid
      project.githubRepository = null;
      await project.save();

      await Activity.create({
        project: project._id,
        actor: req.user.id,
        action: 'GITHUB_REPOSITORY_DISCONNECTED',
        entityType: 'GITHUB',
        entityId: project._id
      });

      res.status(200).json({ success: true, message: 'Repository disconnected' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // DATA FETCHING (PROXY TO GITHUB API)
  // ==========================================

  async getProjectRepositoryInfo(req, res, next) {
    try {
      const project = await Project.findById(req.params.projectId);
      if (!project || !project.githubRepository) {
        return res.status(404).json({ success: false, message: 'No GitHub repository connected' });
      }
      res.status(200).json({ success: true, data: { repository: project.githubRepository } });
    } catch (error) {
      next(error);
    }
  }

  async getBranches(req, res, next) {
    try {
      const project = await Project.findById(req.params.projectId);
      const repo = project.githubRepository;
      const branches = await githubService.getBranches(req.user.id, repo.owner, repo.name);
      
      const formatted = branches.map(b => ({ name: b.name, protected: b.protected, sha: b.commit.sha }));
      res.status(200).json({ success: true, data: { branches: formatted } });
    } catch (error) {
      next(error);
    }
  }

  async getCommits(req, res, next) {
    try {
      const { branch = 'main', page = 1, limit = 20 } = req.query;
      const project = await Project.findById(req.params.projectId);
      const repo = project.githubRepository;
      
      const commits = await githubService.getCommits(req.user.id, repo.owner, repo.name, branch, page, limit);
      
      const formatted = commits.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url
      }));

      res.status(200).json({ success: true, data: { commits: formatted } });
    } catch (error) {
      next(error);
    }
  }

  async getPullRequests(req, res, next) {
    try {
      const { state = 'all' } = req.query;
      const project = await Project.findById(req.params.projectId);
      const repo = project.githubRepository;
      
      const prs = await githubService.getPullRequests(req.user.id, repo.owner, repo.name, state);
      
      const formatted = prs.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user.login,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        htmlUrl: pr.html_url,
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref
      }));

      res.status(200).json({ success: true, data: { pullRequests: formatted } });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // WEBHOOK HANDLER
  // ==========================================

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-hub-signature-256'];
      const deliveryId = req.headers['x-github-delivery'];
      const eventType = req.headers['x-github-event'];

      if (!signature || !deliveryId || !eventType) {
        return res.status(400).send('Missing headers');
      }

      // Verify signature
      // Assuming req.rawBody is available (needs express config for application/json to save raw body)
      const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
      // NOTE: In Express, we need a custom body parser to keep rawBody.
      // If rawBody isn't available, JSON.stringify(req.body) is a fallback, but unsafe.
      const digest = 'sha256=' + hmac.update(req.rawBody || JSON.stringify(req.body)).digest('hex');
      
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        return res.status(401).send('Invalid signature');
      }

      // Check idempotency
      try {
        await WebhookEvent.create({ deliveryId, eventType });
      } catch (err) {
        if (err.code === 11000) {
          // Already processed
          return res.status(200).send('Already processed');
        }
        throw err;
      }

      const payload = req.body;
      const repoId = payload.repository?.id;

      if (!repoId) {
        return res.status(200).send('No repository ID');
      }

      // Find project associated with this repo
      const project = await Project.findOne({ 'githubRepository.githubRepositoryId': repoId });
      
      if (!project) {
        return res.status(200).send('Project not connected');
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

      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).send('Internal Error');
    }
  }
}

export const githubController = new GitHubController();
