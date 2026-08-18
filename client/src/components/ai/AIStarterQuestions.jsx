import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

const starterQuestions = [
  "What is the current project status?",
  "What should I work on next?",
  "What are the biggest blockers?",
  "Summarize recent activity.",
  "According to our architecture documentation, how does authentication work?",
  "What does our API documentation say about authorization?",
  "What database architecture is documented?",
  "How does the project handle token refresh?"
];

const AIStarterQuestions = ({ onSelectQuestion }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="bg-blue-50 p-4 rounded-full mb-6">
        <MessageSquarePlus size={32} className="text-blue-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        AI Project Assistant
      </h2>
      
      <p className="text-gray-500 max-w-md mb-8">
        Ask questions about your project, tasks, issues, and development activity. 
        I can analyze the latest updates and help you stay on track.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {starterQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIStarterQuestions;
