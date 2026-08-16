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
  }, [organizationId, projectId, fetchProjectMembers]);

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

  // Find the current user's role in this project
  const currentUserMembership = projectMembers.find(m => m.user.id === user?.id);
  const projectRole = currentUserMembership?.role || null;
  const isManagerOrOwner = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';

  if (!currentProject) return null;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Members</h3>
            <p className="text-gray-500 mt-1 text-sm">Manage developers in {currentProject.name}.</p>
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
