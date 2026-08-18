import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../components/realtime/SocketProvider';

export const useProjectRealtime = (projectId) => {
  const { socket, connectionState } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || connectionState !== 'connected' || !projectId) return;

    // Join room
    socket.joinProject(projectId);

    // Handlers
    const handleTaskUpdated = (data) => {
      // Data usually { taskId, projectId, action: 'updated', changes: {...} }
      // Invalidate project tasks and specific task
      queryClient.invalidateQueries(['project-tasks', projectId]);
      if (data.taskId) {
        queryClient.invalidateQueries(['task', data.taskId]);
      }
    };

    const handleIssueUpdated = (data) => {
      queryClient.invalidateQueries(['project-issues', projectId]);
      if (data.issueId) {
        queryClient.invalidateQueries(['issue', data.issueId]);
      }
    };

    const handleActivityNew = (data) => {
      queryClient.invalidateQueries(['project-activity', projectId]);
    };

    const handleCommentNew = (data) => {
      // Invalidate comments for a specific entity
      if (data.comment && data.comment.entityId) {
         queryClient.invalidateQueries(['comments', data.comment.entityId]);
      }
    };

    const handleMemberAdded = () => {
      queryClient.invalidateQueries(['project-members', projectId]);
    };

    const handleMemberRemoved = () => {
      queryClient.invalidateQueries(['project-members', projectId]);
    };

    const handleManagerChanged = () => {
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['project-members', projectId]);
    };

    // Attach listeners
    socket.on('task:updated', handleTaskUpdated);
    socket.on('issue:updated', handleIssueUpdated);
    socket.on('activity:new', handleActivityNew);
    socket.on('comment:new', handleCommentNew);
    socket.on('project:member-added', handleMemberAdded);
    socket.on('project:member-removed', handleMemberRemoved);
    socket.on('project:manager-changed', handleManagerChanged);

    // After reconnecting, we should refetch everything to sync missed events
    const handleReconnect = () => {
      queryClient.invalidateQueries(['project', projectId]);
      queryClient.invalidateQueries(['project-tasks', projectId]);
      queryClient.invalidateQueries(['project-issues', projectId]);
      queryClient.invalidateQueries(['project-activity', projectId]);
      queryClient.invalidateQueries(['project-members', projectId]);
      socket.joinProject(projectId); // Re-join room
    };
    
    // We bind reconnect event directly to the underlying socket io instance
    if (socket.socket) {
       socket.socket.io.on('reconnect', handleReconnect);
    }

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('issue:updated', handleIssueUpdated);
      socket.off('activity:new', handleActivityNew);
      socket.off('comment:new', handleCommentNew);
      socket.off('project:member-added', handleMemberAdded);
      socket.off('project:member-removed', handleMemberRemoved);
      socket.off('project:manager-changed', handleManagerChanged);
      
      if (socket.socket) {
         socket.socket.io.off('reconnect', handleReconnect);
      }
      
      socket.leaveProject(projectId);
    };
  }, [socket, connectionState, projectId, queryClient]);
};
