import { create } from 'zustand';

const useUIStore = create((set) => ({
  // Task Filters
  taskFilters: {
    status: 'All',
    priority: 'All',
    assignee: 'All',
  },
  setTaskFilter: (key, value) => set((state) => ({
    taskFilters: { ...state.taskFilters, [key]: value }
  })),
  
  // Issue Filters
  issueFilters: {
    status: 'All',
    priority: 'All',
    type: 'All',
    assignee: 'All',
  },
  setIssueFilter: (key, value) => set((state) => ({
    issueFilters: { ...state.issueFilters, [key]: value }
  })),

  // Modals state
  isCreateTaskModalOpen: false,
  setCreateTaskModalOpen: (isOpen) => set({ isCreateTaskModalOpen: isOpen }),
  
  isCreateIssueModalOpen: false,
  setCreateIssueModalOpen: (isOpen) => set({ isCreateIssueModalOpen: isOpen }),

  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  selectedIssueId: null,
  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
}));

export default useUIStore;
