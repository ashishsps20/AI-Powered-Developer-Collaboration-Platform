import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';
import useOrgStore from '../../store/orgStore';

const OrgSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { organizationId } = useParams();
  const { organizations, currentOrganization, fetchOrganizations } = useOrgStore();

  useEffect(() => {
    if (organizations.length === 0) {
      fetchOrganizations();
    }
  }, [organizations.length, fetchOrganizations]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (orgId) => {
    setIsOpen(false);
    navigate(`/app/org/${orgId}/dashboard`);
  };

  const displayName = currentOrganization?.name || 'Select Organization';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded-lg transition-colors max-w-[200px]"
      >
        <Building2 className="w-4 h-4 text-surface-400 shrink-0" />
        <span className="truncate">{displayName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-surface-200 py-1.5 z-50 animate-fade-in">
          <div className="px-3 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Organizations
          </div>
          <div className="max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {org.name?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{org.name}</p>
                  <p className="text-xs text-surface-400">{org.role}</p>
                </div>
                {org.id === organizationId && (
                  <Check className="w-4 h-4 text-primary-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-surface-100 mt-1 pt-1">
            <button
              onClick={() => { setIsOpen(false); navigate('/onboarding/create-organization'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-surface-600 hover:bg-surface-50 transition-colors"
            >
              <Plus className="w-4 h-4 text-surface-400" />
              Create Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSwitcher;
