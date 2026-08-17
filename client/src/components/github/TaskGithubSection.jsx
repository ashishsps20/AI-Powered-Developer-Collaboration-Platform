import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { GitPullRequest, Link as LinkIcon, Unlink, ExternalLink } from 'lucide-react';

const TaskGithubSection = ({ organizationId, projectId, taskId, canEdit }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);

  // Check if project has github connected
  const { data: repoData } = useQuery({
    queryKey: ['projectRepository', organizationId, projectId],
    queryFn: () => githubService.getProjectRepositoryInfo(organizationId, projectId),
  });

  const isConnected = repoData?.success && repoData?.data?.repository;

  // Fetch linked PRs
  const { data: linkData, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['taskGithubLinks', organizationId, projectId, taskId],
    queryFn: () => githubService.getTaskGithubLinks(organizationId, projectId, taskId),
    enabled: !!isConnected
  });

  // Fetch all PRs for the modal
  const { data: allPrsData, isLoading: isLoadingAllPrs } = useQuery({
    queryKey: ['githubPullRequests', organizationId, projectId],
    queryFn: () => githubService.getPullRequests(organizationId, projectId, 'all'),
    enabled: !!isModalOpen
  });

  const linkMutation = useMutation({
    mutationFn: (prNumber) => githubService.linkTaskPullRequest(organizationId, projectId, taskId, prNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskGithubLinks', organizationId, projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
      setIsModalOpen(false);
      setSelectedPr(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to link pull request');
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: (prNumber) => githubService.unlinkTaskPullRequest(organizationId, projectId, taskId, prNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskGithubLinks', organizationId, projectId, taskId] });
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to unlink pull request');
    }
  });

  if (!isConnected) return null;

  const pullRequests = linkData?.data?.pullRequests || [];

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <GitPullRequest className="w-5 h-5 mr-2" />
          GitHub
        </h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            Link Pull Request
          </button>
        )}
      </div>

      {isLoadingLinks ? (
        <p className="text-sm text-gray-500">Loading GitHub links...</p>
      ) : pullRequests.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No pull requests linked.</p>
      ) : (
        <div className="space-y-3">
          {pullRequests.map((pr) => (
            <div key={pr.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-blue-600 truncate">
                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                      #{pr.number} {pr.title}
                      <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
                    </a>
                  </p>
                  <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                    pr.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {pr.state.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 flex items-center text-xs text-gray-500">
                  <span className="truncate">{pr.sourceBranch} &rarr; {pr.targetBranch}</span>
                  <span className="mx-2">&middot;</span>
                  <span>{pr.author}</span>
                </p>
              </div>
              {canEdit && (
                <div className="ml-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Unlink PR #${pr.number}?`)) {
                        unlinkMutation.mutate(pr.number);
                      }
                    }}
                    disabled={unlinkMutation.isLoading}
                    className="font-medium text-red-600 hover:text-red-500 flex items-center text-sm disabled:opacity-50"
                  >
                    <Unlink className="w-4 h-4 mr-1" />
                    Unlink
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link PR Modal */}
      {isModalOpen && (
        <div className="fixed z-[60] inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Link Pull Request
                  </h3>
                  <div className="mt-4 max-h-60 overflow-y-auto text-left">
                    {isLoadingAllPrs ? (
                      <p className="text-sm text-gray-500 text-center py-4">Loading pull requests...</p>
                    ) : allPrsData?.data?.pullRequests?.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No pull requests are available.</p>
                    ) : (
                      <div className="space-y-2">
                        {allPrsData?.data?.pullRequests?.map((pr) => {
                          const isAlreadyLinked = pullRequests.some(linked => linked.number === pr.number);
                          return (
                            <div 
                              key={pr.number}
                              onClick={() => !isAlreadyLinked && setSelectedPr(pr.number)}
                              className={`p-3 rounded border cursor-pointer ${
                                isAlreadyLinked 
                                  ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                  : selectedPr === pr.number 
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-sm text-gray-900 truncate">#{pr.number} {pr.title}</span>
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 shrink-0">
                                  {pr.state.toUpperCase()}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                                <span>{pr.user?.login}</span>
                                {isAlreadyLinked && <span className="text-red-500 font-medium">Already linked</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  disabled={!selectedPr || linkMutation.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  onClick={() => linkMutation.mutate(selectedPr)}
                >
                  {linkMutation.isLoading ? 'Linking...' : 'Link Pull Request'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedPr(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskGithubSection;
