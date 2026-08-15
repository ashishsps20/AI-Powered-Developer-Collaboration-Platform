import React from 'react';
import { useLocation } from 'react-router-dom';

const Onboarding = () => {
  const location = useLocation();
  const message = location.state?.message || 'Your account has been created successfully.';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DevFlow!</h2>
          <p className="text-sm text-green-600 font-medium mb-6">{message}</p>
          <p className="text-gray-600 mb-8">
            You can now create or join an organization.
          </p>

          <div className="space-y-4">
            <button 
              disabled 
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-400 cursor-not-allowed"
            >
              Create Organization (Coming Soon)
            </button>
            <button 
              disabled 
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-400 bg-white cursor-not-allowed"
            >
              Join Organization (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
