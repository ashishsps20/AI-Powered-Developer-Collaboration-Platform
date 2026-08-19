import React, { useState, useEffect } from 'react';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../hooks/useNotifications';
import toast from 'react-hot-toast';

const NotificationPreferences = () => {
  const { data, isLoading, error } = useNotificationPreferences();
  const { mutate: updatePreferences, isLoading: isUpdating } = useUpdateNotificationPreferences();
  
  const [preferences, setPreferences] = useState({
    taskAssignments: true,
    issueAssignments: true,
    mentions: true,
    comments: true,
    githubEvents: true,
    projectUpdates: true,
  });

  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    updatePreferences(preferences, {
      onSuccess: () => {
        toast.success('Notification preferences updated.');
      },
      onError: () => {
        toast.error('Unable to update notification preferences.');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Unable to load preferences.</p>
      </div>
    );
  }

  const preferenceItems = [
    {
      id: 'taskAssignments',
      title: 'Task assignments',
      description: 'Receive notifications when someone assigns a task to you.'
    },
    {
      id: 'issueAssignments',
      title: 'Issue assignments',
      description: 'Receive notifications when someone assigns an issue to you.'
    },
    {
      id: 'mentions',
      title: 'Mentions',
      description: 'Receive notifications when someone mentions you.'
    },
    {
      id: 'comments',
      title: 'Comments',
      description: 'Receive notifications about relevant task/issue comments.'
    },
    {
      id: 'githubEvents',
      title: 'GitHub events',
      description: 'Receive relevant GitHub notifications.'
    },
    {
      id: 'projectUpdates',
      title: 'Project updates',
      description: 'Receive important project updates.'
    }
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-surface-900 tracking-tight mb-8">Notification Preferences</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-6">
          {preferenceItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
              <div className="flex-1 pr-4">
                <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id)}
                  className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${preferences[item.id] ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                  role="switch"
                  aria-checked={preferences[item.id]}
                >
                  <span
                    aria-hidden="true"
                    className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${preferences[item.id] ? 'translate-x-5' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
