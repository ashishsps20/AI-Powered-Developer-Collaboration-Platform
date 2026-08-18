import api from './api';

export const createConversation = async (organizationId, projectId, title) => {
  const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/ai/conversations`, { title });
  return response.data;
};

export const getConversations = async (organizationId, projectId) => {
  const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/ai/conversations`);
  return response.data;
};

export const getMessages = async (organizationId, projectId, conversationId, skip = 0, limit = 50) => {
  const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/ai/conversations/${conversationId}/messages`, {
    params: { skip, limit }
  });
  return response.data;
};

export const chat = async (organizationId, projectId, conversationId, message) => {
  const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/ai/chat`, {
    conversationId,
    message
  });
  return response.data;
};

export const deleteConversation = async (organizationId, projectId, conversationId) => {
  const response = await api.delete(`/organizations/${organizationId}/projects/${projectId}/ai/conversations/${conversationId}`);
  return response.data;
};
