import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';
import useAuthStore from '../store/authStore';
import AddProjectMemberModal from '../components/projects/AddProjectMemberModal';
import ReassignManagerModal from '../components/projects/ReassignManagerModal';
import api from '../services/api';

const ProjectMembers = () => {
  const { organizationId, projectId } = useParams();
  const { currentOrganization, currentRole: orgRole, setCurrentOrganization } = useOrgStore();
  const { currentProject, projectMembers, fetchProject, fetchProjectMembers, removeProjectMember, isLoading, error } = useProjectStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [orgMembersMap, setOrgMembersMap] = useState({});

  useEffect(() => {
    if (!currentOrganization || currentOrganization.id !== organizationId) {
      setCurrentOrganization(organizationId).catch(() => {});
    }
    fetchProject(organizationId, projectId).catch(() => {});
    fetchProjectMembers(organizationId, projectId).catch(() => {});
    
    // Fetch org members for role display
    api.get(`/organizations/${organizationId}/members`)
      .then(res => {
        const map = {};
        const fetchedMembers = res?.data?.data?.members || res?.data?.members || [];
        fetchedMembers.forEach(m => {
          map[m.user.id] = m.role;
        });
        setOrgMembersMap(map);
      })
      .catch(() => {});
  }, [organizationId, projectId, currentOrganization, setCurrentOrganization, fetchProject, fetchProjectMembers]);

  // Handle re-fetch when modals close
  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setIsReassignModalOpen(false);
    fetchProjectMembers(organizationId, projectId).catch(() => {});
    fetchProject(organizationId, projectId).catch(() => {}); // Re-fetch project to update manager info if it changed
  };

  const handleRemove = async (userId, userName) => {
    if (window.confirm(`Remove ${userName} from this project?`)) {
      setRemoveError('');
      try {
        await removeProjectMember(organizationId, projectId, userId);
      } catch (err) {
        setRemoveError(err.message || 'Failed to remove developer');
      }
    }
  };

  if (isLoading && !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading members...</p>
      </div>
    );
  }

  if (error || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-white py-8 px-6 shadow sm:rounded-lg sm:px-10 text-center max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error?.message || 'Project not found'}</p>
          <Link
            to={`/app/org/${organizationId}/dashboard`}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Organization
          </Link>
        </div>
      </div>
    );
  }

  // Find the current user's role in this project
  const currentUserMembership = projectMembers.find(m => m.user.id === user?.id);
  const projectRole = currentUserMembership?.role || null;
  const isManagerOrOwner = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 w-full max-w-4xl">
        <div className="mb-4 flex space-x-2">
          <Link to={`/app/org/${organizationId}/dashboard`} className="text-sm text-blue-600 hover:underline">
            {currentOrganization?.name || 'Organization'}
          </Link>
          <span className="text-gray-400">/</span>
          <Link to={`/app/org/${organizationId}/projects/${projectId}`} className="text-sm text-blue-600 hover:underline">
            {currentProject.name}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-500">Members</span>
        </div>

        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Project Members</h1>
            <p className="text-gray-500 mt-2">Manage developers in {currentProject.name}.</p>
          </div>
          <div className="flex space-x-3">
            {isManagerOrOwner && (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Developer
                </button>
                <button
                  onClick={() => setIsReassignModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Change Project Manager
                </button>
              </>
            )}
          </div>
        </div>

        {removeError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{removeError}</p>
          </div>
        )}

        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {projectMembers.map((member) => (
              <li key={member.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.user.name} {user?.id === member.user.id && '(You)'}</div>
                      <div className="text-sm text-gray-500">{member.user.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    {/* Role Display */}
                    <div className="flex space-x-4 text-right">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Organization</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          orgMembersMap[member.user.id] === 'OWNER' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {orgMembersMap[member.user.id] || 'MEMBER'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Project</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'PROJECT_MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {member.role === 'PROJECT_MANAGER' ? 'PROJECT MANAGER' : 'DEVELOPER'}
                        </span>
                      </div>
                    </div>

                    {isManagerOrOwner && member.role === 'DEVELOPER' && (
                      <button
                        onClick={() => handleRemove(member.user.id, member.user.name)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 border border-transparent rounded hover:border-red-200 hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <AddProjectMemberModal
          organizationId={organizationId}
          projectId={projectId}
          isOpen={isAddModalOpen}
          onClose={handleModalClose}
        />
        
        <ReassignManagerModal
          organizationId={organizationId}
          projectId={projectId}
          isOpen={isReassignModalOpen}
          onClose={handleModalClose}
        />

      </div>
    </div>
  );
};

export default ProjectMembers;
