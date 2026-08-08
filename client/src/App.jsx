import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute, GuestRoute } from './components/routing/RouteGuards';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
