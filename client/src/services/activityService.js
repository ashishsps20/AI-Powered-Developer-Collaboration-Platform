import api from './api';

export const activityService = {
  getProjectActivity: async (organizationId, projectId, page = 1, limit = 20) => {
    const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/activity`, {
      params: { page, limit }
    });
    return response.data;
  }
};
