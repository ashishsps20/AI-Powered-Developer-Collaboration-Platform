import api from './api';

const authService = {
  registerUser: async (data) => {
    try {
      const response = await api.post('/auth/register', data);
      return response.data;
    } catch (error) {
      if (error.response) {
        // Backend error response
        throw error.response.data;
      } else if (error.request) {
        // Network error
        throw { success: false, message: 'Unable to connect to the server.' };
      } else {
        // Something else went wrong
        throw { success: false, message: 'Something went wrong. Please try again.' };
      }
    }
  },
  loginUser: async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 429) {
          throw { success: false, message: 'Too many login attempts. Please try again later.' };
        }
        throw error.response.data;
      } else if (error.request) {
        throw { success: false, message: 'Unable to connect to the server.' };
      } else {
        throw { success: false, message: 'Something went wrong. Please try again.' };
      }
    }
  },
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },
  logoutUser: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Unable to connect to the server.' };
    }
  },
};

export default authService;
