import api from './api';

const organizationService = {
  getOrganizations: async () => {
    try {
      const response = await api.get('/organizations');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  createOrganization: async (data) => {
    try {
      const response = await api.post('/organizations', data);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  getOrganization: async (organizationId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  getMembers: async (organizationId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/members`);
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  removeMember: async (organizationId, userId) => {
    try {
      const response = await api.delete(`/organizations/${organizationId}/members/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  inviteMember: async (organizationId, data) => {
    try {
      const response = await api.post(`/organizations/${organizationId}/invitations`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  cancelInvitation: async (organizationId, invitationId) => {
    try {
      const response = await api.delete(`/organizations/${organizationId}/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  getOrganizationInvitations: async (organizationId) => {
    try {
      const response = await api.get(`/organizations/${organizationId}/invitations`);
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  getPendingInvitations: async () => {
    try {
      const response = await api.get('/organizations/invitations/pending');
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  acceptInvitation: async (token) => {
    try {
      const response = await api.post('/organizations/invitations/accept', { token });
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },

  rejectInvitation: async (token) => {
    try {
      const response = await api.post('/organizations/invitations/reject', { token });
      return response.data;
    } catch (error) {
      if (error.response) throw error.response.data;
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },
};

export default organizationService;
