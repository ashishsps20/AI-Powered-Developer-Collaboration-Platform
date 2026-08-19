import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './components/realtime/SocketProvider';
import AppShell from './components/layout/AppShell';
import Home from './pages/Home';

import Register from './pages/Register';
import Login from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import Onboarding from './pages/Onboarding';
import CreateOrganization from './pages/CreateOrganization';
import WorkspaceSelection from './pages/WorkspaceSelection';
import OrganizationDashboard from './pages/OrganizationDashboard';
import OrganizationMembers from './pages/OrganizationMembers';
import OrganizationInvitations from './pages/OrganizationInvitations';
import UserInvitations from './pages/UserInvitations';
import ProjectDashboard from './pages/ProjectDashboard';
import ProjectMembers from './pages/ProjectMembers';
import AcceptInvitation from './pages/AcceptInvitation';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProjectLayout from './layouts/ProjectLayout';
import ProjectTasks from './pages/ProjectTasks';
import ProjectIssues from './pages/ProjectIssues';
import useAuthStore from './store/authStore';
import { useEffect } from 'react';
import ProjectActivity from './pages/ProjectActivity';
import ProjectGithub from './pages/ProjectGithub';
import Integrations from './pages/Integrations';
import Notifications from './pages/Notifications';
import NotificationPreferences from './pages/NotificationPreferences';
import ProjectAI from './pages/ProjectAI';
import ProjectKnowledge from './pages/ProjectKnowledge';
import KnowledgeDocument from './pages/KnowledgeDocument';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Do not retry these specific HTTP status codes
        const noRetryStatuses = [400, 401, 403, 404, 409, 422, 429];
        
        if (error?.response?.status && noRetryStatuses.includes(error.response.status)) {
          return false;
        }
        
        // Only retry Server Errors up to 2 times
        if (error?.response?.status >= 500) {
          return failureCount < 2;
        }

        // Default retry limit
        return failureCount < 3;
      },
      // Give a slight backoff delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-200 border-t-primary-600"></div>
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <SocketProvider>
          <Routes>
            {/* Public routes (no shell) */}
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            
            {/* Standalone protected routes (no shell) */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/onboarding/create-organization" 
              element={
                <ProtectedRoute>
                  <CreateOrganization />
                </ProtectedRoute>
              } 
            />

            {/* AppShell-wrapped authenticated routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Workspace selection */}
              <Route path="/app" element={<WorkspaceSelection />} />
              
              {/* Organization level */}
              <Route path="/app/org/:organizationId/dashboard" element={<OrganizationDashboard />} />
              <Route path="/app/org/:organizationId/members" element={<OrganizationMembers />} />
              <Route path="/app/org/:organizationId/invitations" element={<OrganizationInvitations />} />
              
              {/* Project level (with ProjectLayout for data-fetching) */}
              <Route
                path="/app/org/:organizationId/projects/:projectId"
                element={<ProjectLayout />}
              >
                <Route index element={<ProjectDashboard />} />
                <Route path="tasks" element={<ProjectTasks />} />
                <Route path="issues" element={<ProjectIssues />} />
                <Route path="activity" element={<ProjectActivity />} />
                <Route path="members" element={<ProjectMembers />} />
                <Route path="github" element={<ProjectGithub />} />
                <Route path="knowledge" element={<ProjectKnowledge />} />
                <Route path="knowledge/:documentId" element={<KnowledgeDocument />} />
                <Route path="ai" element={<ProjectAI />} />
              </Route>

              {/* Global app pages */}
              <Route path="/app/invitations" element={<UserInvitations />} />
              <Route path="/settings/integrations" element={<Integrations />} />
              <Route path="/app/notifications" element={<Notifications />} />
              <Route path="/app/settings/notifications" element={<NotificationPreferences />} />
              
              {/* Fallback */}
              <Route path="/app/*" element={<WorkspaceSelection />} />
            </Route>
          </Routes>
          <Toaster position="bottom-right" />
        </SocketProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
