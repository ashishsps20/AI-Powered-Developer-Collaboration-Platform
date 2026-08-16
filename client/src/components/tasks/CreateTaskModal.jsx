import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';
import { taskService } from '../../services/taskService';

const CreateTaskModal = ({ organizationId, projectId, onTaskCreated }) => {
  const { isCreateTaskModalOpen, setCreateTaskModalOpen } = useUIStore();
  const { projectMembers } = useProjectStore();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      status: 'TODO',
      priority: 'MEDIUM',
    }
  });

  if (!isCreateTaskModalOpen) return null;

  const onSubmit = async (data) => {
    setError('');
    setIsSubmitting(true);
    try {
      // Split comma-separated labels into array
      const formattedData = {
        ...data,
        labels: data.labels ? data.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        assignedTo: data.assignedTo === '' ? null : data.assignedTo
      };

      const newTask = await taskService.createTask(organizationId, projectId, formattedData);
      onTaskCreated(newTask);
      reset();
      setCreateTaskModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setCreateTaskModalOpen(false)}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 z-10">
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Create New Task
              </h3>
              <div className="mt-4">
                {error && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      id="title"
                      {...register('title', { required: 'Title is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g. Implement JWT authentication"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      rows={3}
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
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Unassigned</option>
                      {projectMembers.map(member => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.name} — {member.role}
                        </option>
                      ))}
                    </select>
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
                        placeholder="backend, bug"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating task...' : 'Create Task'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateTaskModalOpen(false)}
                      disabled={isSubmitting}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
