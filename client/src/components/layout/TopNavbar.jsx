import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Menu } from 'lucide-react';
import OrgSwitcher from './OrgSwitcher';
import ProjectSwitcher from './ProjectSwitcher';
import SearchTrigger from './SearchTrigger';
import NotificationBell from '../notifications/NotificationBell';
import UserMenu from './UserMenu';

const TopNavbar = ({ onMenuToggle }) => {
  return (
    <header className="h-16 bg-white border-b border-surface-200 sticky top-0 z-40 shrink-0">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 text-surface-500 hover:bg-surface-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/app" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block text-base font-bold text-surface-900 tracking-tight">
              DevCollab
            </span>
          </Link>

          <div className="hidden md:flex items-center ml-2">
            <OrgSwitcher />
            <ProjectSwitcher />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <SearchTrigger />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
