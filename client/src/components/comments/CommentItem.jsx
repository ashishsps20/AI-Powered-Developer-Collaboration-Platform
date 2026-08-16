import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/authStore';
import CommentInput from './CommentInput';

// Helper to render mentions nicely
const renderContent = (content) => {
  if (!content) return null;
  // react-mentions outputs: @[Display Name](id)
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }
    
    // Push the mention element
    const [fullMatch, display, id] = match;
    parts.push(
      <span key={match.index} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded font-medium text-xs mx-0.5">
        @{display}
      </span>
    );
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Push remaining text
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return parts;
};

const CommentItem = ({ comment, onEdit, onDelete }) => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  const isAuthor = user?.id === comment.author?._id;

  if (comment.isDeleted) {
    return (
      <div className="py-4 border-b border-gray-100">
        <p className="text-gray-400 italic text-sm">Comment deleted</p>
      </div>
    );
  }

  const handleEditSubmit = (content, mentionIds, resetCb) => {
    onEdit(comment._id, content, mentionIds, () => {
      setIsEditing(false);
      resetCb();
    });
  };

  return (
    <div className="py-4 border-b border-gray-100 group">
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
            {comment.author?.name?.charAt(0) || 'U'}
          </div>
          <span className="font-semibold text-sm text-gray-900">{comment.author?.name || 'Unknown User'}</span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          {comment.isEdited && (
            <span className="text-xs text-gray-400 italic">(Edited)</span>
          )}
        </div>
        
        {isAuthor && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this comment?')) {
                  onDelete(comment._id);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mt-2 pl-8">
          <CommentInput 
            initialValue={comment.content}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-700 pl-8 whitespace-pre-wrap">
          {renderContent(comment.content)}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
