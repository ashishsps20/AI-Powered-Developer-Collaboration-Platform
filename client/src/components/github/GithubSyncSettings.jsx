import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';

const GithubSyncSettings = ({ organizationId, projectId, userRole }) => {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState(null);

  const canEdit = userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';

  const { data, isLoading, error } = useQuery({
    queryKey: ['githubSyncSettings', organizationId, projectId],
    queryFn: () => githubService.getGithubSyncSettings(organizationId, projectId)
  });

  useEffect(() => {
    if (data?.data?.settings) {
      setLocalSettings(data.data.settings);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings) => githubService.updateGithubSyncSettings(organizationId, projectId, newSettings),
    onSuccess: (res) => {
      queryClient.setQueryData(['githubSyncSettings', organizationId, projectId], res);
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
    },
    onError: (err) => {
      alert(`Failed to update settings: ${err.response?.data?.message || err.message}`);
    }
  });

  const handleToggle = (settingKey) => {
    if (!canEdit) return;

    const newValue = !localSettings[settingKey];

    if (newValue && settingKey === 'autoCompleteTaskOnPRMerge') {
      if (!window.confirm('Enabling this option will automatically change linked tasks to DONE when their linked GitHub pull request is merged. Proceed?')) {
        return;
      }
    }

    const updated = { ...localSettings, [settingKey]: newValue };
    setLocalSettings(updated);
    updateMutation.mutate(updated);
  };

  if (isLoading) return <div className="p-6">Loading synchronization settings...</div>;
  if (error) return <div className="p-6 text-red-500">Failed to load settings.</div>;
  if (!localSettings) return null;

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden mt-6">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Synchronization</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Automatic synchronization is disabled by default. Enable only the workflows you want.
          {!canEdit && (
            <span className="block mt-2 font-medium text-amber-600">
              Only Project Managers and Owners can modify these settings.
            </span>
          )}
        </p>
      </div>

      <div className="px-4 py-5 sm:p-6 space-y-6">
        {/* Toggle 1 */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Move linked task to IN_REVIEW when PR is opened</h4>
          </div>
          <button
            type="button"
            disabled={!canEdit || updateMutation.isLoading}
            onClick={() => handleToggle('autoUpdateTaskOnPROpen')}
            className={`${
              localSettings.autoUpdateTaskOnPROpen ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
          >
            <span
              className={`${
                localSettings.autoUpdateTaskOnPROpen ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>

        {/* Toggle 2 */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Mark linked task DONE when PR is merged</h4>
          </div>
          <button
            type="button"
            disabled={!canEdit || updateMutation.isLoading}
            onClick={() => handleToggle('autoCompleteTaskOnPRMerge')}
            className={`${
              localSettings.autoCompleteTaskOnPRMerge ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
          >
            <span
              className={`${
                localSettings.autoCompleteTaskOnPRMerge ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>

        {/* Toggle 3 */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Close linked internal issue when GitHub issue is closed</h4>
          </div>
          <button
            type="button"
            disabled={!canEdit || updateMutation.isLoading}
            onClick={() => handleToggle('autoUpdateIssueOnGitHubIssueClose')}
            className={`${
              localSettings.autoUpdateIssueOnGitHubIssueClose ? 'bg-blue-600' : 'bg-gray-200'
            } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${!canEdit && 'opacity-50 cursor-not-allowed'}`}
          >
            <span
              className={`${
                localSettings.autoUpdateIssueOnGitHubIssueClose ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default GithubSyncSettings;
