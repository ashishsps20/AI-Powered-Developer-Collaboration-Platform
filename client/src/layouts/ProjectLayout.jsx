import React, { useEffect } from 'react';
import { Outlet, useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';

const ProjectLayout = () => {
  const { organizationId, projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { currentOrganization, setCurrentOrganization } = useOrgStore();
  const { currentProject, fetchProject, fetchProjectMembers, isLoading, error } = useProjectStore();

  useEffect(() => {
    // Ensure org is loaded
    if (!currentOrganization || currentOrganization.id !== organizationId) {
      setCurrentOrganization(organizationId).catch(() => {});
    }
    fetchProject(organizationId, projectId).catch(() => {});
    fetchProjectMembers(organizationId, projectId).catch(() => {});
  }, [organizationId, projectId, currentOrganization, setCurrentOrganization, fetchProject, fetchProjectMembers]);

  if (isLoading && !currentProject) {
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
          <p className="text-gray-600 mb-6">{error ? (error.message || error) : 'Project not found'}</p>
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

  const tabs = [
    { name: 'Overview', href: `/app/org/${organizationId}/projects/${projectId}` },
    { name: 'Tasks', href: `/app/org/${organizationId}/projects/${projectId}/tasks` },
    { name: 'Issues', href: `/app/org/${organizationId}/projects/${projectId}/issues` },
    { name: 'Activity', href: `/app/org/${organizationId}/projects/${projectId}/activity` },
    { name: 'Members', href: `/app/org/${organizationId}/projects/${projectId}/members` },
    { name: 'GitHub', href: `/app/org/${organizationId}/projects/${projectId}/github` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div>
              <div className="mb-2">
                <Link to={`/app/org/${organizationId}/dashboard`} className="text-sm text-blue-600 hover:underline">
                  &larr; Back to {currentOrganization?.name || 'Organization'}
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {currentProject.name}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                  {currentProject.status}
                </span>
              </h1>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mt-4">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.href;
                return (
                  <Link
                    key={tab.name}
                    to={tab.href}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ProjectLayout;
