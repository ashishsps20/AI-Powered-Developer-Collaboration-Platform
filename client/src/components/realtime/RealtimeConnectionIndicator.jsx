import React from 'react';
import { useSocket } from './SocketProvider';

const RealtimeConnectionIndicator = () => {
  const { connectionState } = useSocket();

  if (connectionState === 'connected') {
    return null; // As per requirements, keep it subtle. Or we can just show a tiny green dot. Let's show nothing or a subtle tooltip. Actually, the requirements say "When connected: hide the warning."
  }

  return (
    <div className="flex items-center space-x-2 text-xs font-medium px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-100 shadow-sm animate-pulse">
      <div className={`w-2 h-2 rounded-full ${connectionState === 'reconnecting' ? 'bg-yellow-400' : 'bg-red-500'}`}></div>
      <span>
        {connectionState === 'reconnecting' ? 'Reconnecting...' : 'Real-time connection lost'}
      </span>
    </div>
  );
};

export default RealtimeConnectionIndicator;
