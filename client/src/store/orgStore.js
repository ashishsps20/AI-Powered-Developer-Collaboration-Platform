import { create } from 'zustand';
import organizationService from '../services/organizationService';

const useOrgStore = create((set, get) => ({
  organizations: [],
  currentOrganization: null,
  currentRole: null,
  isLoading: false,
  error: null,

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationService.getOrganizations();
      set({
        organizations: response.data.organizations,
        isLoading: false,
      });
      return response.data.organizations;
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch organizations',
        isLoading: false,
      });
      return [];
    }
  },

  setCurrentOrganization: async (organizationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationService.getOrganization(organizationId);
      set({
        currentOrganization: response.data.organization,
        currentRole: response.data.role,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({
        error: error,
        isLoading: false,
        currentOrganization: null,
        currentRole: null,
      });
      throw error;
    }
  },

  createOrganization: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationService.createOrganization(data);
      
      // Update local state by re-fetching or appending
      const newOrg = {
        id: response.data.organization.id,
        name: response.data.organization.name,
        slug: response.data.organization.slug,
        role: response.data.membership.role,
      };
      
      set((state) => ({
        organizations: [...state.organizations, newOrg],
        isLoading: false,
      }));
      
      return response.data;
    } catch (error) {
      set({
        error: error.message || 'Failed to create organization',
        isLoading: false,
      });
      throw error;
    }
  },
  
  clearError: () => set({ error: null })
}));

export default useOrgStore;
