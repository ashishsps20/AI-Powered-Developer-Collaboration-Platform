import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { activityService } from '../services/activityService';
import { 
  CheckCircle, MessageSquare, AlertCircle, ArrowRight, UserPlus, Users, Briefcase, Code, GitPullRequest, GitCommit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const formatActivityMessage = (activity) => {
  const actor = activity.actor?.name || 'Unknown user';
  
  switch (activity.action) {
    case 'PROJECT_CREATED':
      return `${actor} created this project.`;
    case 'PROJECT_MEMBER_ADDED':
      return `${actor} added a new member to the project.`;
    case 'PROJECT_MEMBER_REMOVED':
      return `${actor} removed a member from the project.`;
    case 'PROJECT_MANAGER_CHANGED':
      return `${actor} reassigned the project manager role.`;
      
    case 'TASK_CREATED':
      return `${actor} created a new task.`;
    case 'TASK_UPDATED':
      return `${actor} updated a task.`;
    case 'TASK_ASSIGNED':
      return `${actor} assigned a task.`;
    case 'TASK_STATUS_CHANGED':
      return `${actor} moved a task from ${activity.metadata?.oldStatus?.replace(/_/g, ' ')} to ${activity.metadata?.newStatus?.replace(/_/g, ' ')}.`;
    case 'TASK_DELETED':
      return `${actor} deleted a task.`;
      
    case 'ISSUE_CREATED':
      return `${actor} created a new issue.`;
    case 'ISSUE_UPDATED':
      return `${actor} updated an issue.`;
    case 'ISSUE_ASSIGNED':
      return `${actor} assigned an issue.`;
    case 'ISSUE_STATUS_CHANGED':
      return `${actor} changed an issue status to ${activity.metadata?.newStatus}.`;
    case 'ISSUE_DELETED':
      return `${actor} deleted an issue.`;
      
    case 'COMMENT_CREATED':
      return `${actor} commented on a ${activity.metadata?.commentEntityType?.toLowerCase() || 'item'}.`;
    case 'COMMENT_UPDATED':
      return `${actor} updated their comment.`;
    case 'COMMENT_DELETED':
      return `${actor} deleted a comment.`;
      
    // GitHub Events
    case 'GITHUB_REPOSITORY_CONNECTED':
      return `${actor} connected GitHub repository ${activity.metadata?.repositoryName || ''}.`;
    case 'GITHUB_REPOSITORY_DISCONNECTED':
      return `${actor} disconnected a GitHub repository.`;
    case 'GITHUB_PUSH':
      return `${actor} pushed ${activity.metadata?.commitCount || 1} commit(s) to ${activity.metadata?.branch || 'a branch'}.`;
    case 'GITHUB_PR_OPENED':
      return `${actor} opened pull request #${activity.metadata?.prNumber} "${activity.metadata?.prTitle}".`;
    case 'GITHUB_PR_CLOSED':
      return `${actor} closed pull request #${activity.metadata?.prNumber} "${activity.metadata?.prTitle}".`;
    case 'GITHUB_ISSUE_OPENED':
      return `${actor} opened GitHub issue #${activity.metadata?.issueNumber} "${activity.metadata?.issueTitle}".`;
    case 'GITHUB_PR_REVIEWED':
      return `${actor} submitted a review on pull request #${activity.metadata?.prNumber}.`;
      
    // Module 11 Sync Events
    case 'TASK_GITHUB_PR_LINKED':
      return `${actor} linked PR #${activity.metadata?.prNumber} to task.`;
    case 'TASK_GITHUB_PR_UNLINKED':
      return `${actor} unlinked PR #${activity.metadata?.prNumber} from task.`;
    case 'ISSUE_GITHUB_ISSUE_LINKED':
      return `${actor} linked GitHub Issue #${activity.metadata?.githubIssueNumber} to internal issue.`;
    case 'ISSUE_GITHUB_ISSUE_UNLINKED':
      return `${actor} unlinked GitHub Issue #${activity.metadata?.githubIssueNumber} from internal issue.`;
    case 'TASK_STATUS_AUTO_SYNCED':
      return `Task was moved from ${activity.metadata?.oldStatus?.replace(/_/g, ' ')} to ${activity.metadata?.newStatus?.replace(/_/g, ' ')} by GitHub synchronization (PR #${activity.metadata?.prNumber}).`;
    case 'ISSUE_STATUS_AUTO_SYNCED':
      return `Issue was moved from ${activity.metadata?.oldStatus?.replace(/_/g, ' ')} to ${activity.metadata?.newStatus?.replace(/_/g, ' ')} by GitHub synchronization (Issue #${activity.metadata?.githubIssueNumber}).`;

    default:
      return `${actor} performed an action.`;
  }
};

const getActivityIcon = (action) => {
  if (action.includes('TASK_CREATED') || action.includes('TASK_STATUS_CHANGED')) {
    return <CheckCircle className="h-5 w-5 text-blue-500" />;
  }
  if (action.includes('COMMENT')) {
    return <MessageSquare className="h-5 w-5 text-green-500" />;
  }
  if (action.includes('ISSUE')) {
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
  if (action.includes('ASSIGNED') || action.includes('MEMBER')) {
    return <UserPlus className="h-5 w-5 text-purple-500" />;
  }
  if (action.includes('PROJECT')) {
    return <Briefcase className="h-5 w-5 text-indigo-500" />;
  }
  
  if (action.includes('GITHUB_PR')) {
    return <GitPullRequest className="h-5 w-5 text-purple-500" />;
  }
  if (action.includes('GITHUB_PUSH')) {
    return <GitCommit className="h-5 w-5 text-gray-700" />;
  }
  if (action.includes('GITHUB')) {
    return <Code className="h-5 w-5 text-gray-900" />;
  }
  
  return <ArrowRight className="h-5 w-5 text-gray-500" />;
};

const ProjectActivity = () => {
  const { organizationId, projectId } = useParams();
  const [page, setPage] = useState(1);
  const [allActivities, setAllActivities] = useState([]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['activity', organizationId, projectId, page],
    queryFn: async () => {
      const res = await activityService.getProjectActivity(organizationId, projectId, page, 20);
      return res;
    }
  });

  // Keep appending to allActivities when data changes
  React.useEffect(() => {
    if (data?.data?.activities) {
      if (page === 1) {
        setAllActivities(data.data.activities);
      } else {
        setAllActivities(prev => {
          // avoid duplicates
          const newItems = data.data.activities.filter(a => !prev.find(p => p._id === a._id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [data, page]);

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError && page === 1) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-700">
        Error loading activity: {error.message || 'Unknown error'}
      </div>
    );
  }

  const pagination = data?.data?.pagination;
  const hasMore = pagination && pagination.page < pagination.totalPages;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Project Activity</h3>
      </div>
      
      <div className="px-4 py-5 sm:p-6">
        {allActivities.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>No activity yet.</p>
            <p className="text-sm">Project activity will appear here.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {allActivities.map((activity, activityIdx) => (
                <li key={activity._id}>
                  <div className="relative pb-8">
                    {activityIdx !== allActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getActivityIcon(activity.action)}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-700">
                            {formatActivityMessage(activity)}
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500">
                          <time dateTime={activity.createdAt}>
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isFetching}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
            >
              {isFetching ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectActivity;
