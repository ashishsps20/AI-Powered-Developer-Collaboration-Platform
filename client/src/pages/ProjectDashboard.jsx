import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';

const ProjectDashboard = () => {
  const { organizationId, projectId } = useParams();
  const { currentOrganization, setCurrentOrganization } = useOrgStore();
  const { currentProject, fetchProject, isLoading, error } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure org is loaded
    if (!currentOrganization || currentOrganization.id !== organizationId) {
      setCurrentOrganization(organizationId).catch(() => {});
    }
    fetchProject(organizationId, projectId).catch(() => {});
  }, [organizationId, projectId, currentOrganization, setCurrentOrganization, fetchProject]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading project...</p>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10 text-center max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error?.message || 'Project not found'}</p>
          <Link
            to={`/app/org/${organizationId}/dashboard`}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 w-full max-w-4xl">
        <div className="mb-4">
          <Link to={`/app/org/${organizationId}/dashboard`} className="text-sm text-blue-600 hover:underline">
            &larr; Back to {currentOrganization?.name || 'Organization'}
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              {currentProject.name}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 uppercase">
                {currentProject.status}
              </span>
            </h1>
            <p className="text-gray-500 mt-2">{currentProject.description || 'No description provided'}</p>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <span className="font-semibold mr-2">Project Manager:</span>
              {currentProject.projectManager ? (
                <span>{currentProject.projectManager.name} ({currentProject.projectManager.email})</span>
              ) : (
                <span className="text-gray-400 italic">Unassigned</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to={`/app/org/${organizationId}/projects/${projectId}/members`} className="bg-gray-50 p-6 rounded-lg border hover:bg-gray-100 transition-colors block text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex justify-between items-center">
              Project Members
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </h3>
            <p className="text-gray-500 text-sm">View and manage developers in this project.</p>
          </Link>

          {/* Placeholders for future modules */}
          <div className="bg-gray-50 p-6 rounded-lg border opacity-75">
            <h3 className="text-lg font-medium text-gray-500 mb-2">Tasks & Issues</h3>
            <p className="text-gray-400 text-sm italic">Coming soon</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border opacity-75">
            <h3 className="text-lg font-medium text-gray-500 mb-2">GitHub Integration</h3>
            <p className="text-gray-400 text-sm italic">Coming soon</p>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border opacity-75">
            <h3 className="text-lg font-medium text-gray-500 mb-2">AI Assistant</h3>
            <p className="text-gray-400 text-sm italic">Coming soon</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDashboard;
