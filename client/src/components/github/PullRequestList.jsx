import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { GitPullRequest, ExternalLink, Check, X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const PullRequestList = () => {
  const { organizationId, projectId } = useParams();
  const [filter, setFilter] = useState('all'); // all, open, closed

  const { data, isLoading, error } = useQuery({
    queryKey: ['githubPullRequests', organizationId, projectId, filter],
    queryFn: () => githubService.getPullRequests(organizationId, projectId, filter),
    keepPreviousData: true,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-500">Loading pull requests...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 py-4">Error loading pull requests.</div>;
  }

  const pullRequests = data?.data?.pullRequests || [];

  return (
    <div className="bg-white shadow sm:rounded-md">
      <div className="border-b border-gray-200 p-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['all', 'open', 'closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`
                whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm capitalize
                ${filter === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <ul className="divide-y divide-gray-200">
        {pullRequests.length === 0 ? (
          <li className="px-6 py-8 text-center text-gray-500">No pull requests found.</li>
        ) : (
          pullRequests.map((pr) => (
            <li key={pr.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1 min-w-0">
                  <GitPullRequest className={`h-5 w-5 mt-1 mr-3 flex-shrink-0 ${pr.state === 'open' ? 'text-green-500' : 'text-purple-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      <p className="text-base font-medium text-gray-900 truncate mr-2">
                        {pr.title}
                      </p>
                      <span className="text-sm text-gray-500">#{pr.number}</span>
                    </div>
                    <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-4 text-sm text-gray-500">
                      <div className="flex items-center mb-1 sm:mb-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${pr.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                          {pr.state.toUpperCase()}
                        </span>
                        <span>opened {formatDistanceToNow(new Date(pr.created_at), { addSuffix: true })} by {pr.user.login}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-mono text-gray-500 flex items-center">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{pr.head.ref}</span>
                      <span className="mx-2">→</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{pr.base.ref}</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex items-center">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" />
                    View on GitHub
                  </a>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default PullRequestList;
