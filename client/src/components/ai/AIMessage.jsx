import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AISourceList from './AISourceList';
import { Bot, User } from 'lucide-react';

const AIMessage = ({ message }) => {
  const isAI = message.role === 'ASSISTANT' || message.role === 'SYSTEM';

  return (
    <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isAI ? 'bg-blue-100 text-blue-600 mr-3' : 'bg-gray-200 text-gray-600 ml-3'
        }`}>
          {isAI ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
          <div className="text-xs text-gray-500 mb-1 px-1">
            {isAI ? 'AI Assistant' : 'You'}
          </div>
          
          <div className={`relative px-4 py-3 rounded-2xl ${
            isAI 
              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm' 
              : 'bg-blue-600 text-white rounded-tr-none shadow'
          }`}>
            <div className={`prose prose-sm max-w-none ${isAI ? 'prose-blue' : 'prose-invert'}`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Enhance code block rendering safely
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline ? (
                      <div className="relative group rounded-md overflow-hidden my-2">
                        <div className="bg-gray-800 text-gray-200 text-xs px-3 py-1 flex justify-between items-center">
                          <span>{match ? match[1] : 'code'}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                            className="text-gray-400 hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-3 overflow-x-auto text-sm m-0">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Display sources if AI attached any */}
            {isAI && message.sources && message.sources.length > 0 && (
              <AISourceList sources={message.sources} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMessage;
