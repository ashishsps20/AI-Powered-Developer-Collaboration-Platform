import api from './api';

export const commentService = {
  createComment: async (organizationId, projectId, data) => {
    const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/comments`, data);
    return response.data;
  },

  getComments: async (organizationId, projectId, entityType, entityId, page = 1, limit = 20) => {
    const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/comments`, {
      params: { entityType, entityId, page, limit }
    });
    return response.data;
  },

  updateComment: async (organizationId, projectId, commentId, content) => {
    const response = await api.patch(`/organizations/${organizationId}/projects/${projectId}/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (organizationId, projectId, commentId) => {
    const response = await api.delete(`/organizations/${organizationId}/projects/${projectId}/comments/${commentId}`);
    return response.data;
  }
};
