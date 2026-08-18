import React from 'react';
import { RefreshCw } from 'lucide-react';

const RetryButton = ({ onRetry, isRetrying }) => {
  return (
    <button
      onClick={onRetry}
      disabled={isRetrying}
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw 
        className={`-ml-0.5 mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} 
        aria-hidden="true" 
      />
      {isRetrying ? 'Retrying...' : 'Retry'}
    </button>
  );
};

export default RetryButton;
