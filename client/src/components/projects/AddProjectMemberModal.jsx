import React, { useState, useEffect } from 'react';
import useProjectStore from '../../store/projectStore';
import api from '../../services/api';

const AddProjectMemberModal = ({ organizationId, projectId, isOpen, onClose }) => {
  const [userId, setUserId] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [localError, setLocalError] = useState('');

  const { addProjectMember, projectMembers, isLoading, error, clearError } = useProjectStore();

  useEffect(() => {
    if (isOpen) {
      setLoadingMembers(true);
      api.get(`/organizations/${organizationId}/members`)
        .then(res => {
          // Filter out existing project members
          const orgMembers = res?.data?.data?.members || res?.data?.members || [];
          const projectMemberIds = new Set(projectMembers.map(pm => pm.user.id));
          const availableMembers = orgMembers.filter(om => !projectMemberIds.has(om.user.id));
          
          setMembers(availableMembers);
          setLoadingMembers(false);
        })
        .catch(err => {
          console.error(err);
          setLocalError('Failed to load organization members');
          setLoadingMembers(false);
        });
    } else {
      setUserId('');
      setLocalError('');
      clearError();
    }
  }, [isOpen, organizationId, projectMembers, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!userId) {
      setLocalError('Please select a member to add.');
      return;
    }

    try {
      await addProjectMember(organizationId, projectId, {
        userId,
        role: 'DEVELOPER'
      });
      onClose();
    } catch (err) {
      // Handled by store
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="relative z-10 inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add Developer</h3>
              
              {(localError || error) && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{localError || error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="member" className="block text-sm font-medium text-gray-700">Select Organization Member</label>
                  {loadingMembers ? (
                    <p className="text-sm text-gray-500 mt-1">Loading available members...</p>
                  ) : members.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-1">All organization members are already in this project.</p>
                  ) : (
                    <select
                      id="member"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                      required
                    >
                      <option value="">Select a member ▼</option>
                      {(members || []).map(member => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading || loadingMembers || members.length === 0}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Developer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProjectMemberModal;
