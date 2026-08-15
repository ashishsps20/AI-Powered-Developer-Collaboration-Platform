import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';

const WorkspaceSelection = () => {
  const { fetchOrganizations, organizations, isLoading } = useOrgStore();
  const { user, logout } = useAuthStore();
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
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading your workspaces...</p>
      </div>
    );
  }

  if (organizations.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Your Workspaces</h2>
            <p className="mt-2 text-sm text-gray-600">
              Select an organization to continue as {user?.name}
            </p>
          </div>
          <Link
            to="/onboarding/create-organization"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            New Organization
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {organizations.map((org) => (
              <li key={org.id}>
                <Link
                  to={`/app/org/${org.id}/dashboard`}
                  className="block hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-lg font-medium text-blue-600 truncate">{org.name}</p>
                      <p className="flex items-center text-sm text-gray-500 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {org.role}
                        </span>
                      </p>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <button className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                        Open
                      </button>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => logout()}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelection;
