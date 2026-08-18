import React, { useEffect } from 'react';
import KnowledgeDocumentCard from './KnowledgeDocumentCard';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../realtime/SocketProvider';

export default function KnowledgeDocumentList({ documents, organizationId, projectId }) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !projectId) return;

    const handleProcessing = (data) => {
      updateDocumentStatus(data.documentId, 'PROCESSING');
    };

    const handleCompleted = (data) => {
      // Invalidate to fetch fresh chunks count and updated metadata
      queryClient.invalidateQueries(['knowledge-documents', organizationId, projectId]);
    };

    const handleFailed = (data) => {
      updateDocumentStatus(data.documentId, 'FAILED');
    };

    const updateDocumentStatus = (documentId, status) => {
      queryClient.setQueryData(['knowledge-documents', organizationId, projectId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(doc => 
          doc._id === documentId ? { ...doc, processingStatus: status } : doc
        );
      });
    };

    socket.on('knowledge:processing', handleProcessing);
    socket.on('knowledge:completed', handleCompleted);
    socket.on('knowledge:failed', handleFailed);

    return () => {
      socket.off('knowledge:processing', handleProcessing);
      socket.off('knowledge:completed', handleCompleted);
      socket.off('knowledge:failed', handleFailed);
    };
  }, [socket, projectId, organizationId, queryClient]);

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <KnowledgeDocumentCard 
          key={doc._id} 
          document={doc} 
          organizationId={organizationId}
          projectId={projectId}
        />
      ))}
    </div>
  );
}
