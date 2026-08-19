import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import organizationService from '../services/organizationService';
import useOrgStore from '../store/orgStore';
import InviteMemberModal from '../components/organization/InviteMemberModal';

const OrganizationMembers = () => {
  const { organizationId } = useParams();
  const { currentOrganization, currentRole, setCurrentOrganization } = useOrgStore();
  
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const data = await organizationService.getMembers(organizationId);
      setMembers(data.data.members);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentOrganization || currentOrganization.id !== organizationId) {
      setCurrentOrganization(organizationId).catch(() => {});
    }
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleRemoveClick = (member) => {
    setMemberToRemove(member);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await organizationService.removeMember(organizationId, memberToRemove.user.id || memberToRemove.id);
      await fetchMembers();
      setMemberToRemove(null);
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancelRemove = () => {
    setMemberToRemove(null);
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Members</h1>
          <p className="text-sm text-surface-500 mt-1">Manage who has access to {currentOrganization?.name}</p>
        </div>
        <div className="flex gap-3">
          {currentRole === 'OWNER' && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              Invite Member
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="px-6 py-4 animate-pulse flex justify-between items-center">
                <div className="flex items-center space-x-4 w-full">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="space-y-2 w-1/3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </li>
            ))
          ) : members.length === 0 ? (
            <li className="px-6 py-8 text-center text-gray-500">
              No members found.
            </li>
          ) : (
            members.map((member) => (
              <li key={member.id || member._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                    <div className="text-sm text-gray-500">{member.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {member.role}
                  </span>
                  <span className="text-sm text-gray-500 hidden sm:block">
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                  {currentRole === 'OWNER' && member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveClick(member)}
                      className="text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                    >
                      Remove
                    </button>
                  )}
                  {(currentRole !== 'OWNER' || member.role === 'OWNER') && (
                    <div className="w-12"></div> // Placeholder for alignment
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <InviteMemberModal
        organizationId={organizationId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInviteSuccess={fetchMembers}
      />

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 sm:p-0">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-sm transform transition-all p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Remove Member?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove <span className="font-medium text-gray-900">{memberToRemove.user.name}</span> from {currentOrganization?.name}? They will lose access to all projects and data within this organization.
            </p>
            <div className="flex flex-row-reverse space-x-2 space-x-reverse">
              <button
                onClick={handleConfirmRemove}
                disabled={isRemoving}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove Member'}
              </button>
              <button
                onClick={handleCancelRemove}
                disabled={isRemoving}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationMembers;
