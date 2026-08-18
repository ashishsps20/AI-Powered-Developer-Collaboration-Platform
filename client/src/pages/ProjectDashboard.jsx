import React from 'react';
import { useParams } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import useProjectStore from '../store/projectStore';
import projectService from '../services/projectService';
import { taskService } from '../services/taskService';
import { issueService } from '../services/issueService';
import ProjectStatsSkeleton from '../components/dashboard/ProjectStatsSkeleton';
import ServiceUnavailable from '../components/common/ServiceUnavailable';

const ProjectDashboard = () => {
  const { organizationId, projectId } = useParams();
  const { currentProject } = useProjectStore();
  const queryClient = useQueryClient();

  if (!currentProject) return null;

  // Fetch all needed stats data concurrently using React Query
  const queries = useQueries({
    queries: [
      {
        queryKey: ['projects', organizationId, projectId, 'members'],
        queryFn: () => projectService.getProjectMembers(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
      },
      {
        queryKey: ['projects', organizationId, projectId, 'tasks'],
        queryFn: () => taskService.getTasks(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
      },
      {
        queryKey: ['projects', organizationId, projectId, 'issues'],
        queryFn: () => issueService.getIssues(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
      }
    ]
  });

  const [membersQuery, tasksQuery, issuesQuery] = queries;

  const isLoading = queries.some(q => q.isLoading);
  const isError = queries.some(q => q.isError);

  if (isLoading) {
    return <ProjectStatsSkeleton />;
  }

  if (isError) {
    const error503 = queries.find(q => q.error?.response?.status === 503);
    if (error503) {
      return (
        <ServiceUnavailable 
          onRetry={() => {
            queries.forEach(q => {
              if (q.isError) q.refetch();
            });
          }}
          isRetrying={queries.some(q => q.isFetching)}
        />
      );
    }
    
    // Generic fallback for other errors
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-700">Failed to load project dashboard data.</p>
        <button 
          onClick={() => queries.forEach(q => q.isError && q.refetch())}
          className="mt-2 text-red-600 underline text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : (tasksQuery.data?.tasks || []);
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const totalTasks = tasks.length;
  
  const issues = Array.isArray(issuesQuery.data) ? issuesQuery.data : (issuesQuery.data?.issues || []);
  const openIssues = issues.filter(i => i.status === 'OPEN').length;

  const members = Array.isArray(membersQuery.data) ? membersQuery.data : (membersQuery.data?.data?.members || membersQuery.data?.members || []);
  const totalMembers = members.length;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Project Overview</h3>
        <div className="mt-5 border-t border-gray-200 pt-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentProject.description || 'No description provided.'}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                  {currentProject.status}
                </span>
              </dd>
            </div>
            
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Project Manager</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentProject.projectManager ? (
                  <span>{currentProject.projectManager.name || 'Unassigned'}</span>
                ) : (
                  <span className="text-gray-400 italic">Unassigned</span>
                )}
              </dd>
            </div>
          </dl>
          
          {/* Real-time Project Statistics */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h4 className="text-base font-medium text-gray-900 mb-6">Statistics</h4>
            
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-4">
              <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6 border border-gray-100">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalTasks}</dd>
              </div>
              <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6 border border-gray-100">
                <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{completedTasks}</dd>
              </div>
              <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6 border border-gray-100">
                <dt className="text-sm font-medium text-gray-500 truncate">Open Issues</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{openIssues}</dd>
              </div>
              <div className="px-4 py-5 bg-gray-50 shadow-sm rounded-lg overflow-hidden sm:p-6 border border-gray-100">
                <dt className="text-sm font-medium text-gray-500 truncate">Project Members</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalMembers}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
