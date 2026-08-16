import React from 'react';
import useProjectStore from '../store/projectStore';

const ProjectDashboard = () => {
  const { currentProject } = useProjectStore();

  if (!currentProject) return null;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Project Overview</h3>
        <div className="mt-5 border-t border-gray-200 pt-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentProject.description || 'No description provided.'}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                  {currentProject.status}
                </span>
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Project Manager</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {currentProject.projectManager ? (
                  <span>{currentProject.projectManager.name} ({currentProject.projectManager.email})</span>
                ) : (
                  <span className="text-gray-400 italic">Unassigned</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
