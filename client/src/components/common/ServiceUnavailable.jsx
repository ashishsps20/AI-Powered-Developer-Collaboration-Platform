import React from 'react';
import { ServerOff } from 'lucide-react';
import RetryButton from './RetryButton';

const ServiceUnavailable = ({ onRetry, isRetrying }) => {
  return (
    <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-8 text-center max-w-md mx-auto my-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <ServerOff className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">Service Temporarily Unavailable</h3>
      <p className="mt-2 text-sm text-gray-500 mb-6">
        Some features may be temporarily unavailable due to degraded backend infrastructure. We are actively trying to reconnect.
      </p>
      {onRetry && (
        <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
      )}
    </div>
  );
};

export default ServiceUnavailable;
