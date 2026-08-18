import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocuments, uploadDocument, createManualDocument } from '../services/knowledgeService';
import KnowledgeEmptyState from '../components/knowledge/KnowledgeEmptyState';
import KnowledgeDocumentList from '../components/knowledge/KnowledgeDocumentList';
import KnowledgeUploadModal from '../components/knowledge/KnowledgeUploadModal';
import KnowledgeEditor from '../components/knowledge/KnowledgeEditor';
import KnowledgeSearch from '../components/knowledge/KnowledgeSearch';
import useAuthStore from '../store/authStore';
import useProjectStore from '../store/projectStore';
import useOrgStore from '../store/orgStore';
import toast from 'react-hot-toast';

export default function ProjectKnowledge() {
  const { organizationId, projectId } = useParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { projectMembers } = useProjectStore();
  const { currentRole: orgRole } = useOrgStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { data: documents, isLoading, isError } = useQuery({
    queryKey: ['knowledge-documents', organizationId, projectId],
    queryFn: () => getDocuments(organizationId, projectId),
  });

  // Check if user has permission to manage knowledge
  const currentMember = (projectMembers || []).find(m => m.user?.id === user?.id || m.user === user?.id);
  const projectRole = currentMember?.role;
  const canManage = orgRole === 'OWNER' || projectRole === 'PROJECT_MANAGER';

  const handleUpload = async (formData) => {
    await uploadDocument(organizationId, projectId, formData);
    toast.success('Document uploaded successfully. Processing started.');
    queryClient.invalidateQueries(['knowledge-documents', organizationId, projectId]);
  };

  const handleManualSave = async (data) => {
    await createManualDocument(organizationId, projectId, data);
    toast.success('Document created successfully. Processing started.');
    queryClient.invalidateQueries(['knowledge-documents', organizationId, projectId]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading project knowledge...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load project knowledge.</p>
        <button 
          onClick={() => queryClient.invalidateQueries(['knowledge-documents', organizationId, projectId])}
          className="mt-4 text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasDocuments = documents && documents.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Knowledge Base</h2>
          <p className="mt-1 text-sm text-gray-500">
            Project documentation, architecture, and guidelines.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Upload document"
            >
              Upload Document
            </button>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="New document"
            >
              New Document
            </button>
          </div>
        )}
      </div>

      <KnowledgeSearch organizationId={organizationId} projectId={projectId} />

      {hasDocuments ? (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
          <KnowledgeDocumentList 
            documents={documents} 
            organizationId={organizationId} 
            projectId={projectId} 
          />
        </div>
      ) : (
        <KnowledgeEmptyState 
          onUploadClick={() => setIsUploadModalOpen(true)}
          onManualClick={() => setIsEditorOpen(true)}
          canManage={canManage}
        />
      )}

      {/* Modals */}
      <KnowledgeUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <KnowledgeEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleManualSave}
      />
    </div>
  );
}
