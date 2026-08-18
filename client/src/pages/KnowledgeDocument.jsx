import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocument, deleteDocument, reprocessDocument } from '../services/knowledgeService';
import KnowledgeStatus from '../components/knowledge/KnowledgeStatus';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useSocket } from '../components/realtime/SocketProvider';

export default function KnowledgeDocument() {
  const { organizationId, projectId, documentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const { projectMembers } = useProjectStore();
  const { currentRole: orgRole } = useOrgStore();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const { data: document, isLoading, isError } = useQuery({
    queryKey: ['knowledge-document', organizationId, projectId, documentId],
    queryFn: () => getDocument(organizationId, projectId, documentId),
  });

  const currentMember = (projectMembers || []).find(m => m.user?.id === user?.id || m.user === user?.id);
  const projectRole = currentMember?.role;
  const canManage = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';

  useEffect(() => {
    if (!socket || !documentId) return;

    const handleProcessing = (data) => {
      if (data.documentId === documentId) {
        updateLocalStatus('PROCESSING');
      }
    };

    const handleCompleted = (data) => {
      if (data.documentId === documentId) {
        queryClient.invalidateQueries(['knowledge-document', organizationId, projectId, documentId]);
      }
    };

    const handleFailed = (data) => {
      if (data.documentId === documentId) {
        updateLocalStatus('FAILED');
      }
    };

    const updateLocalStatus = (status) => {
      queryClient.setQueryData(['knowledge-document', organizationId, projectId, documentId], (old) => {
        if (!old) return old;
        return { ...old, processingStatus: status };
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
  }, [socket, documentId, organizationId, projectId, queryClient]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this document? This will remove the document from the project knowledge base.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteDocument(organizationId, projectId, documentId);
      toast.success('Document deleted');
      queryClient.invalidateQueries(['knowledge-documents', organizationId, projectId]);
      navigate(`/app/org/${organizationId}/projects/${projectId}/knowledge`);
    } catch (error) {
      toast.error('Failed to delete document');
      setIsDeleting(false);
    }
  };

  const handleReprocess = async () => {
    if (!window.confirm('Reprocess this document? The current knowledge index will be rebuilt.')) {
      return;
    }
    
    setIsReprocessing(true);
    try {
      await reprocessDocument(organizationId, projectId, documentId);
      toast.success('Document reprocessing started');
      queryClient.invalidateQueries(['knowledge-document', organizationId, projectId, documentId]);
    } catch (error) {
      toast.error('Failed to reprocess document');
    } finally {
      setIsReprocessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading document...</span>
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Document not found or access denied.</p>
        <Link 
          to={`/app/org/${organizationId}/projects/${projectId}/knowledge`}
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          to={`/app/org/${organizationId}/projects/${projectId}/knowledge`}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Knowledge
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 break-words">
              {document.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {document.description || 'No description provided.'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <KnowledgeStatus status={document.processingStatus} />
            {document.processingStatus === 'FAILED' && (
              <span className="text-xs text-red-500">Processing failed</span>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Document Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="text-gray-500 w-24">Source:</span>
                      <span className="font-medium truncate">{document.sourceType} ({document.fileType})</span>
                    </div>
                  </li>
                  <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="text-gray-500 w-24">Version:</span>
                      <span className="font-medium truncate">Version {document.version}</span>
                    </div>
                  </li>
                  <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="text-gray-500 w-24">Size:</span>
                      <span className="font-medium truncate">{document.chunkCount} chunks indexed</span>
                    </div>
                  </li>
                </ul>
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Timestamps</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex flex-col space-y-2">
                  <span>Created: {format(new Date(document.createdAt), 'PPpp')}</span>
                  <span>Updated: {format(new Date(document.updatedAt), 'PPpp')}</span>
                  {document.uploadedBy && (
                    <span>Uploaded by: {document.uploadedBy.name}</span>
                  )}
                </div>
              </dd>
            </div>
          </dl>
        </div>
        
        {canManage && (
          <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReprocess}
              disabled={isReprocessing || document.processingStatus === 'PROCESSING'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Reprocess
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || document.processingStatus === 'PROCESSING'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {document.sourceType === 'MANUAL' && document.content && (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Document Content</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 prose max-w-none">
             <div className="whitespace-pre-wrap font-mono text-sm">{document.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
