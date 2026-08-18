import React from 'react';
import { Link } from 'react-router-dom';
import KnowledgeStatus from './KnowledgeStatus';
import { formatDistanceToNow } from 'date-fns';

export default function KnowledgeDocumentCard({ document, organizationId, projectId }) {
  const getIcon = () => {
    switch (document.fileType) {
      case 'PDF':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'MARKDOWN':
      case 'TXT':
      default:
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <Link 
                to={`/app/org/${organizationId}/projects/${projectId}/knowledge/${document._id}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-1"
                title={document.title}
              >
                {document.title}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 font-medium">{document.fileType}</span>
                <span className="text-gray-300">&bull;</span>
                <span className="text-xs text-gray-500">v{document.version}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-gray-600 line-clamp-2" title={document.description}>
          {document.description || 'No description provided.'}
        </p>
      </div>

      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <KnowledgeStatus status={document.processingStatus} />
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-500">
            {document.chunkCount > 0 ? `${document.chunkCount} chunks` : 'No chunks'}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            Updated {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
