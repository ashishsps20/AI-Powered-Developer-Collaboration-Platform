import api from './api';

export const issueService = {
  getIssues: async (organizationId, projectId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters.type && filters.type !== 'All') params.append('type', filters.type);
    if (filters.assignee && filters.assignee !== 'All') params.append('assignedTo', filters.assignee);

    const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/issues`, { params });
    return response.data.data.issues;
  },

  createIssue: async (organizationId, projectId, data) => {
    const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/issues`, data);
    return response.data.data.issue;
  },

  updateIssue: async (organizationId, projectId, issueId, data) => {
    const response = await api.patch(`/organizations/${organizationId}/projects/${projectId}/issues/${issueId}`, data);
    return response.data.data.issue;
  },

  deleteIssue: async (organizationId, projectId, issueId) => {
    const response = await api.delete(`/organizations/${organizationId}/projects/${projectId}/issues/${issueId}`);
    return response.data;
  },
};
