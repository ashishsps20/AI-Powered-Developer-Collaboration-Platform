import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, CheckCircle2, Activity, GitCommit, GitBranch } from 'lucide-react';

const AISourceList = ({ sources }) => {
  const { organizationId, projectId } = useParams();

  if (!sources || sources.length === 0) return null;

  const renderSource = (source, index) => {
    let icon, text, link;

    switch (source.type) {
      case 'TASK':
        icon = <CheckCircle2 size={14} className="text-blue-500" />;
        text = `Task ${source.id ? '#' + source.id.slice(-4) : ''}`;
        link = `/app/org/${organizationId}/projects/${projectId}/tasks`; // Assuming task drawer is opened from Tasks page
        break;
      case 'ISSUE':
        icon = <FileText size={14} className="text-red-500" />;
        text = `Issue ${source.id ? '#' + source.id.slice(-4) : ''}`;
        link = `/app/org/${organizationId}/projects/${projectId}/issues`; 
        break;
      case 'ACTIVITY':
        icon = <Activity size={14} className="text-purple-500" />;
        text = `Activity Log`;
        link = `/app/org/${organizationId}/projects/${projectId}/activity`;
        break;
      case 'GITHUB_PR':
      case 'GITHUB_COMMIT':
        icon = <GitBranch size={14} className="text-gray-700" />;
        text = `GitHub Data`;
        link = `/app/org/${organizationId}/projects/${projectId}/github`;
        break;
      default:
        icon = <FileText size={14} className="text-gray-500" />;
        text = `Source ${source.type}`;
        link = '#';
    }

    return (
      <Link 
        key={index} 
        to={link}
        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs text-gray-700 transition-colors"
      >
        {icon}
        <span>{text}</span>
      </Link>
    );
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="text-xs text-gray-500 mb-2 font-medium">Sources used:</div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, idx) => renderSource(source, idx))}
      </div>
    </div>
  );
};

export default AISourceList;
