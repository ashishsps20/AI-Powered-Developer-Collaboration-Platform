import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderKanban, ChevronDown, Check } from 'lucide-react';
import useProjectStore from '../../store/projectStore';

const ProjectSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { organizationId, projectId } = useParams();
  const { projects, currentProject, fetchProjects } = useProjectStore();

  useEffect(() => {
    if (organizationId && projectId && projects.length === 0) {
      fetchProjects(organizationId);
    }
  }, [organizationId, projectId, projects.length, fetchProjects]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Only render if we are inside a project context
  if (!projectId) return null;

  const handleSelect = (projId) => {
    setIsOpen(false);
    navigate(`/app/org/${organizationId}/projects/${projId}`);
  };

  const displayName = currentProject?.name || 'Select Project';

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-1 text-surface-300">
        <span>/</span>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg transition-colors max-w-[180px] ml-1"
      >
        <FolderKanban className="w-4 h-4 text-surface-400 shrink-0" />
        <span className="truncate">{displayName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-surface-200 py-1.5 z-50 animate-fade-in">
          <div className="px-3 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Projects
          </div>
          <div className="max-h-64 overflow-y-auto">
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => handleSelect(proj.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-50 transition-colors"
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{proj.name}</p>
                  <p className="text-xs text-surface-400 capitalize">{proj.status?.toLowerCase()}</p>
                </div>
                {proj.id === projectId && (
                  <Check className="w-4 h-4 text-primary-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-surface-100 mt-1 pt-1">
            <button
              onClick={() => { setIsOpen(false); navigate(`/app/org/${organizationId}/dashboard`); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
            >
              View all projects
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
