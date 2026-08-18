import React, { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import AIMessage from './AIMessage';
import AIChatInput from './AIChatInput';
import AIStarterQuestions from './AIStarterQuestions';

const AIChat = ({ 
  messages, 
  onSendMessage, 
  isSending, 
  isError, 
  hasConversation,
  isLoadingMessages
}) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleStarterQuestion = (question) => {
    onSendMessage(question);
  };

  const renderContent = () => {
    if (!hasConversation) {
      return <AIStarterQuestions onSelectQuestion={handleStarterQuestion} />;
    }

    if (isLoadingMessages) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p>Loading conversation...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col pt-6 pb-2 px-4 max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <AIMessage key={msg.id || idx} message={msg} />
        ))}
        
        {isSending && (
          <div className="flex w-full justify-start mb-6">
            <div className="flex max-w-[85%] flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mr-3">
                <Bot size={18} />
              </div>
              <div className="flex flex-col items-start">
                <div className="text-xs text-gray-500 mb-1 px-1">AI Assistant</div>
                <div className="px-4 py-3 bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-[46px]">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="mx-auto my-4 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {isError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
      <div className="flex-shrink-0 w-full z-10">
        <AIChatInput 
          onSendMessage={onSendMessage} 
          isSending={isSending} 
          disabled={!hasConversation && isSending} 
        />
      </div>
    </div>
  );
};

export default AIChat;
