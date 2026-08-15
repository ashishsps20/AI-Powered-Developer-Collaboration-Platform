import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  clearAuth: () => set({ user: null, isAuthenticated: false }),
  
  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authService.getCurrentUser();
      set({
        user: response.data.user,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false
      });
    }
  },
  
  logout: async () => {
    try {
      await authService.logoutUser();
    } catch (error) {
      console.error('Logout failed on server, clearing local state anyway', error);
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  }
}));

export default useAuthStore;
