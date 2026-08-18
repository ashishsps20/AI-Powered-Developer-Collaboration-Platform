import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const AIChatInput = ({ onSendMessage, isSending, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isSending && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-end gap-2">
        <div className="relative flex-1 bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Please create or select a chat first" : "Ask anything about this project..."}
            className="w-full max-h-36 min-h-[44px] py-3 pl-4 pr-12 bg-transparent border-0 focus:ring-0 resize-none text-sm leading-relaxed"
            rows={1}
            disabled={isSending || disabled}
            aria-label="Ask AI assistant"
          />
          <div className="absolute right-2 bottom-2">
            <button
              type="submit"
              disabled={!message.trim() || isSending || disabled}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
                message.trim() && !isSending && !disabled
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>
      <div className="text-center mt-2">
        <span className="text-xs text-gray-400">
          AI can make mistakes. Check important info.
        </span>
      </div>
    </div>
  );
};

export default AIChatInput;
