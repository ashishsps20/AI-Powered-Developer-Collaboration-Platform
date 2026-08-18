import React from 'react';
import { AlertTriangle } from 'lucide-react';

const RateLimitError = () => {
  return (
    <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">Too many requests</h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>You have exceeded the rate limit. Please wait a moment and try again later.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitError;
