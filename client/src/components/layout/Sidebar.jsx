import React from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, AlertCircle, GitBranch,
  Bot, BookOpen, Activity, Users, Mail, Settings,
  ArrowLeft, PanelLeftClose, PanelLeft
} from 'lucide-react';
import useOrgStore from '../../store/orgStore';
import useProjectStore from '../../store/projectStore';
import useUIStore from '../../store/uiStore';

const SidebarLink = ({ to, icon: Icon, label, collapsed, onClick, badge }) => (
  <NavLink
    to={to}
    end
    onClick={onClick}
    className={({ isActive }) =>
      `relative group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
      } ${collapsed ? 'justify-center' : ''}`
    }
    title={collapsed ? label : undefined}
  >
    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.8} />
    {!collapsed && <span className="truncate flex-1">{label}</span>}
    {badge > 0 && (
      <span className={`inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ${collapsed ? 'absolute top-1 right-1 w-4 h-4' : 'px-1.5 min-w-[1.25rem] h-5'}`}>
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </NavLink>
);

const SidebarSection = ({ title, collapsed, children }) => (
  <div className="mb-2">
    {!collapsed && title && (
      <h3 className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-surface-400">
        {title}
      </h3>
    )}
    {collapsed && title && <div className="mx-auto w-6 border-t border-surface-200 my-2" />}
    <div className="space-y-0.5">{children}</div>
  </div>
);

const Sidebar = ({ isOpen, collapsed, onClose, onToggleCollapse }) => {
  const { organizationId, projectId } = useParams();
  const navigate = useNavigate();
  const { currentOrganization, currentRole } = useOrgStore();
  const { currentProject } = useProjectStore();

  const { unreadActivities } = useUIStore();
  
  const isOwner = currentRole === 'OWNER';
  const isAdmin = currentRole === 'ADMIN' || isOwner;
  const isInsideProject = !!projectId;

  const currentUnreadActivity = isInsideProject ? (unreadActivities[projectId] || 0) : 0;

  const closeMobileDrawer = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const basePath = `/app/org/${organizationId}`;
  const projectPath = `${basePath}/projects/${projectId}`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-40 bg-white border-r border-surface-200 flex flex-col
          sidebar-transition overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? 'w-[68px]' : 'w-[260px]'}
        `}
      >
        {/* Project back-link or org name */}
        <div className={`shrink-0 border-b border-surface-100 ${collapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
          {isInsideProject && !collapsed ? (
            <button
              onClick={() => { navigate(`${basePath}/dashboard`); closeMobileDrawer(); }}
              className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="truncate">Projects</span>
            </button>
          ) : isInsideProject && collapsed ? (
            <button
              onClick={() => { navigate(`${basePath}/dashboard`); closeMobileDrawer(); }}
              className="w-full flex justify-center text-surface-500 hover:text-surface-700"
              title="Back to projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : !collapsed ? (
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider truncate">
              {currentOrganization?.name || 'Organization'}
            </p>
          ) : null}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {isInsideProject ? (
            <>
              <SidebarSection collapsed={collapsed}>
                <SidebarLink to={projectPath} icon={LayoutDashboard} label="Overview" collapsed={collapsed} onClick={closeMobileDrawer} />
              </SidebarSection>

              <SidebarSection title="Work" collapsed={collapsed}>
                <SidebarLink to={`${projectPath}/tasks`} icon={CheckSquare} label="Tasks" collapsed={collapsed} onClick={closeMobileDrawer} />
                <SidebarLink to={`${projectPath}/issues`} icon={AlertCircle} label="Issues" collapsed={collapsed} onClick={closeMobileDrawer} />
              </SidebarSection>

              <SidebarSection title="Development" collapsed={collapsed}>
                <SidebarLink to={`${projectPath}/github`} icon={GitBranch} label="GitHub" collapsed={collapsed} onClick={closeMobileDrawer} />
              </SidebarSection>

              <SidebarSection title="AI & Knowledge" collapsed={collapsed}>
                <SidebarLink to={`${projectPath}/ai`} icon={Bot} label="AI Assistant" collapsed={collapsed} onClick={closeMobileDrawer} />
                <SidebarLink to={`${projectPath}/knowledge`} icon={BookOpen} label="Knowledge" collapsed={collapsed} onClick={closeMobileDrawer} />
              </SidebarSection>

              <SidebarSection title="Collaboration" collapsed={collapsed}>
                <SidebarLink to={`${projectPath}/activity`} icon={Activity} label="Activity" collapsed={collapsed} onClick={closeMobileDrawer} badge={currentUnreadActivity} />
                <SidebarLink to={`${projectPath}/members`} icon={Users} label="Members" collapsed={collapsed} onClick={closeMobileDrawer} />
              </SidebarSection>
            </>
          ) : organizationId ? (
            <>
              <SidebarSection collapsed={collapsed}>
                <SidebarLink to={`${basePath}/dashboard`} icon={LayoutDashboard} label="Overview" collapsed={collapsed} onClick={closeMobileDrawer} />
              </SidebarSection>

              <SidebarSection title="Organization" collapsed={collapsed}>
                <SidebarLink to={`${basePath}/members`} icon={Users} label="Members" collapsed={collapsed} onClick={closeMobileDrawer} />
                {isOwner && (
                  <SidebarLink to={`${basePath}/invitations`} icon={Mail} label="Invitations" collapsed={collapsed} onClick={closeMobileDrawer} />
                )}
              </SidebarSection>
            </>
          ) : null}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex shrink-0 border-t border-surface-100 p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-surface-500 hover:bg-surface-100 rounded-lg transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
