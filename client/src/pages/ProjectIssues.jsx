import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useUIStore from '../store/uiStore';
import { issueService } from '../services/issueService';
import CreateIssueModal from '../components/issues/CreateIssueModal';
import IssueDetailModal from '../components/issues/IssueDetailModal';

const ProjectIssues = () => {
  const { organizationId, projectId } = useParams();
  const { currentProject, projectMembers } = useProjectStore();
  const { 
    issueFilters, 
    setIssueFilter, 
    setCreateIssueModalOpen,
    selectedIssueId,
    setSelectedIssueId
  } = useUIStore();

  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssues = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await issueService.getIssues(organizationId, projectId, issueFilters);
      setIssues(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load issues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId && projectId) {
      fetchIssues();
    }
  }, [organizationId, projectId, issueFilters]);

  const handleIssueCreated = (newIssue) => {
    setIssues(prev => [newIssue, ...prev]);
  };

  const handleIssueUpdated = (updatedIssue) => {
    setIssues(prev => prev.map(i => i._id === updatedIssue._id ? updatedIssue : i));
  };

  const handleIssueDeleted = (issueId) => {
    setIssues(prev => prev.filter(i => i._id !== issueId));
  };

  if (!currentProject) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Issues</h2>
          <p className="text-sm text-gray-500 mt-1">Track bugs, features, and improvements.</p>
        </div>
        <div>
          <button
            onClick={() => setCreateIssueModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + Report Issue
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            id="filter-status"
            value={issueFilters.status}
            onChange={(e) => setIssueFilter('status', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="All">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filter-type" className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            id="filter-type"
            value={issueFilters.type}
            onChange={(e) => setIssueFilter('type', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="All">All Types</option>
            <option value="BUG">Bug</option>
            <option value="FEATURE">Feature</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="QUESTION">Question</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filter-priority" className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
          <select
            id="filter-priority"
            value={issueFilters.priority}
            onChange={(e) => setIssueFilter('priority', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="All">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label htmlFor="filter-assignee" className="block text-xs font-medium text-gray-500 mb-1">Assignee</label>
          <select
            id="filter-assignee"
            value={issueFilters.assignee}
            onChange={(e) => setIssueFilter('assignee', e.target.value)}
            className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="All">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {projectMembers.map(member => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md flex-1">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading issues...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="h-64 flex items-center justify-center border-t border-gray-200 border-dashed">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No issues found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.values(issueFilters).every(v => v === 'All') 
                  ? "Get started by reporting a new issue."
                  : "Try adjusting your filters."}
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 max-h-full overflow-y-auto">
            {issues.map(issue => (
              <li key={issue._id}>
                <div 
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer block"
                  onClick={() => setSelectedIssueId(issue._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${issue.type === 'BUG' ? 'bg-red-100 text-red-800' : 
                          issue.type === 'FEATURE' ? 'bg-green-100 text-green-800' : 
                          issue.type === 'IMPROVEMENT' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {issue.type}
                      </span>
                      <p className="text-sm font-medium text-blue-600 truncate">{issue.title}</p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${issue.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : 
                          issue.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                          issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {issue.status?.replace('_', ' ') || issue.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex text-sm text-gray-500 items-center space-x-4">
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium mr-2
                          ${issue.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 
                            issue.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                            issue.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 
                            'bg-green-100 text-green-800'}`}>
                          {issue.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-xs">
                        Reported by {issue.reportedBy?.name || 'Unknown'} on {new Date(issue.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      {issue.assignedTo ? (
                        <div className="flex items-center">
                          <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-xs mr-2">
                            {issue.assignedTo.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{issue.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="italic text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateIssueModal 
        organizationId={organizationId} 
        projectId={projectId} 
        onIssueCreated={handleIssueCreated} 
      />

      {selectedIssueId && (
        <IssueDetailModal 
          organizationId={organizationId}
          projectId={projectId}
          issue={issues.find(i => i._id === selectedIssueId)}
          onIssueUpdated={handleIssueUpdated}
          onIssueDeleted={handleIssueDeleted}
        />
      )}
    </div>
  );
};

export default ProjectIssues;
