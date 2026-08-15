import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApplicationShell from './layouts/ApplicationShell';
import Home from './pages/Home';

import Register from './pages/Register';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import CreateOrganization from './pages/CreateOrganization';
import WorkspaceSelection from './pages/WorkspaceSelection';
import OrganizationDashboard from './pages/OrganizationDashboard';
import OrganizationMembers from './pages/OrganizationMembers';
import OrganizationInvitations from './pages/OrganizationInvitations';
import UserInvitations from './pages/UserInvitations';
import AcceptInvitation from './pages/AcceptInvitation';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useAuthStore from './store/authStore';
import { useEffect } from 'react';

function App() {
  const { isInitialized, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ApplicationShell />}>
        <Route index element={<Home />} />
        {/* Placeholder routes for future modules */}
        <Route path="health-test" element={<Home />} />
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      
      {/* Protected Routes */}
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
      <Route 
        path="/app" 
        element={
          <ProtectedRoute>
            <WorkspaceSelection />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/app/org/:organizationId/dashboard" 
        element={
          <ProtectedRoute>
            <OrganizationDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/app/org/:organizationId/members" 
        element={
          <ProtectedRoute>
            <OrganizationMembers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/app/org/:organizationId/invitations" 
        element={
          <ProtectedRoute>
            <OrganizationInvitations />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/app/invitations" 
        element={
          <ProtectedRoute>
            <UserInvitations />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect all /app/* fallbacks to /app for workspace selection */}
      <Route 
        path="/app/*" 
        element={
          <ProtectedRoute>
            <WorkspaceSelection />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
