import { Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 lg:flex-row">
      <div className="hidden flex-1 flex-col justify-between border-r border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-white">
          <Code2 className="h-8 w-8 text-indigo-400" />
          <span className="text-xl font-semibold tracking-tight">DevCollab</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight text-white">
            Ship faster with your team
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Project management, real-time chat, GitHub integration, and AI-assisted
            workflows — built for developer teams.
          </p>
        </div>
        <p className="text-sm text-slate-500">Phase 1 · Authentication</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 text-white">
              <Code2 className="h-7 w-7 text-indigo-400" />
              <span className="text-lg font-semibold">DevCollab</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function FormField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {children}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function inputClassName(hasError) {
  return [
    'w-full rounded-lg border bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition',
    hasError
      ? 'border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500/40'
      : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40',
  ].join(' ');
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

export function FormAlert({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {message}
    </div>
  );
}

export function FormSuccess({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
      {message}
    </div>
  );
}
