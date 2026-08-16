import React, { useState } from 'react';
import MentionInput from './MentionInput';
import { Send } from 'lucide-react';

const CommentInput = ({ onSubmit, isSubmitting, initialValue = '', onCancel }) => {
  const [content, setContent] = useState(initialValue || '');
  const [mentions, setMentions] = useState([]);

  const handleChange = (newValue, newMentions) => {
    setContent(newValue);
    setMentions(newMentions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    // React-mentions outputs format like: @[Display Name](id)
    // The backend expects plain text and an array of mention IDs.
    // Wait, the backend expects mentions as array of ObjectIds.
    const mentionIds = mentions.map(m => m.id);

    // We can also clean up the content if we want, or send the raw markup.
    // Let's send the raw markup to backend so we can render it later, but our backend
    // might just store what we send. The user prompt says "internally maintain mentioned user ID".
    // React-mentions raw text is like `Hi @[Rahul](1234), how are you?`
    // We will send this to backend.
    
    onSubmit(content, mentionIds, () => {
      setContent('');
      setMentions([]);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col gap-2">
        <MentionInput
          value={content}
          onChange={handleChange}
          placeholder="Write a comment... (Type @ to mention)"
          disabled={isSubmitting}
        />
        <div className="flex justify-end gap-2 mt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {onCancel ? 'Save' : 'Send'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentInput;
