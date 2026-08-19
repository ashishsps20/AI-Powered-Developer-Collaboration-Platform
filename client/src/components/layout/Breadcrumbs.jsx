import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import useOrgStore from '../../store/orgStore';
import useProjectStore from '../../store/projectStore';

const Breadcrumbs = () => {
  const { organizationId, projectId, documentId } = useParams();
  const location = useLocation();
  const { currentOrganization } = useOrgStore();
  const { currentProject } = useProjectStore();

  const crumbs = [];

  if (organizationId) {
    crumbs.push({
      label: currentOrganization?.name || 'Organization',
      href: `/app/org/${organizationId}/dashboard`,
    });
  }

  if (projectId) {
    crumbs.push({
      label: currentProject?.name || 'Project',
      href: `/app/org/${organizationId}/projects/${projectId}`,
    });

    // Determine current page name from URL path
    const pathAfterProject = location.pathname.split(`/projects/${projectId}`)[1] || '';
    const segment = pathAfterProject.split('/').filter(Boolean)[0];

    const pageNames = {
      tasks: 'Tasks',
      issues: 'Issues',
      activity: 'Activity',
      members: 'Members',
      github: 'GitHub',
      knowledge: 'Knowledge',
      ai: 'AI Assistant',
    };

    if (segment && pageNames[segment]) {
      crumbs.push({
        label: pageNames[segment],
        href: `/app/org/${organizationId}/projects/${projectId}/${segment}`,
      });
    }

    if (segment === 'knowledge' && documentId) {
      crumbs.push({
        label: 'Document',
        href: null, // Current page
      });
    }
  }

  // Don't render if we have no crumbs or only 1
  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-5" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-surface-300 shrink-0" />
          )}
          {index === crumbs.length - 1 || !crumb.href ? (
            <span className="text-surface-500 font-medium truncate max-w-[160px]">
              {crumb.label}
            </span>
          ) : (
            <Link
              to={crumb.href}
              className="text-surface-400 hover:text-surface-700 transition-colors truncate max-w-[160px]"
            >
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
