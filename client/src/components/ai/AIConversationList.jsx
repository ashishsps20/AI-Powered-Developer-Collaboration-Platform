import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

const AIConversationList = ({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  onNewConversation, 
  onDeleteConversation 
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No previous conversations. Start a new chat!
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conversations.map((conv) => (
              <li key={conv._id}>
                <div 
                  className={`w-full text-left p-4 cursor-pointer hover:bg-gray-100 transition-colors flex items-start justify-between group ${
                    activeConversationId === conv._id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                  }`}
                  onClick={() => onSelectConversation(conv._id)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={16} className={activeConversationId === conv._id ? 'text-blue-600' : 'text-gray-400'} />
                      <h3 className={`text-sm font-medium truncate ${
                        activeConversationId === conv._id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {conv.title || 'Conversation'}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 pl-6">
                      {formatDistanceToNow(new Date(conv.lastMessageAt || conv.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this conversation? This will permanently remove the conversation history.')) {
                        onDeleteConversation(conv._id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                    title="Delete conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AIConversationList;
