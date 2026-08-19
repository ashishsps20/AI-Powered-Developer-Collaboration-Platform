import React from 'react';
import { Search } from 'lucide-react';

const SearchTrigger = () => {
  return (
    <button
      className="hidden md:flex items-center gap-2.5 h-9 px-3.5 text-sm text-surface-400 bg-surface-100 border border-surface-200 rounded-lg hover:bg-surface-50 hover:border-surface-300 transition-colors cursor-pointer min-w-[220px]"
      onClick={() => {
        // Visual trigger only — no backend search implementation
      }}
    >
      <Search className="w-4 h-4 text-surface-400" strokeWidth={2} />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-surface-400 bg-white border border-surface-200 rounded">
        ⌘K
      </kbd>
    </button>
  );
};

export default SearchTrigger;
