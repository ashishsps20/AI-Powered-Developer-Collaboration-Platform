import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { GitPullRequest, Link as LinkIcon, Unlink, ExternalLink } from 'lucide-react';

const IssueGithubSection = ({ organizationId, projectId, issueId, canEdit }) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Check if project has github connected
  const { data: repoData } = useQuery({
    queryKey: ['projectRepository', organizationId, projectId],
    queryFn: () => githubService.getProjectRepositoryInfo(organizationId, projectId),
  });

  const isConnected = repoData?.success && repoData?.data?.repository;

  // Fetch linked issues
  const { data: linkData, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['issueGithubLink', organizationId, projectId, issueId],
    queryFn: () => githubService.getIssueGithubLink(organizationId, projectId, issueId),
    enabled: !!isConnected
  });

  // Fetch all issues for the modal
  const { data: allIssuesData, isLoading: isLoadingAllIssues } = useQuery({
    queryKey: ['githubIssues', organizationId, projectId],
    queryFn: () => githubService.getIssues(organizationId, projectId, 'all'),
    enabled: !!isModalOpen
  });

  const linkMutation = useMutation({
    mutationFn: (issueNumber) => githubService.linkIssueGithubIssue(organizationId, projectId, issueId, issueNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issueGithubLink', organizationId, projectId, issueId] });
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
      setIsModalOpen(false);
      setSelectedIssue(null);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to link GitHub issue');
    }
  });

  const unlinkMutation = useMutation({
    mutationFn: (issueNumber) => githubService.unlinkIssueGithubIssue(organizationId, projectId, issueId, issueNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issueGithubLink', organizationId, projectId, issueId] });
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to unlink GitHub issue');
    }
  });

  if (!isConnected) return null;

  const linkedIssue = linkData?.data?.issues?.[0] || null;

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <GitPullRequest className="w-5 h-5 mr-2" />
          GitHub
        </h3>
        {canEdit && !linkedIssue && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            Link GitHub Issue
          </button>
        )}
      </div>

      {isLoadingLinks ? (
        <p className="text-sm text-gray-500">Loading GitHub links...</p>
      ) : !linkedIssue ? (
        <p className="text-sm text-gray-500 italic">No GitHub issue linked.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-sm font-medium text-blue-600 truncate">
                  <a href={linkedIssue.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                    #{linkedIssue.number} {linkedIssue.title}
                    <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
                  </a>
                </p>
                <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                  linkedIssue.state === 'open' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {linkedIssue.state.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 flex items-center text-xs text-gray-500">
                <span>{linkedIssue.author}</span>
              </p>
            </div>
            {canEdit && (
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Unlink GitHub Issue #${linkedIssue.number}?`)) {
                      unlinkMutation.mutate(linkedIssue.number);
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
        </div>
      )}

      {/* Link Issue Modal */}
      {isModalOpen && (
        <div className="fixed z-[60] inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Link GitHub Issue
                  </h3>
                  <div className="mt-4 max-h-60 overflow-y-auto text-left">
                    {isLoadingAllIssues ? (
                      <p className="text-sm text-gray-500 text-center py-4">Loading issues...</p>
                    ) : allIssuesData?.data?.issues?.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No GitHub issues are available.</p>
                    ) : (
                      <div className="space-y-2">
                        {allIssuesData?.data?.issues?.map((issue) => {
                          const isAlreadyLinked = linkedIssue?.number === issue.number;
                          return (
                            <div 
                              key={issue.number}
                              onClick={() => !isAlreadyLinked && setSelectedIssue(issue.number)}
                              className={`p-3 rounded border cursor-pointer ${
                                isAlreadyLinked 
                                  ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                                  : selectedIssue === issue.number 
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="font-medium text-sm text-gray-900 truncate">#{issue.number} {issue.title}</span>
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 shrink-0">
                                  {issue.state.toUpperCase()}
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500 flex justify-between">
                                <span>{issue.user?.login}</span>
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
                  disabled={!selectedIssue || linkMutation.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                  onClick={() => linkMutation.mutate(selectedIssue)}
                >
                  {linkMutation.isLoading ? 'Linking...' : 'Link Issue'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedIssue(null);
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

export default IssueGithubSection;
