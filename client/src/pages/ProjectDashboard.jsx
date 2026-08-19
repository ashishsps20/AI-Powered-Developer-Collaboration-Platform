import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import useProjectStore from '../store/projectStore';
import projectService from '../services/projectService';
import { taskService } from '../services/taskService';
import { issueService } from '../services/issueService';
import ServiceUnavailable from '../components/common/ServiceUnavailable';
import PageHeader from '../components/layout/PageHeader';
import { CheckSquare, AlertCircle, Users, TrendingUp, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const ProjectDashboard = () => {
  const { organizationId, projectId } = useParams();
  const { currentProject } = useProjectStore();

  if (!currentProject) return null;

  // Fetch all needed stats data concurrently using React Query
  const queries = useQueries({
    queries: [
      {
        queryKey: ['projects', organizationId, projectId, 'members'],
        queryFn: () => projectService.getProjectMembers(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
      },
      {
        queryKey: ['projects', organizationId, projectId, 'tasks'],
        queryFn: () => taskService.getTasks(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
      },
      {
        queryKey: ['projects', organizationId, projectId, 'issues'],
        queryFn: () => issueService.getIssues(organizationId, projectId),
        enabled: !!organizationId && !!projectId,
      }
    ]
  });

  const [membersQuery, tasksQuery, issuesQuery] = queries;

  const isLoading = queries.some(q => q.isLoading);
  const isError = queries.some(q => q.isError);

  if (isLoading) {
    return (
      <div>
        <PageHeader title={currentProject.name} description={currentProject.description || 'Project overview'} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-surface-200 p-5">
              <div className="h-4 w-20 rounded skeleton-shimmer mb-3" />
              <div className="h-8 w-16 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const error503 = queries.find(q => q.error?.response?.status === 503);
    if (error503) {
      return (
        <ServiceUnavailable 
          onRetry={() => {
            queries.forEach(q => {
              if (q.isError) q.refetch();
            });
          }}
          isRetrying={queries.some(q => q.isFetching)}
        />
      );
    }
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <p className="text-sm text-red-700">Failed to load project dashboard data.</p>
        <button 
          onClick={() => queries.forEach(q => q.isError && q.refetch())}
          className="mt-2 text-sm text-red-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : (tasksQuery.data?.tasks || []);
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const totalTasks = tasks.length;
  
  const issues = Array.isArray(issuesQuery.data) ? issuesQuery.data : (issuesQuery.data?.issues || []);
  const openIssues = issues.filter(i => i.status === 'OPEN').length;

  const members = Array.isArray(membersQuery.data) ? membersQuery.data : (membersQuery.data?.data?.members || membersQuery.data?.members || []);
  const totalMembers = members.length;

  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: CheckSquare, color: 'bg-primary-50 text-primary-600', link: `tasks` },
    { label: 'Completed', value: completedTasks, icon: TrendingUp, color: 'bg-green-50 text-green-600', link: `tasks` },
    { label: 'Open Issues', value: openIssues, icon: AlertCircle, color: 'bg-amber-50 text-amber-600', link: `issues` },
    { label: 'Members', value: totalMembers, icon: Users, color: 'bg-blue-50 text-blue-600', link: `members` },
  ];

  // --- Graphical Analytics Data Prep ---
  // 1. Task Status Distribution
  const taskStatusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const COLORS = {
    TODO: '#94a3b8', // slate-400
    IN_PROGRESS: '#3b82f6', // blue-500
    IN_REVIEW: '#a855f7', // purple-500
    DONE: '#22c55e', // green-500
  };

  const taskStatusData = Object.entries(taskStatusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    color: COLORS[status] || '#cbd5e1'
  }));

  // 2. Issue Priority Distribution (Only for Open Issues)
  const openIssuesList = issues.filter(i => i.status === 'OPEN');
  const issuePriorityCounts = openIssuesList.reduce((acc, issue) => {
    acc[issue.priority] = (acc[issue.priority] || 0) + 1;
    return acc;
  }, { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }); // ensure all categories exist

  const PRIORITY_COLORS = {
    LOW: '#34d399', // emerald-400
    MEDIUM: '#fbbf24', // amber-400
    HIGH: '#f97316', // orange-500
    CRITICAL: '#ef4444', // red-500
  };

  const issuePriorityData = Object.entries(issuePriorityCounts).map(([priority, count]) => ({
    name: priority,
    count: count,
    fill: PRIORITY_COLORS[priority] || '#cbd5e1'
  }));

  return (
    <div>
      <PageHeader
        title={currentProject.name}
        description={currentProject.description || 'Project overview'}
        actions={
          <div className="flex gap-2">
            <Link
              to={`/app/org/${organizationId}/projects/${projectId}/tasks`}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Link>
          </div>
        }
      />

      {/* Project status badge */}
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700 uppercase">
          {currentProject.status}
        </span>
        {currentProject.projectManager && (
          <span className="text-sm text-surface-500">
            PM: <span className="font-medium text-surface-700">{currentProject.projectManager.name}</span>
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="bg-white rounded-xl border border-surface-200 p-5 hover:border-primary-200 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-medium text-surface-500">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold text-surface-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Graphical Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Status Donut Chart */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Task Distribution</h3>
          {totalTasks > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [value, 'Tasks']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-surface-400 text-sm">
              No tasks available to display.
            </div>
          )}
        </div>

        {/* Issue Priority Bar Chart */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Open Issues by Priority</h3>
          {openIssues > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issuePriorityData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
                    {issuePriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-surface-400 text-sm">
              No open issues to display.
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="bg-white rounded-xl border border-surface-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-900">Overall Progress</h3>
            <span className="text-sm font-medium text-surface-500">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-surface-400 mt-2">{completedTasks} of {totalTasks} tasks completed</p>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;
