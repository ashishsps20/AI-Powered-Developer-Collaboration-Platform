import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import PageHeader from '../components/layout/PageHeader';
import { FolderKanban, Users, Mail, Plus } from 'lucide-react';

const OrganizationDashboard = () => {
  const { organizationId } = useParams();
  const { setCurrentOrganization, currentOrganization, currentRole, isLoading: orgLoading, error: orgError } = useOrgStore();
  const { fetchProjects, projects, isLoading: projectsLoading, error: projectsError } = useProjectStore();
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600 mb-3"></div>
        <p className="text-sm text-surface-500">Loading workspace...</p>
      </div>
    );
  }

  if (error) {
    let errorMessage = 'Something went wrong.';
    if (error.statusCode === 401) errorMessage = 'Authentication required.';
    else if (error.statusCode === 403 || error.message?.includes('access')) errorMessage = "You don't have access to this organization.";
    else if (error.statusCode === 404 || error.message?.includes('not found')) errorMessage = 'Organization not found.';
    else if (error.message) errorMessage = error.message;

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white p-8 rounded-xl border border-surface-200 shadow-sm text-center max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Access Error</h2>
          <p className="text-sm text-surface-500 mb-6">{errorMessage}</p>
          <Link
            to="/app"
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Return to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  if (!currentOrganization) return null;

  return (
    <div>
      <PageHeader
        title={currentOrganization.name}
        description={currentOrganization.description || 'Organization workspace'}
        actions={
          currentRole === 'OWNER' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          )
        }
      />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-sm font-medium text-surface-500">Your Role</h3>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary-100 text-primary-700">
            {currentRole}
          </span>
        </div>

        <Link
          to={`/app/org/${organizationId}/members`}
          className="bg-white rounded-xl border border-surface-200 p-5 hover:border-primary-200 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-surface-500 group-hover:text-surface-700">Members</h3>
          </div>
          <p className="text-xs text-surface-400">View and manage members</p>
        </Link>

        {currentRole === 'OWNER' && (
          <Link
            to={`/app/org/${organizationId}/invitations`}
            className="bg-white rounded-xl border border-surface-200 p-5 hover:border-primary-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-sm font-medium text-surface-500 group-hover:text-surface-700">Invitations</h3>
            </div>
            <p className="text-xs text-surface-400">Manage pending invitations</p>
          </Link>
        )}
      </div>

      {/* Projects section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-surface-900">Projects</h2>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-surface-200 p-5 space-y-3">
                <div className="h-5 w-2/3 rounded skeleton-shimmer" />
                <div className="h-4 w-full rounded skeleton-shimmer" />
                <div className="h-4 w-1/2 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : projectsError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{typeof projectsError === 'object' ? projectsError.message || 'Error loading projects' : projectsError}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-surface-200">
            <FolderKanban className="mx-auto h-10 w-10 text-surface-300 mb-3" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-surface-900 mb-1">No projects yet</h3>
            <p className="text-sm text-surface-500 mb-5">Create your first project to start collaborating.</p>
            {currentRole === 'OWNER' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/app/org/${organizationId}/projects/${project.id}`}
                className="bg-white rounded-xl border border-surface-200 p-5 hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold text-surface-900 group-hover:text-primary-700 truncate pr-3">{project.name}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-100 text-green-700 uppercase shrink-0">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-surface-500 mb-3 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="text-xs text-surface-400">
                  <span className="font-medium text-surface-500">PM:</span> {project.projectManager?.name || 'Unassigned'}
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
    </div>
  );
};

export default OrganizationDashboard;
