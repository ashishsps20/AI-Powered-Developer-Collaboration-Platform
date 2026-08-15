import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import organizationService from '../services/organizationService';

const UserInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null); // stores invitation token being processed
  const navigate = useNavigate();

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const response = await organizationService.getPendingInvitations();
      setInvitations(response.data.invitations);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (token) => {
    setActionLoadingId(token);
    try {
      const response = await organizationService.acceptInvitation(token);
      // Success, add to workspace or simply navigate to dashboard
      // The backend should return the organization id
      const orgId = response.data?.organization?.id || response.data?.organization?._id;
      if (orgId) {
        navigate(`/app/org/${orgId}/dashboard`);
      } else {
        navigate('/app');
      }
    } catch (err) {
      alert(err.message || 'Failed to accept invitation');
      await fetchInvitations();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (token) => {
    setActionLoadingId(token);
    try {
      await organizationService.rejectInvitation(token);
      await fetchInvitations();
    } catch (err) {
      alert(err.message || 'Failed to reject invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Pending Invitations</h1>
          <p className="text-sm text-gray-500 mt-1">Accept or reject invitations to join organizations</p>
        </div>
        <Link
          to="/app"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Workspaces
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="px-6 py-4 animate-pulse flex justify-between items-center">
                <div className="space-y-2 w-1/3">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </li>
            ))
          ) : invitations.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              You have no pending invitations.
            </li>
          ) : (
            invitations.map((invitation) => (
              <li key={invitation.id || invitation._id} className="px-6 py-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4">
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    {invitation.organization?.name || 'Unknown Organization'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Role: <span className="font-medium text-gray-700">{invitation.role}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleAccept(invitation.id || invitation._id)}
                    disabled={actionLoadingId === (invitation.id || invitation._id)}
                    className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoadingId === (invitation.id || invitation._id) ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleReject(invitation.id || invitation._id)}
                    disabled={actionLoadingId === (invitation.id || invitation._id)}
                    className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {actionLoadingId === (invitation.id || invitation._id) ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default UserInvitations;
