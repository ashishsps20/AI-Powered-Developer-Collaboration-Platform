import React from 'react';

const PageHeader = ({ title, description, actions, className = '' }) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-surface-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
