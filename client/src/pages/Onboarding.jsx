import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';

const Onboarding = () => {
  const { fetchOrganizations, organizations, isLoading } = useOrgStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOrgs = async () => {
      const orgs = await fetchOrganizations();
      if (orgs.length > 0) {
        navigate('/app');
      }
    };
    checkOrgs();
  }, [fetchOrganizations, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading your workspaces...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white py-10 px-6 shadow sm:rounded-lg sm:px-12 text-center max-w-md w-full">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Welcome, {user?.name}!</h2>
        
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <p className="text-lg text-gray-700 mb-2">You're not part of an organization yet.</p>
        <p className="text-sm text-gray-500 mb-8">
          Create your first organization to start collaborating with developers, managing projects, and using AI tools.
        </p>

        <Link
          to="/onboarding/create-organization"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4"
        >
          Create Organization
        </Link>
        
        <button
          onClick={() => logout()}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
