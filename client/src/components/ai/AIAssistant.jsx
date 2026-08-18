import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Bot, Menu, X } from 'lucide-react';
import AIConversationList from './AIConversationList';
import AIChat from './AIChat';
import * as aiService from '../../services/aiService';

const AIAssistant = () => {
  const { organizationId, projectId } = useParams();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const res = await aiService.getConversations(organizationId, projectId);
      setConversations(res.data.conversations || []);
    } catch (err) {
      toast.error('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [organizationId, projectId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setError(null);
        const res = await aiService.getMessages(organizationId, projectId, activeConversationId);
        setMessages(res.data.messages || []);
      } catch (err) {
        toast.error('Failed to load messages');
        setActiveConversationId(null);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeConversationId, organizationId, projectId]);

  const handleNewConversation = async () => {
    setActiveConversationId(null);
    setMessages([]);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      await aiService.deleteConversation(organizationId, projectId, id);
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSendMessage = async (text) => {
    let currentConvId = activeConversationId;
    setError(null);

    // Optimistic UI update
    const optimisticUserMessage = {
      id: Date.now().toString(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticUserMessage]);
    setIsSending(true);

    try {
      const res = await aiService.chat(organizationId, projectId, currentConvId, text);
      const { conversationId, message } = res.data;

      // If this was a new conversation, update list and ID
      if (!currentConvId) {
        setActiveConversationId(conversationId);
        // Refresh conversations to get the new one in the sidebar
        fetchConversations();
      } else if (conversations.length > 0) {
        // Just bump the conversation to top/update time
        setConversations(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(c => c._id === currentConvId);
          if (idx > -1) {
            updated[idx].lastMessageAt = new Date().toISOString();
            // Move to top
            const item = updated.splice(idx, 1)[0];
            updated.unshift(item);
          }
          return updated;
        });
      }

      setMessages(prev => [...prev, message]);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 429) {
        setError('AI request limit reached. Please try again later.');
        toast.error('Rate limit reached');
      } else {
        setError('Unable to get a response from the AI assistant.');
        toast.error('AI request failed');
      }
      // We keep the optimistic user message, but they'll need to try again
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute md:relative z-30 h-full w-72 md:w-80 bg-white transform transition-transform duration-200 ease-in-out flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {isLoadingConversations ? (
          <div className="flex flex-col items-center justify-center h-full border-r border-gray-200">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        ) : (
          <AIConversationList 
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="md:hidden flex items-center p-3 bg-white border-b border-gray-200">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md mr-3"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 font-medium text-gray-900">
            <Bot size={20} className="text-blue-600" />
            AI Assistant
          </div>
        </div>

        {/* Project Context Context Indicator (Desktop & Mobile) */}
        <div className="hidden md:flex items-center justify-center p-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-800">
          <span className="flex items-center gap-1.5">
            <Bot size={14} /> 
            Context: Project Data • Current User • Tasks • Issues • Activity • GitHub
          </span>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <AIChat 
            messages={messages}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            isError={error}
            hasConversation={activeConversationId !== null}
            isLoadingMessages={isLoadingMessages}
          />
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
