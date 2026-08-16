import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { GitBranch, ExternalLink } from 'lucide-react';
import { useParams } from 'react-router-dom';

const BranchList = ({ htmlUrl }) => {
  const { organizationId, projectId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['githubBranches', organizationId, projectId],
    queryFn: () => githubService.getBranches(organizationId, projectId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-500">Loading branches...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 py-4">Error loading branches.</div>;
  }

  const branches = data?.data?.branches || [];

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {branches.length === 0 ? (
          <li className="px-6 py-4 text-gray-500">No branches found.</li>
        ) : (
          branches.map((branch) => (
            <li key={branch.name} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <GitBranch className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                  {branch.protected && (
                    <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Protected
                    </span>
                  )}
                </div>
              </div>
              <a
                href={`${htmlUrl}/tree/${branch.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-500"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default BranchList;
