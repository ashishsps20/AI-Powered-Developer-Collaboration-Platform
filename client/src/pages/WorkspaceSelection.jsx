import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';
import { Building2, Plus, Mail } from 'lucide-react';

const WorkspaceSelection = () => {
  const { fetchOrganizations, organizations, isLoading } = useOrgStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const orgs = await fetchOrganizations();
      if (orgs.length === 0) {
        navigate('/onboarding');
      }
    };
    init();
  }, [fetchOrganizations, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600 mb-3"></div>
        <p className="text-sm text-surface-500">Loading your workspaces...</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Your Workspaces</h1>
          <p className="mt-1 text-sm text-surface-500">
            Select an organization to continue{user?.name ? ` as ${user.name}` : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/app/invitations"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-700 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invitations
          </Link>
          <Link
            to="/onboarding/create-organization"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Organization
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {organizations.map((org) => (
          <Link
            key={org.id}
            to={`/app/org/${org.id}/dashboard`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-surface-200 hover:border-primary-200 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center shrink-0">
              {org.name?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-surface-900 group-hover:text-primary-700 truncate">
                {org.name}
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-100 text-surface-600">
                  {org.role}
                </span>
              </p>
            </div>
            <div className="text-surface-300 group-hover:text-primary-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceSelection;
