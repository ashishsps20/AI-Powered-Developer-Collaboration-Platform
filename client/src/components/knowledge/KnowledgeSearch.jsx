import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchKnowledge } from '../../services/knowledgeService';
import KnowledgeSearchResult from './KnowledgeSearchResult';

export default function KnowledgeSearch({ organizationId, projectId }) {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');

  const { data: searchResults, isLoading, isError, error } = useQuery({
    queryKey: ['knowledge-search', organizationId, projectId, activeQuery],
    queryFn: () => searchKnowledge(organizationId, projectId, activeQuery),
    enabled: !!activeQuery,
    staleTime: 30000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setActiveQuery(query.trim());
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
      <div className="p-4 border-b border-gray-200">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search project knowledge..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="hidden">Search</button>
        </form>
      </div>

      {activeQuery && (
        <div className="p-4 bg-gray-50 max-h-[500px] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Searching project knowledge...</span>
            </div>
          )}

          {isError && (
            <div className="text-center py-8">
              <p className="text-red-500">
                {error.response?.status === 429 
                  ? 'Search limit reached. Please try again later.' 
                  : 'Unable to search project knowledge.'}
              </p>
              <button 
                onClick={() => setActiveQuery('')}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            </div>
          )}

          {!isLoading && !isError && searchResults?.results?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No relevant project knowledge found.
            </div>
          )}

          {!isLoading && !isError && searchResults?.results?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4 uppercase tracking-wider">Search Results</h3>
              <div className="space-y-4">
                {searchResults.results.map((result, idx) => (
                  <KnowledgeSearchResult 
                    key={idx} 
                    result={result} 
                    organizationId={organizationId} 
                    projectId={projectId} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
