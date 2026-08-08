import { create } from 'zustand';
import { api } from '../lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isInitialized: false,
  isLoading: false,

  setSession: (user, token) => set({ user, token }),

  clearSession: () => set({ user: null, token: null }),

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({
        user: data.data.user,
        isInitialized: true,
        isLoading: false,
      });
      return data.data.user;
    } catch {
      set({ user: null, token: null, isInitialized: true, isLoading: false });
      return null;
    }
  },

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    set({ user: data.data.user, token: data.data.token });
    return data.data.user;
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    set({ user: data.data.user, token: data.data.token });
    return data.data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, token: null });
    }
  },
}));
