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
  }
};
