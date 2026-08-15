import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApplicationShell from './layouts/ApplicationShell';
import Home from './pages/Home';

import Register from './pages/Register';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationShell />}>
        <Route index element={<Home />} />
        {/* Placeholder routes for future modules */}
        <Route path="health-test" element={<Home />} />
      </Route>
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
    </Routes>
  );
}

export default App;
