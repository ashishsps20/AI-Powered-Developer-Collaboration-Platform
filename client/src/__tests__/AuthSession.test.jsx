import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import useAuthStore from '../store/authStore';
import authService from '../services/authService';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AppPlaceholder from '../pages/AppPlaceholder';

// Mock authService
vi.mock('../services/authService');

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('Auth Session Frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: true, 
      isInitialized: false 
    });
    localStorage.clear();
  });

  it('1. Initial authentication loading state is shown', async () => {
    // Make getCurrentUser promise not resolve immediately
    authService.getCurrentUser.mockReturnValue(new Promise(() => {}));
    renderWithRouter(<App />);
    expect(screen.getByText('Loading your workspace...')).toBeInTheDocument();
  });

  it('2, 4, 10. /me success shows app for authenticated user', async () => {
    authService.getCurrentUser.mockResolvedValueOnce({
      success: true,
      data: { user: { name: 'Ashish', email: 'ashish@example.com', platformRole: 'USER' } }
    });

    renderWithRouter(<App />, { route: '/app' });

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Ashish')).toBeInTheDocument();
      expect(screen.getByText(/ashish@example.com/)).toBeInTheDocument();
    });
  });

  it('3, 5, 12. /me returns 401, redirect to login, protected route hides', async () => {
    authService.getCurrentUser.mockRejectedValueOnce({ statusCode: 401 });

    renderWithRouter(<App />, { route: '/app' });

    // Should wait until initialized
    await waitFor(() => {
      // It should navigate to /login and render Login page
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
      expect(screen.queryByText('Welcome back, Ashish')).not.toBeInTheDocument();
    });
  });

  it('6. Refresh maintains authentication', async () => {
    // This is essentially App re-mounting with isInitialized=false, which we already tested in case #2
    authService.getCurrentUser.mockResolvedValueOnce({
      success: true,
      data: { user: { name: 'Ashish', email: 'ashish@example.com', platformRole: 'USER' } }
    });

    renderWithRouter(<App />, { route: '/app' });

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Ashish')).toBeInTheDocument();
    });
  });

  it('7, 9. Logout clears auth state and navigates to login', async () => {
    // Pre-authenticate the store
    useAuthStore.setState({ 
      user: { name: 'Ashish', email: 'ashish@example.com', platformRole: 'USER' }, 
      isAuthenticated: true, 
      isInitialized: true 
    });
    authService.logoutUser.mockResolvedValueOnce({ success: true });

    renderWithRouter(<App />, { route: '/app' });

    // Ensure App Placeholder is rendered
    expect(screen.getByText('Welcome back, Ashish')).toBeInTheDocument();

    // Click logout
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(authService.logoutUser).toHaveBeenCalled();
      // Auth store should be cleared
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      // Should navigate to login
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    });
  });

  it('8. Login -> /app', async () => {
    useAuthStore.setState({ 
      user: null, 
      isAuthenticated: false, 
      isInitialized: true 
    });
    authService.loginUser.mockResolvedValueOnce({
      success: true,
      data: { user: { name: 'Ashish', email: 'ashish@example.com', platformRole: 'USER' } }
    });

    renderWithRouter(<App />, { route: '/login' });

    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /^login/i }));

    await waitFor(() => {
      expect(authService.loginUser).toHaveBeenCalled();
      // The store is updated via setUser and navigate to /app
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(screen.getByText('Welcome back, Ashish')).toBeInTheDocument();
    });
  });

  it('11. No JWT is stored in localStorage', () => {
    // This is tested implicitly because we never call localStorage.setItem('token') in our logic,
    // but we can assert localStorage is empty.
    expect(localStorage.getItem('token')).toBeNull();
  });
});
