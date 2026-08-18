import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMarkAsRead } from '../../hooks/useNotifications';

const getEntityUrl = (notification) => {
  const { type, projectId } = notification;
  
  if (type === 'TASK_ASSIGNED' || type === 'TASK_STATUS_CHANGED') {
    return `/app/org/${notification.project?.organization || 'default'}/projects/${projectId}/tasks`;
  }
  if (type === 'ISSUE_ASSIGNED' || type === 'ISSUE_STATUS_CHANGED') {
    return `/app/org/${notification.project?.organization || 'default'}/projects/${projectId}/issues`;
  }
  if (type === 'MENTION' || type === 'COMMENT_ON_TASK' || type === 'COMMENT_ON_ISSUE') {
    // Navigate to tasks or issues depending on context
    return `/app/org/${notification.project?.organization || 'default'}/projects/${projectId}/${type.includes('ISSUE') ? 'issues' : 'tasks'}`;
  }
  if (type === 'PROJECT_INVITATION' || type === 'PROJECT_MEMBER_ADDED' || type === 'PROJECT_MANAGER_CHANGED') {
    return `/app/org/${notification.project?.organization || 'default'}/projects/${projectId}`;
  }
  if (type.startsWith('GITHUB')) {
    return `/app/org/${notification.project?.organization || 'default'}/projects/${projectId}/github`;
  }
  return null;
};

const NotificationItem = ({ notification, onClickCallback }) => {
  const navigate = useNavigate();
  const { mutate: markAsRead } = useMarkAsRead();

  const handleClick = (e) => {
    e.preventDefault();
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    const url = getEntityUrl(notification);
    if (url) {
      navigate(url);
    }
    
    if (onClickCallback) {
      onClickCallback();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 ease-in-out border-b border-gray-100 last:border-b-0 ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {notification.actor?.avatar ? (
          <img 
            src={notification.actor.avatar} 
            alt={notification.actor.name || 'System'} 
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {notification.actor?.name?.charAt(0) || 'S'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-snug">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
