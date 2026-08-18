import React, { useState } from 'react';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import NotificationItem from '../components/notifications/NotificationItem';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useNotifications({ 
    page, 
    limit, 
    unreadOnly: filter === 'UNREAD' 
  });
  const { mutate: markAllAsRead, isLoading: isMarkingAll } = useMarkAllAsRead();

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const notifications = data?.notifications || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/app/settings/notifications"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Preferences
          </Link>
          <button
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll || notifications.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${filter === 'ALL'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('UNREAD')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${filter === 'UNREAD'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Unread
          </button>
        </nav>
      </div>

      {/* List */}
      <div className="bg-white shadow sm:rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            <p>Unable to load notifications.</p>
          </div>
        ) : notifications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification._id}>
                <NotificationItem notification={notification} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {filter === 'UNREAD' ? 'No unread notifications' : "You're all caught up."}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Check back later for updates.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
