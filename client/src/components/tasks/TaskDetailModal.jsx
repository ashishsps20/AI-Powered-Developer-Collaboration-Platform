import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useProjectStore from '../../store/projectStore';
import useOrgStore from '../../store/orgStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { taskService } from '../../services/taskService';

const TaskDetailModal = ({ organizationId, projectId, task, onTaskUpdated, onTaskDeleted }) => {
  const { selectedTaskId, setSelectedTaskId } = useUIStore();
  const { projectMembers } = useProjectStore();
  const { currentRole: orgRole } = useOrgStore();
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm();

  // Calculate permissions
  const currentUserMembership = projectMembers.find(m => m.user.id === user?.id);
  const projectRole = currentUserMembership?.role || null;
  const isManagerOrOwner = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';
  const isAssignee = task?.assignedTo?._id === user?.id || task?.assignedTo === user?.id;
  const isCreator = task?.createdBy?._id === user?.id || task?.createdBy === user?.id;
  
  const canEdit = isManagerOrOwner || isAssignee || isCreator;
  const canDelete = isManagerOrOwner;
  const canReassign = isManagerOrOwner;

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        labels: task.labels ? task.labels.join(', ') : '',
      });
      setIsEditMode(false);
      setError('');
    }
  }, [task, reset]);

  if (selectedTaskId !== task?._id) return null;

  const handleClose = () => {
    setSelectedTaskId(null);
    setIsEditMode(false);
    setError('');
  };

  const onSubmit = async (data) => {
    setError('');
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        labels: data.labels ? data.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        assignedTo: data.assignedTo === '' ? null : data.assignedTo
      };

      const updatedTask = await taskService.updateTask(organizationId, projectId, task._id, formattedData);
      onTaskUpdated(updatedTask);
      setIsEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(organizationId, projectId, task._id);
        onTaskDeleted(task._id);
        handleClose();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to delete task');
      }
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 z-10">
          <div className="absolute top-0 right-0 pt-4 pr-4 flex space-x-2">
            {!isEditMode && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="bg-white rounded-md text-gray-400 hover:text-blue-500 focus:outline-none"
              >
                <span className="sr-only">Edit</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 sm:mt-0 sm:text-left h-full">
            <h3 className="text-xl leading-6 font-bold text-gray-900 pr-12" id="modal-title">
              {isEditMode ? 'Edit Task' : task.title}
            </h3>
            
            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mt-6">
              {isEditMode ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      id="title"
                      {...register('title', { required: 'Title is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      rows={5}
                      {...register('description')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        id="priority"
                        {...register('priority')}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        id="status"
                        {...register('status')}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assignee</label>
                    <select
                      id="assignedTo"
                      {...register('assignedTo')}
                      disabled={!canReassign}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map(member => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                    {!canReassign && <p className="text-xs text-gray-500 mt-1">You do not have permission to reassign this task.</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        id="dueDate"
                        {...register('dueDate')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="labels" className="block text-sm font-medium text-gray-700">Labels (comma separated)</label>
                      <input
                        type="text"
                        id="labels"
                        {...register('labels')}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t flex justify-between">
                    <div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                        >
                          Delete Task
                        </button>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => { setIsEditMode(false); reset(); }}
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm text-gray-800 border">
                      {task.description || <span className="text-gray-400 italic">No description provided.</span>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 
                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                          task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Assignee</h4>
                      {task.assignedTo ? (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Due Date</h4>
                      <span className="text-sm text-gray-900">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-gray-400 italic">None</span>}
                      </span>
                    </div>
                  </div>
                  
                  {task.labels && task.labels.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.labels.map((label, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t text-xs text-gray-500 flex justify-between">
                    <div>
                      Created by <span className="font-medium">{task.createdBy?.name || 'Unknown'}</span> on {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                    {task.completedAt && (
                      <div className="text-green-600 font-medium">
                        Completed on {new Date(task.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
