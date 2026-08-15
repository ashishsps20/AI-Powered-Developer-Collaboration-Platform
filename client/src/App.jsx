import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ApplicationShell from './layouts/ApplicationShell';
import Home from './pages/Home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ApplicationShell />}>
        <Route index element={<Home />} />
        {/* Placeholder routes for future modules */}
        <Route path="health-test" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;
