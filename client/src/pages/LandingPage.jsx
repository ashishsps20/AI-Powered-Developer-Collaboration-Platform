import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Code2,
  GitBranch,
  Kanban,
  MessageSquare,
  Shield,
} from 'lucide-react';

const features = [
  {
    icon: Kanban,
    title: 'Kanban & sprints',
    description: 'Tasks, issues, and agile sprints in one workspace.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time chat',
    description: 'Project channels, DMs, and presence when you need them.',
  },
  {
    icon: GitBranch,
    title: 'GitHub integration',
    description: 'Link commits and PRs to tasks automatically.',
  },
  {
    icon: Bot,
    title: 'AI assistant',
    description: 'Task generation, code help, summaries, and risk analysis.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-indigo-400" />
            <span className="text-lg font-semibold">DevCollab</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center lg:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <Shield className="h-3.5 w-3.5" />
            JWT auth · MongoDB · React · Express
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            AI-powered developer
            <span className="block text-indigo-400">collaboration platform</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Manage projects, collaborate in real time, integrate GitHub, and use AI workflows —
            built as a modular monolith you can explain in every interview.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-600"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900/40 py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
              >
                <Icon className="h-6 w-6 text-indigo-400" />
                <h3 className="mt-3 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
        DevCollab · Phase 1 complete · Organizations & projects coming next
      </footer>
    </div>
  );
}
