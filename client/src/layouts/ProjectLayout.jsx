import React, { useEffect } from 'react';
import { Outlet, useParams, Link, useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';
import { useProjectRealtime } from '../hooks/useProjectRealtime';

const ProjectLayout = () => {
  const { organizationId, projectId } = useParams();
  const navigate = useNavigate();
  
  const { currentOrganization, setCurrentOrganization } = useOrgStore();
  const { currentProject, fetchProject, fetchProjectMembers, isLoading, error } = useProjectStore();

  useProjectRealtime(projectId);

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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600 mb-3"></div>
        <p className="text-sm text-surface-500">Loading project...</p>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white p-8 rounded-xl border border-surface-200 shadow-sm text-center max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Unable to load project</h2>
          <p className="text-sm text-surface-500 mb-6">{error ? (error.message || error) : 'Project not found'}</p>
          <Link
            to={`/app/org/${organizationId}/dashboard`}
            className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  // Simply render the child route — sidebar navigation is handled by AppShell
  return <Outlet />;
};

export default ProjectLayout;
