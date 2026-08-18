import React from 'react';

const ProjectStatsSkeleton = () => {
  return (
    <div className="bg-white shadow sm:rounded-lg animate-pulse">
      <div className="px-4 py-5 sm:p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="mt-5 border-t border-gray-200 pt-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="sm:col-span-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatsSkeleton;
