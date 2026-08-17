import api from './api';

export const githubService = {
  getGithubOAuthUrl: async () => {
    const response = await api.get('/github/oauth');
    return response.data;
  },

  getRepositories: async () => {
    const response = await api.get('/github/repositories');
    return response.data;
  },

  connectRepository: async (orgId, projectId, repositoryId, owner, name) => {
    const response = await api.post(`/organizations/${orgId}/projects/${projectId}/github/repository`, {
      repositoryId,
      owner,
      name
    });
    return response.data;
  },

  disconnectRepository: async (orgId, projectId) => {
    const response = await api.delete(`/organizations/${orgId}/projects/${projectId}/github/repository`);
    return response.data;
  },

  getProjectRepositoryInfo: async (orgId, projectId) => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/github/repository`);
    return response.data;
  },

  getBranches: async (orgId, projectId) => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/github/branches`);
    return response.data;
  },

  getCommits: async (orgId, projectId, branch = 'main', page = 1, limit = 20) => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/github/commits`, {
      params: { branch, page, limit }
    });
    return response.data;
  },

  getPullRequests: async (orgId, projectId, state = 'all') => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/github/pull-requests`, {
      params: { state }
    });
    return response.data;
  },

  getIssues: async (orgId, projectId, state = 'all') => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/github/issues`, {
      params: { state }
    });
    return response.data;
  },

  // Module 11 Synchronization Endpoints
  getTaskGithubLinks: async (orgId, projectId, taskId) => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/github`);
    return response.data;
  },

  linkTaskPullRequest: async (orgId, projectId, taskId, pullRequestNumber) => {
    const response = await api.post(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/github/pull-request`, {
      pullRequestNumber
    });
    return response.data;
  },

  unlinkTaskPullRequest: async (orgId, projectId, taskId, pullRequestNumber) => {
    const response = await api.delete(`/organizations/${orgId}/projects/${projectId}/tasks/${taskId}/github/pull-request/${pullRequestNumber}`);
    return response.data;
  },

  getIssueGithubLink: async (orgId, projectId, issueId) => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/github`);
    return response.data;
  },

  linkIssueGithubIssue: async (orgId, projectId, issueId, issueNumber) => {
    const response = await api.post(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/github/issue`, {
      issueNumber
    });
    return response.data;
  },

  unlinkIssueGithubIssue: async (orgId, projectId, issueId, issueNumber) => {
    const response = await api.delete(`/organizations/${orgId}/projects/${projectId}/issues/${issueId}/github/issue/${issueNumber}`);
    return response.data;
  },

  getGithubSyncSettings: async (orgId, projectId) => {
    const response = await api.get(`/organizations/${orgId}/projects/${projectId}/github/settings`);
    return response.data;
  },

  updateGithubSyncSettings: async (orgId, projectId, settings) => {
    const response = await api.patch(`/organizations/${orgId}/projects/${projectId}/github/settings`, settings);
    return response.data;
  }
};
