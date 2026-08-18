import React from 'react';
import NotificationBell from '../notifications/NotificationBell';
import RealtimeConnectionIndicator from '../realtime/RealtimeConnectionIndicator';
import { Link } from 'react-router-dom';

const AuthenticatedNav = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/app" className="text-lg font-bold text-blue-600 truncate">
            AI Platform
          </Link>
        </div>
        <div className="flex items-center space-x-6">
          <RealtimeConnectionIndicator />
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedNav;
