import React from 'react';
import { Link } from 'react-router-dom';

export default function KnowledgeSearchResult({ result, organizationId, projectId }) {
  const { document, chunk } = result;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <Link 
        to={`/app/org/${organizationId}/projects/${projectId}/knowledge/${document._id}`}
        className="block"
      >
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <h4 className="text-md font-semibold text-blue-600 hover:underline line-clamp-1">
            {document.title}
          </h4>
        </div>
        {chunk.section && (
          <div className="text-xs font-medium text-gray-500 mb-2 bg-gray-100 inline-block px-2 py-1 rounded">
            Section: {chunk.section}
          </div>
        )}
        <p className="text-sm text-gray-600 line-clamp-3">
          {chunk.content}
        </p>
      </Link>
    </div>
  );
}
