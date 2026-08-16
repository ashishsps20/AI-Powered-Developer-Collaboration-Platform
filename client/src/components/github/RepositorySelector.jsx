import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { githubService } from '../../services/githubService';
import { Search, Code, Lock, Globe } from 'lucide-react';

const RepositorySelector = ({ onConnect, isConnecting, onNeedsAuth }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // all, public, private

  const { data, isLoading, error } = useQuery({
    queryKey: ['githubRepositories'],
    queryFn: githubService.getRepositories,
    retry: 0, // Don't retry so we can catch 404 immediately
  });

  React.useEffect(() => {
    if (error?.response?.data?.message === 'GitHub connection not found') {
      if (onNeedsAuth) {
        onNeedsAuth();
      }
    }
  }, [error, onNeedsAuth]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-500">Loading repositories...</p>
      </div>
    );
  }

  if (error) {
    if (error.response?.data?.message === 'GitHub connection not found') {
      return null;
    }
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading repositories</h3>
            <p className="text-sm text-red-700 mt-1">{error.response?.data?.message || 'Could not access GitHub repositories. Your session might have expired.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const repositories = data?.data?.repositories || [];

  const filteredRepositories = repositories.filter(repo => {
    const matchesSearch = (repo.fullName || repo.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all' 
      ? true 
      : (visibilityFilter === 'private' ? repo.private : !repo.private);
    
    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Select Repository</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Choose a GitHub repository to connect to this project.
        </p>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <select
            className="block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md py-2"
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {filteredRepositories.length === 0 ? (
          <li className="px-4 py-8 text-center text-gray-500">
            No repositories found matching your filters.
          </li>
        ) : (
          filteredRepositories.map((repo) => (
            <li key={repo.id} className="px-4 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <Code className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{repo.name}</p>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${repo.private ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {repo.private ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{repo.fullName}</p>
                  <p className="text-xs text-gray-400 mt-1">Default branch: {repo.defaultBranch}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onConnect(repo)}
                disabled={isConnecting}
                className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Connect
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RepositorySelector;
