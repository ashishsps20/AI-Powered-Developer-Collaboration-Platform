import { create } from 'zustand';
import projectService from '../services/projectService';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  projectMembers: [],
  isLoading: false,
  error: null,

  fetchProjects: async (organizationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.getProjects(organizationId);
      set({
        projects: response.data.projects,
        isLoading: false,
      });
      return response.data.projects;
    } catch (error) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to fetch projects',
        isLoading: false,
      });
      return [];
    }
  },

  createProject: async (organizationId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.createProject(organizationId, data);
      set((state) => ({
        projects: [...state.projects, response.data.project],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({
        error: error.message || 'Failed to create project',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchProject: async (organizationId, projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.getProject(organizationId, projectId);
      set({
        currentProject: response.data.project,
        isLoading: false,
      });
      return response.data.project;
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch project',
        isLoading: false,
        currentProject: null,
      });
      throw error;
    }
  },

  fetchProjectMembers: async (organizationId, projectId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.getProjectMembers(organizationId, projectId);
      set({
        projectMembers: response.data.members,
        isLoading: false,
      });
      return response.data.members;
    } catch (error) {
      set({
        error: error.message || 'Failed to fetch project members',
        isLoading: false,
      });
      return [];
    }
  },

  addProjectMember: async (organizationId, projectId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectService.addProjectMember(organizationId, projectId, data);
      
      // We can refetch or just return and let the component refetch
      // For safety, we'll just return it
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({
        error: error.message || 'Failed to add project member',
        isLoading: false,
      });
      throw error;
    }
  },

  removeProjectMember: async (organizationId, projectId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.removeProjectMember(organizationId, projectId, userId);
      set((state) => ({
        projectMembers: state.projectMembers.filter(m => m.user.id !== userId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error.message || 'Failed to remove project member',
        isLoading: false,
      });
      throw error;
    }
  },

  reassignProjectManager: async (organizationId, projectId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await projectService.reassignProjectManager(organizationId, projectId, userId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error.message || 'Failed to reassign project manager',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));

export default useProjectStore;
