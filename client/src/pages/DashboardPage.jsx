import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Welcome back, {user?.name}. Phase 1 (authentication) is ready.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-medium text-slate-400">Your role</h2>
          <p className="mt-2 text-xl font-semibold text-white">{user?.role}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h2 className="text-sm font-medium text-slate-400">Next up</h2>
          <p className="mt-2 text-sm text-slate-300">
            Phase 2 — Organizations, members, and invitations
          </p>
        </div>
      </div>
    </div>
  );
}
