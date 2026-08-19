import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action, actionLabel, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-5">
          <Icon className="w-7 h-7 text-surface-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-semibold text-surface-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-surface-500 text-center max-w-sm mb-6">{description}</p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
