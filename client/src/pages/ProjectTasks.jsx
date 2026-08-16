import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';
import useUIStore from '../store/uiStore';
import useAuthStore from '../store/authStore';
import { taskService } from '../services/taskService';
import KanbanBoard from '../components/tasks/KanbanBoard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';

const ProjectTasks = () => {
  const { organizationId, projectId } = useParams();
  const { user } = useAuthStore();
  const { currentRole: orgRole } = useOrgStore();
  const { currentProject, projectMembers } = useProjectStore();
  const { 
    taskFilters, 
    setTaskFilter, 
    setCreateTaskModalOpen,
    selectedTaskId
  } = useUIStore();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate permissions
  const currentUserMembership = projectMembers.find(m => m.user.id === user?.id);
  const projectRole = currentUserMembership?.role || null;
  const isManagerOrOwner = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await taskService.getTasks(organizationId, projectId, taskFilters);
      setTasks(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && projectId) {
      fetchTasks();
    }
  }, [organizationId, projectId, taskFilters]);

  const handleTaskCreated = (newTask) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskUpdated = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleTaskDeleted = (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  if (!currentProject) return null;

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">Manage project tasks with the Kanban board.</p>
        </div>
        <div>
          {isManagerOrOwner && (
            <button
              onClick={() => setCreateTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Create Task
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            id="filter-status"
            value={taskFilters.status}
            onChange={(e) => setTaskFilter('status', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="All">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="filter-priority" className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
          <select
            id="filter-priority"
            value={taskFilters.priority}
            onChange={(e) => setTaskFilter('priority', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="All">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="filter-assignee" className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
          <select
            id="filter-assignee"
            value={taskFilters.assignee}
            onChange={(e) => setTaskFilter('assignee', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="All">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {projectMembers.map(member => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex-shrink-0">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tasks...</p>
            </div>
          </div>
        ) : tasks.length === 0 && Object.values(taskFilters).every(v => v === 'All') ? (
          <div className="h-full flex items-center justify-center bg-white rounded-lg border border-dashed border-gray-300">
            <div className="text-center p-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
              {isManagerOrOwner && (
                <div className="mt-6">
                  <button
                    onClick={() => setCreateTaskModalOpen(true)}
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    + Create Task
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <KanbanBoard 
            organizationId={organizationId} 
            projectId={projectId} 
            tasks={tasks} 
            setTasks={setTasks} 
            setError={setError}
          />
        )}
      </div>

      <CreateTaskModal 
        organizationId={organizationId} 
        projectId={projectId} 
        onTaskCreated={handleTaskCreated} 
      />

      {selectedTaskId && (
        <TaskDetailModal 
          organizationId={organizationId}
          projectId={projectId}
          task={tasks.find(t => t._id === selectedTaskId)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
};

export default ProjectTasks;
