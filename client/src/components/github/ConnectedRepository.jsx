import React, { useState } from 'react';
import { Code, Globe, Lock, ExternalLink, GitBranch, GitCommit, GitPullRequest, Trash2 } from 'lucide-react';
import BranchList from './BranchList';
import CommitList from './CommitList';
import PullRequestList from './PullRequestList';

const ConnectedRepository = ({ repository, onDisconnect, isDisconnecting, userRole }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const canManage = userRole === 'OWNER' || userRole === 'PROJECT_MANAGER';

  const renderContent = () => {
    switch (activeTab) {
      case 'branches':
        return <BranchList htmlUrl={repository.htmlUrl} />;
      case 'commits':
        return <CommitList htmlUrl={repository.htmlUrl} />;
      case 'pull-requests':
        return <PullRequestList />;
      case 'overview':
      default:
        return (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Repository Overview</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Repository Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{repository.name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{repository.owner}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Default Branch</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    <GitBranch className="h-4 w-4 mr-1 text-gray-400" />
                    {repository.defaultBranch || 'main'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Links</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={repository.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 flex items-center">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on GitHub
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
            {canManage && (
              <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Danger Zone</h4>
                    <p className="text-sm text-gray-500">Disconnecting will stop syncing activity, but won't delete anything from GitHub.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Disconnect GitHub repository from this project?\n\nThis does not delete anything from GitHub.`)) {
                        onDisconnect();
                      }
                    }}
                    disabled={isDisconnecting}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect Repository
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Code className="h-8 w-8 text-gray-900 mr-4" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              {repository.fullName}
              <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${repository.private ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {repository.private ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                {repository.private ? 'Private' : 'Public'}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Connected Repository</p>
          </div>
        </div>
        <div>
          <a
            href={repository.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ExternalLink className="h-4 w-4 mr-2 text-gray-500" />
            Open Repository
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'overview', name: 'Overview', icon: Code },
            { id: 'branches', name: 'Branches', icon: GitBranch },
            { id: 'commits', name: 'Commits', icon: GitCommit },
            { id: 'pull-requests', name: 'Pull Requests', icon: GitPullRequest },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ConnectedRepository;
