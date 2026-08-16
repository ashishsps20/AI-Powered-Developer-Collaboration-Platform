import api from './api';

const projectService = {
  getProjects: async (organizationId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/projects`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  createProject: async (organizationId, data) => {
    try {
      const response = await api.post(`/organizations/${organizationId}/projects`, data);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  getProject: async (organizationId, projectId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/projects/${projectId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  getProjectMembers: async (organizationId, projectId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/members`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  addProjectMember: async (organizationId, projectId, data) => {
    try {
      const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/members`, data);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  removeProjectMember: async (organizationId, projectId, userId) => {
    try {
      const response = await api.delete(`/organizations/${organizationId}/projects/${projectId}/members/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  reassignProjectManager: async (organizationId, projectId, userId) => {
    try {
      const response = await api.patch(`/organizations/${organizationId}/projects/${projectId}/manager`, { userId });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  }
};

export default projectService;
