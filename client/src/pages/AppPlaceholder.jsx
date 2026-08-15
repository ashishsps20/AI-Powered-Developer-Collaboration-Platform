import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const AppPlaceholder = () => {
  const location = useLocation();
  const user = location.state?.user || { name: 'User' };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.name}.</h2>
        <p className="text-green-600 font-medium mb-6">Authentication successful.</p>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 text-left mb-6">
          <p className="font-semibold mb-1">Placeholder Dashboard</p>
          <p>
            The real authenticated dashboard and organization management will be implemented in the next module. The frontend currently relies on the secure HTTP-only cookie set by the backend.
          </p>
        </div>

        <Link 
          to="/" 
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default AppPlaceholder;
