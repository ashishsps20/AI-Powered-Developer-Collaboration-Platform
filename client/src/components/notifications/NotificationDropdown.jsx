import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAllAsRead } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose }) => {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ limit: 10 });
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleViewAll = () => {
    navigate('/app/notifications');
    onClose();
  };

  const notifications = data?.notifications || [];

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden flex flex-col max-h-[32rem]"
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {notifications.length > 0 && (
          <button 
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="overflow-y-auto flex-1 overscroll-contain">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => (
              <NotificationItem 
                key={notification._id} 
                notification={notification} 
                onClickCallback={onClose}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm font-medium text-gray-900">You're all caught up</p>
            <p className="text-xs text-gray-500 mt-1">No new notifications</p>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleViewAll}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 rounded hover:bg-blue-50 transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
