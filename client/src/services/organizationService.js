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
};

export default organizationService;
