import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { ErrorBoundary } from '../components/ErrorBoundary';

const OrganizationDashboard = () => {
  const { organizationId } = useParams();
  const { setCurrentOrganization, currentOrganization, currentRole, isLoading: orgLoading, error: orgError } = useOrgStore();
  const { fetchProjects, projects, isLoading: projectsLoading, error: projectsError } = useProjectStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    setCurrentOrganization(organizationId).catch(() => {});
    fetchProjects(organizationId).catch(() => {});
  }, [organizationId, setCurrentOrganization, fetchProjects]);

  const isLoading = orgLoading;
  const error = orgError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading workspace...</p>
      </div>
    );
  }

  if (error) {
    let errorMessage = 'Something went wrong.';
    
    if (error.statusCode === 401) {
      errorMessage = 'Authentication required.';
    } else if (error.statusCode === 403 || error.message?.includes('access')) {
      errorMessage = "You don't have access to this organization.";
    } else if (error.statusCode === 404 || error.message?.includes('not found')) {
      errorMessage = 'Organization not found.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10 text-center max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Link
            to="/app"
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  if (!currentOrganization) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{currentOrganization.name}</h1>
            <p className="text-gray-500 mt-1">{currentOrganization.description || 'No description provided'}</p>
          </div>
          <Link
            to="/app"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 bg-blue-50 px-3 py-1 rounded-md"
          >
            Switch Workspace
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Role</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {currentRole}
            </span>
          </div>
          
          <Link to={`/app/org/${organizationId}/members`} className="bg-gray-50 p-6 rounded-lg border hover:bg-gray-100 transition-colors block text-left">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Members</h3>
            <p className="text-gray-500 text-sm">View and manage organization members.</p>
          </Link>
          
          {currentRole === 'OWNER' && (
            <Link to={`/app/org/${organizationId}/invitations`} className="bg-gray-50 p-6 rounded-lg border hover:bg-gray-100 transition-colors block text-left">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pending Invitations</h3>
              <p className="text-gray-500 text-sm">View and manage pending organization invitations.</p>
            </Link>
          )}

        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            {currentRole === 'OWNER' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Project
              </button>
            )}
          </div>

          {projectsLoading ? (
            <p className="text-gray-500">Loading projects...</p>
          ) : projectsError ? (
            <p className="text-red-500">{typeof projectsError === 'object' ? projectsError.message || 'Error loading projects' : projectsError}</p>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first project to start collaborating.
              </p>
              {currentRole === 'OWNER' && (
                <div className="mt-6">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(project => (
                <Link
                  key={project.id}
                  to={`/app/org/${organizationId}/projects/${project.id}`}
                  className="block bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate pr-4">{project.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Project Manager:</span> {project.projectManager?.name || 'Unassigned'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <ErrorBoundary>
          <CreateProjectModal
            organizationId={organizationId}
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </ErrorBoundary>

        <div className="mt-8 text-center pt-6 border-t border-gray-200">
          <button
            onClick={() => logout()}
            className="text-sm font-medium text-red-600 hover:text-red-500"
          >
            Logout completely
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
