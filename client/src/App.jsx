import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApplicationShell from './layouts/ApplicationShell';
import Home from './pages/Home';

import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import AppPlaceholder from './pages/AppPlaceholder';

function App() {
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
      <Route path="/app" element={<AppPlaceholder />} />
    </Routes>
  );
}

export default App;
