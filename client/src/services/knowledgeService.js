import api from './api';

export const getDocuments = async (organizationId, projectId) => {
  const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/knowledge/documents`);
  return response.data.data;
};

export const getDocument = async (organizationId, projectId, documentId) => {
  const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/knowledge/documents/${documentId}`);
  return response.data.data;
};

export const createManualDocument = async (organizationId, projectId, data) => {
  const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/knowledge/documents/manual`, data);
  return response.data.data;
};

export const uploadDocument = async (organizationId, projectId, formData) => {
  const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/knowledge/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

export const reprocessDocument = async (organizationId, projectId, documentId) => {
  const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/knowledge/documents/${documentId}/reprocess`);
  return response.data.data;
};

export const deleteDocument = async (organizationId, projectId, documentId) => {
  const response = await api.delete(`/organizations/${organizationId}/projects/${projectId}/knowledge/documents/${documentId}`);
  return response.data; // delete doesn't return data, just message
};

export const searchKnowledge = async (organizationId, projectId, query, limit = 5) => {
  const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/knowledge/search`, { query, limit });
  return response.data.data;
};
