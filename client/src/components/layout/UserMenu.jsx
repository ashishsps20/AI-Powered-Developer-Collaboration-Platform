import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
          {initials}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-surface-400 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-surface-200 py-1.5 z-50 animate-fade-in">
          <div className="px-4 py-2.5 border-b border-surface-100">
            <p className="text-sm font-semibold text-surface-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email || ''}</p>
          </div>

          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); navigate('/app/settings/notifications'); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-surface-400" />
              Notification Preferences
            </button>
          </div>

          <div className="border-t border-surface-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
