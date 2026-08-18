import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService } from '../services/githubService';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';
import RepositorySelector from '../components/github/RepositorySelector';
import ConnectedRepository from '../components/github/ConnectedRepository';
import GithubSyncSettings from '../components/github/GithubSyncSettings';
import GitHubSyncStatus from '../components/github/GitHubSyncStatus';
import { Code } from 'lucide-react';

const ProjectGithub = () => {
  const { organizationId, projectId } = useParams();
  const queryClient = useQueryClient();
  const { currentProject, projectMembers } = useProjectStore();
  const { currentRole: orgRole } = useOrgStore();
  const { user } = useAuthStore();
  const [needsAuth, setNeedsAuth] = React.useState(false);
  
  // Find user's role in this project
  const userRole = projectMembers?.find(
    (m) => m.user.id === user?._id
  )?.role || orgRole || 'MEMBER'; // Default to org role (e.g. OWNER) if they bypass project membership

  console.log('DEBUG: orgRole', orgRole);
  console.log('DEBUG: projectMembers', projectMembers);
  console.log('DEBUG: user', user);
  console.log('DEBUG: userRole', userRole);

  // Fetch the connected repository info
  const { data, isLoading, error } = useQuery({
    queryKey: ['projectRepository', organizationId, projectId],
    queryFn: () => githubService.getProjectRepositoryInfo(organizationId, projectId),
    retry: 1
  });

  const connectMutation = useMutation({
    mutationFn: (repo) => githubService.connectRepository(organizationId, projectId, repo.id, repo.owner.login, repo.name),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectRepository', organizationId, projectId]);
    },
    onError: (err) => {
      alert(`Failed to connect repository: ${err.response?.data?.message || err.message}`);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: () => githubService.disconnectRepository(organizationId, projectId),
    onSuccess: () => {
      queryClient.setQueryData(['projectRepository', organizationId, projectId], null);
    },
    onError: (err) => {
      alert(`Failed to disconnect repository: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleConnect = async () => {
    try {
      const response = await githubService.getGithubOAuthUrl();
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      alert('Failed to initialize GitHub OAuth flow');
    }
  };

  const handleConnectRepository = (repo) => {
    if (window.confirm(`Connect ${repo.fullName || repo.name} to ${currentProject?.name}?`)) {
      connectMutation.mutate(repo);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading GitHub integration...</p>
      </div>
    );
  }

  // If there's an error and it's a 404/403, we either haven't connected or auth failed
  const isConnected = data?.success && data?.data?.repository;

  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GitHub Integration</h2>
          <p className="mt-1 text-sm text-gray-500">
            Link your GitHub repository to track commits, branches, and pull requests directly within your project.
          </p>
        </div>
        {isConnected && <GitHubSyncStatus projectId={projectId} />}
      </div>

      {isConnected ? (
        <>
          <ConnectedRepository
            repository={data.data.repository}
            onDisconnect={() => disconnectMutation.mutate()}
            isDisconnecting={disconnectMutation.isLoading}
            userRole={userRole}
          />
          <GithubSyncSettings 
            organizationId={organizationId} 
            projectId={projectId} 
            userRole={userRole} 
          />
        </>
      ) : (
        <div className="bg-white shadow sm:rounded-lg">
          {needsAuth ? (
            <div className="px-4 py-12 sm:px-6 text-center">
              <Code className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">GitHub is not connected</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto mb-6">
                Connect your GitHub account to link a repository. You only need to do this once per user account.
              </p>
              {(userRole === 'OWNER' || userRole === 'PROJECT_MANAGER') ? (
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                >
                  <Code className="mr-2 h-5 w-5" />
                  Connect GitHub
                </button>
              ) : (
                <p className="text-sm text-red-500">Only Project Managers and Owners can connect a repository.</p>
              )}
            </div>
          ) : (
            <div className="p-0">
              {(userRole === 'OWNER' || userRole === 'PROJECT_MANAGER') ? (
                <RepositorySelector
                  onConnect={handleConnectRepository}
                  isConnecting={connectMutation.isLoading}
                  onNeedsAuth={() => setNeedsAuth(true)}
                />
              ) : (
                <div className="px-4 py-12 sm:px-6 text-center">
                  <Code className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg leading-6 font-medium text-gray-900">No Repository Connected</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-xl mx-auto">
                    A project manager needs to connect a GitHub repository to this project before you can view it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectGithub;
