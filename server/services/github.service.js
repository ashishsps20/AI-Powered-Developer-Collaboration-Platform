import GitHubConnection from '../models/GitHubConnection.js';
import { decrypt } from '../utils/encryption.js';

class GitHubService {
  get clientId() { return process.env.GITHUB_CLIENT_ID; }
  get clientSecret() { return process.env.GITHUB_CLIENT_SECRET; }
  get callbackUrl() { return process.env.GITHUB_CALLBACK_URL; }

  async exchangeCodeForToken(code) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.callbackUrl,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }
    return data.access_token;
  }

  async getAuthenticatedUser(token) {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user from GitHub');
    }
    return response.json();
  }

  async _getDecryptedToken(userId) {
    const connection = await GitHubConnection.findOne({ user: userId });
    if (!connection) {
      throw new Error('GitHub connection not found');
    }
    return decrypt(connection.accessTokenEncrypted);
  }

  async getRepositories(userId) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch repositories');
    return response.json();
  }

  async getRepository(userId, owner, repo) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch repository');
    return response.json();
  }

  async getBranches(userId, owner, repo) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch branches');
    return response.json();
  }

  async getCommits(userId, owner, repo, branch = 'main', page = 1, limit = 20) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}&page=${page}&per_page=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch commits');
    return response.json();
  }

  async getPullRequests(userId, owner, repo, state = 'all') {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&sort=updated&direction=desc`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch pull requests');
    return response.json();
  }

  async getPullRequest(userId, owner, repo, pullNumber) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch pull request');
    return response.json();
  }

  async getIssue(userId, owner, repo, issueNumber) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch issue');
    return response.json();
  }

  async getIssues(userId, owner, repo, state = 'all') {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&sort=updated&direction=desc`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch issues');
    const issues = await response.json();
    // GitHub API returns PRs as issues too, we should filter them out
    return issues.filter(issue => !issue.pull_request);
  }

  async createWebhook(userId, owner, repo, webhookUrl, secret) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'pull_request', 'issues', 'pull_request_review'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret,
          insecure_ssl: '0'
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Ignore if hook already exists
      if (errorData.errors && errorData.errors.some(e => e.message && e.message.includes('already exists'))) {
        return;
      }
      throw new Error('Failed to create webhook');
    }
    return response.json();
  }

  async deleteWebhook(userId, owner, repo, hookId) {
    const token = await this._getDecryptedToken(userId);
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks/${hookId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete webhook');
    }
  }
}

export const githubService = new GitHubService();
