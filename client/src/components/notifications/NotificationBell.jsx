import React, { useState, useEffect } from 'react';
import { useUnreadCount } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import { useSocket } from '../realtime/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const { socket, connectionState } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || connectionState !== 'connected') return;

    const handleNewNotification = (data) => {
      // Invalidate the unread count and notifications query to fetch the latest
      queryClient.invalidateQueries(['notifications', 'unread-count']);
      queryClient.invalidateQueries(['notifications']);
      
      // We'll let the user see a toast
      if (data && data.message) {
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New Notification
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {data.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 4000 });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, connectionState, queryClient]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const unreadCount = unreadData?.count || 0;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default NotificationBell;
