import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { GitCommit, ExternalLink } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const CommitList = ({ htmlUrl }) => {
  const { organizationId, projectId } = useParams();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['githubCommits', organizationId, projectId, page],
    queryFn: () => githubService.getCommits(organizationId, projectId, 'main', page, 20),
    keepPreviousData: true,
  });

  if (isLoading && page === 1) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-500">Loading commits...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 py-4">Error loading commits.</div>;
  }

  const commits = data?.data?.commits || [];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {commits.length === 0 ? (
          <li className="px-6 py-4 text-gray-500">No commits found.</li>
        ) : (
          commits.map((commit) => (
            <li key={commit.sha} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-start flex-1 min-w-0">
                  <GitCommit className="h-5 w-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={commit.commit.message}>
                      {commit.commit.message.split('\n')[0]}
                    </p>
                    <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-4 text-sm text-gray-500">
                      <div className="flex items-center mb-1 sm:mb-0">
                        {commit.author?.avatar_url && (
                          <img src={commit.author.avatar_url} alt="" className="h-4 w-4 rounded-full mr-1.5" />
                        )}
                        <span className="font-medium mr-1">{commit.commit.author.name}</span>
                        <span>committed {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex items-center space-x-3">
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {commit.sha.substring(0, 7)}
                  </span>
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
      
      {/* Basic pagination */}
      {commits.length === 20 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-center sm:px-6">
          <button
            onClick={() => setPage((old) => old + 1)}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default CommitList;
