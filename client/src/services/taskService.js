import api from './api';

export const taskService = {
  getTasks: async (organizationId, projectId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'All') params.append('priority', filters.priority);
    if (filters.assignee && filters.assignee !== 'All') params.append('assignedTo', filters.assignee);

    const response = await api.get(`/organizations/${organizationId}/projects/${projectId}/tasks`, { params });
    return response.data.data.tasks;
  },

  createTask: async (organizationId, projectId, data) => {
    const response = await api.post(`/organizations/${organizationId}/projects/${projectId}/tasks`, data);
    return response.data.data.task;
  },

  updateTask: async (organizationId, projectId, taskId, data) => {
    const response = await api.patch(`/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`, data);
    return response.data.data.task;
  },

  updateTaskStatus: async (organizationId, projectId, taskId, status) => {
    const response = await api.patch(`/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/status`, { status });
    return response.data.data.task;
  },

  updateTaskPosition: async (organizationId, projectId, taskId, status, position) => {
    const response = await api.patch(`/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}/position`, { status, position });
    return response.data.data.task;
  },

  deleteTask: async (organizationId, projectId, taskId) => {
    const response = await api.delete(`/organizations/${organizationId}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },
};
