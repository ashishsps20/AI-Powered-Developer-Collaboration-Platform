import React, { useEffect, useState } from 'react';
import { useSocket } from '../realtime/SocketProvider';
import { CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const GitHubSyncStatus = ({ projectId }) => {
  const [status, setStatus] = useState('up-to-date'); // 'up-to-date', 'syncing', 'delayed'
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !projectId) return;

    const handleSyncStart = (data) => {
      if (data.projectId === projectId) {
        setStatus('syncing');
      }
    };

    const handleSyncComplete = (data) => {
      if (data.projectId === projectId) {
        setStatus('up-to-date');
        
        // Invalidate relevant queries to fetch fresh data from background job
        queryClient.invalidateQueries({
          predicate: (query) => 
            query.queryKey.includes(projectId) && 
            (query.queryKey.includes('github') || query.queryKey.includes('issues'))
        });
      }
    };

    const handleSyncError = (data) => {
      if (data.projectId === projectId) {
        setStatus('delayed');
      }
    };

    socket.on('github:sync:start', handleSyncStart);
    socket.on('github:sync:complete', handleSyncComplete);
    socket.on('github:sync:error', handleSyncError);

    // Some background jobs might not send explicit starts, so we can also listen to generic webhooks
    socket.on('github:webhook:received', handleSyncStart);

    return () => {
      socket.off('github:sync:start', handleSyncStart);
      socket.off('github:sync:complete', handleSyncComplete);
      socket.off('github:sync:error', handleSyncError);
      socket.off('github:webhook:received', handleSyncStart);
    };
  }, [socket, projectId, queryClient]);

  // If syncing, eventually timeout to 'delayed' if it takes too long (e.g. 30s)
  useEffect(() => {
    if (status === 'syncing') {
      const timer = setTimeout(() => {
        setStatus('delayed');
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === 'syncing') {
    return (
      <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
        Synchronizing...
      </div>
    );
  }

  if (status === 'delayed') {
    return (
      <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md">
        <AlertTriangle className="h-4 w-4 mr-1" />
        Sync delayed
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md">
      <CheckCircle2 className="h-4 w-4 mr-1" />
      Up to date
    </div>
  );
};

export default GitHubSyncStatus;
