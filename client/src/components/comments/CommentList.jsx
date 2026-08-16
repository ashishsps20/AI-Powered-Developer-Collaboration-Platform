import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { commentService } from '../../services/commentService';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { MessageSquare } from 'lucide-react';

const CommentList = ({ entityType, entityId }) => {
  const { organizationId, projectId } = useParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryKey = ['comments', organizationId, projectId, entityType, entityId, page];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => commentService.getComments(organizationId, projectId, entityType, entityId, page, limit)
  });

  const createMutation = useMutation({
    mutationFn: (newComment) => commentService.createComment(organizationId, projectId, newComment),
    onSuccess: () => {
      // Invalidate queries to refetch comments
      queryClient.invalidateQueries({ queryKey: ['comments', organizationId, projectId, entityType, entityId] });
      // Also invalidate activity feed
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }) => commentService.updateComment(organizationId, projectId, commentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', organizationId, projectId, entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentService.deleteComment(organizationId, projectId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', organizationId, projectId, entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: ['activity', organizationId, projectId] });
    }
  });

  const handleCreateComment = (content, mentions, resetCb) => {
    createMutation.mutate({
      entityType,
      entityId,
      content,
      mentions
    }, {
      onSuccess: () => {
        resetCb();
      }
    });
  };

  const handleEditComment = (commentId, content, mentions, resetCb) => {
    updateMutation.mutate({
      commentId,
      content,
      // Our backend doesn't explicitly support updating mentions right now, 
      // but let's pass it anyway if needed. 
    }, {
      onSuccess: () => {
        resetCb();
      }
    });
  };

  const handleDeleteComment = (commentId) => {
    deleteMutation.mutate(commentId);
  };

  if (isLoading && page === 1) {
    return <div className="animate-pulse flex space-x-4 py-4">
      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>;
  }

  if (isError) {
    return <div className="text-red-500 py-4">Error loading comments: {error.message}</div>;
  }

  const comments = data?.data?.comments || [];
  const pagination = data?.data?.pagination;
  const hasMore = pagination && pagination.page < pagination.totalPages;

  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
      
      {comments.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">No comments yet.</p>
          <p className="text-gray-500 text-sm">Start the conversation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* We reverse it so newest is at bottom or top depending on preference. 
              The backend sorts by createdAt: -1 (newest first). 
              Usually comments are displayed oldest first (top to bottom) or newest first. 
              Let's just map them. The newest is index 0. We'll render newest at top. */}
          {comments.map(comment => (
            <CommentItem 
              key={comment._id} 
              comment={comment} 
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setPage(p => p + 1)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Load older comments
          </button>
        </div>
      )}

      <div className="mt-6">
        <CommentInput 
          onSubmit={handleCreateComment}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
};

export default CommentList;
