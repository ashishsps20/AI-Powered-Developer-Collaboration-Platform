import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useProjectStore from '../../store/projectStore';
import useOrgStore from '../../store/orgStore';
import useUIStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { issueService } from '../../services/issueService';
import CommentList from '../comments/CommentList';
import IssueGithubSection from '../github/IssueGithubSection';

const IssueDetailModal = ({ organizationId, projectId, issue, onIssueUpdated, onIssueDeleted }) => {
  const { selectedIssueId, setSelectedIssueId } = useUIStore();
  const { projectMembers } = useProjectStore();
  const { currentRole: orgRole } = useOrgStore();
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm();

  // Calculate permissions
  const currentUserMembership = projectMembers.find(m => m.user.id === user?.id);
  const projectRole = currentUserMembership?.role || null;
  const isManagerOrOwner = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';
  
  // Any project member can edit issues (per requirements)
  const canEdit = true; 
  const canDelete = isManagerOrOwner;

  useEffect(() => {
    if (issue) {
      reset({
        title: issue.title,
        description: issue.description || '',
        priority: issue.priority,
        status: issue.status,
        type: issue.type,
        assignedTo: issue.assignedTo?._id || issue.assignedTo || '',
        labels: issue.labels ? issue.labels.join(', ') : '',
      });
      setIsEditMode(false);
      setError('');
    }
  }, [issue, reset]);

  if (selectedIssueId !== issue?._id) return null;

  const handleClose = () => {
    setSelectedIssueId(null);
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

      const updatedIssue = await issueService.updateIssue(organizationId, projectId, issue._id, formattedData);
      onIssueUpdated(updatedIssue);
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
      setIsEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await issueService.deleteIssue(organizationId, projectId, issue._id);
        onIssueDeleted(issue._id);
        queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
        handleClose();
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to delete issue');
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
              {isEditMode ? 'Edit Issue' : issue.title}
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
                      {...register('description', { required: 'Description is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        id="type"
                        {...register('type')}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="BUG">Bug</option>
                        <option value="FEATURE">Feature</option>
                        <option value="IMPROVEMENT">Improvement</option>
                        <option value="QUESTION">Question</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        id="status"
                        {...register('status')}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
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
                      <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assignee</label>
                      <select
                        id="assignedTo"
                        {...register('assignedTo')}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="">Unassigned</option>
                        {projectMembers.map(member => (
                          <option key={member.user.id} value={member.user.id}>
                            {member.user.name}
                          </option>
                        ))}
                      </select>
                    </div>
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

                  <div className="mt-5 pt-5 border-t flex justify-between">
                    <div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                        >
                          Delete Issue
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
                      {issue.description || <span className="text-gray-400 italic">No description provided.</span>}
                    </div>
                  </div>

                  <IssueGithubSection 
                    organizationId={organizationId} 
                    projectId={projectId} 
                    issueId={issue._id} 
                    canEdit={canEdit} 
                  />
                  
                  <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                        {issue.type}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                        {issue.status?.replace('_', ' ') || issue.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Priority</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${issue.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 
                          issue.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                          issue.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {issue.priority}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Assignee</h4>
                      {issue.assignedTo ? (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{issue.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  {issue.labels && issue.labels.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Labels</h4>
                      <div className="flex flex-wrap gap-2">
                        {issue.labels.map((label, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t text-xs text-gray-500 flex justify-between">
                    <div>
                      Reported by <span className="font-medium">{issue.reportedBy?.name || 'Unknown'}</span> on {new Date(issue.createdAt).toLocaleDateString()}
                    </div>
                    {issue.resolvedAt && (
                      <div className="text-green-600 font-medium">
                        Resolved on {new Date(issue.resolvedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {/* Comments Section */}
                  <CommentList entityType="ISSUE" entityId={issue._id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;
