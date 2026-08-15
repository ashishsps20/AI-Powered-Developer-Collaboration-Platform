import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApplicationShell from './layouts/ApplicationShell';
import Home from './pages/Home';

import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import AppPlaceholder from './pages/AppPlaceholder';
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
      <Route path="/onboarding" element={<Onboarding />} />
      <Route 
        path="/app/*" 
        element={
          <ProtectedRoute>
            <AppPlaceholder />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
