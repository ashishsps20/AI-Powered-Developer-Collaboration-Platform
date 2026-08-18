import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const Home = () => {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get('/health');
        if (response.data?.success || response.data?.status === 'ok') {
          setBackendStatus('success');
        } else {
          setBackendStatus('error');
          setErrorDetails('Backend responded but with an unknown status.');
        }
      } catch (err) {
        if (err.response && err.response.status === 503 && err.response.data?.status === 'degraded') {
          // The backend is running, but Redis is down.
          setBackendStatus('degraded');
          setErrorDetails('Backend is running in degraded mode (Redis cache is offline). The core database is fully functional.');
        } else {
          setBackendStatus('error');
          setErrorDetails('Backend unavailable. Please make sure the server is running.');
        }
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-4">
          AI Developer Collaboration Platform
        </h2>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Frontend is running successfully. Module 1 foundation setup is complete.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 w-full max-w-md border border-gray-100 shadow-inner">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">System Status</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Frontend</span>
            <StatusBadge status="success" text="Running" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Backend Connection</span>
            {backendStatus === 'loading' && <StatusBadge status="loading" text="Checking backend..." />}
            {backendStatus === 'success' && <StatusBadge status="success" text="Connected" />}
            {backendStatus === 'degraded' && <StatusBadge status="warning" text="Degraded" />}
            {backendStatus === 'error' && <StatusBadge status="error" text="Unable to connect" />}
          </div>
        </div>

        {(backendStatus === 'error' || backendStatus === 'degraded') && (
          <div className={`mt-4 p-3 border rounded-md text-sm ${backendStatus === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
            {errorDetails}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
