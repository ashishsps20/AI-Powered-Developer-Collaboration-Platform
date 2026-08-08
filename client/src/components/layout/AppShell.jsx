import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Code2, LayoutDashboard, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900/50 p-4 lg:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <Code2 className="h-7 w-7 text-indigo-400" />
          <span className="font-semibold text-white">DevCollab</span>
        </Link>

        <nav className="space-y-1 text-sm">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 font-medium text-white"
          >
            <LayoutDashboard className="h-4 w-4 text-indigo-400" />
            Dashboard
          </Link>
          <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-500">
            <Settings className="h-4 w-4" />
            Settings (Phase 2+)
          </span>
        </nav>

        <div className="mt-auto rounded-lg border border-slate-800 bg-slate-950/80 p-3">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <span className="mt-2 inline-block rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300">
            {user?.role}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-indigo-400" />
            <span className="font-semibold">DevCollab</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
          >
            Log out
          </button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
