import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import organizationService from '../services/organizationService';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitialized } = useAuthStore();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [orgId, setOrgId] = useState(null);

  useEffect(() => {
    // Wait until auth is initialized
    if (!isInitialized) return;

    if (!token) {
      setStatus('error');
      setErrorMsg('No invitation token provided in the URL.');
      return;
    }

    if (!isAuthenticated) {
      // User is not logged in. Redirect to login, but pass the current URL as state.from
      navigate('/login', { state: { from: location.pathname + location.search }, replace: true });
      return;
    }

    // User is logged in and we have a token. Try to accept the invitation.
    acceptInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, isAuthenticated, token, navigate]);

  const acceptInvite = async () => {
    try {
      setStatus('verifying');
      const response = await organizationService.acceptInvitation(token);
      setOrgId(response.data?.organization?.id || response.data?.organization?._id);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      if (err.statusCode === 400 && err.message?.toLowerCase().includes('expired')) {
        setErrorMsg('This invitation has expired.');
      } else if (err.statusCode === 403 && err.message?.toLowerCase().includes('email')) {
        setErrorMsg('This invitation was sent to a different email address. Please log in with the invited account.');
      } else if (err.statusCode === 404) {
        setErrorMsg('Invitation not found or has already been processed.');
      } else {
        setErrorMsg(err.message || 'Failed to accept invitation.');
      }
    }
  };

  if (!isInitialized || (!isAuthenticated && status !== 'error')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Verifying authentication state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
        
        {status === 'verifying' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <svg className="h-8 w-8 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Accepting Invitation</h2>
            <p className="mt-2 text-sm text-gray-500">Please wait while we process your invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Invitation Accepted!</h2>
            <p className="mt-2 text-sm text-gray-500">You joined the organization successfully.</p>
            <div className="mt-8">
              <Link
                to={orgId ? `/app/org/${orgId}/dashboard` : '/app'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Invitation Failed</h2>
            <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
            <div className="mt-8 space-y-3">
              {errorMsg.includes('log in with the invited account') && (
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Log out and try again
                </button>
              )}
              <Link
                to="/app"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AcceptInvitation;
