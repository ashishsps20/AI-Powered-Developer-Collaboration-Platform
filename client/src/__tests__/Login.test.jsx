import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import authService from '../services/authService';
import { vi } from 'vitest';

// Mock authService and react-router-dom navigate
vi.mock('../services/authService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  it('1. renders login page', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login/i })).toBeInTheDocument();
  });

  it('2 & 3. shows required field validation errors', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /^login/i }));

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('4. validates email format', async () => {
    renderLogin();
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /^login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('5 & 7 & 10. successful login shows loading and navigates to app', async () => {
    authService.loginUser.mockResolvedValueOnce({
      success: true,
      message: 'Login successful',
      data: { user: { name: 'Ashish' } }
    });

    renderLogin();
    
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    const submitBtn = screen.getByRole('button', { name: /^login/i });
    fireEvent.click(submitBtn);

    // 7. Loading state check
    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeInTheDocument();
    
    await waitFor(() => {
      expect(authService.loginUser).toHaveBeenCalledWith({
        email: 'ashish@example.com',
        password: 'password123'
      });
      // 10. Navigates to app
      expect(mockNavigate).toHaveBeenCalledWith('/app', expect.anything());
    });
  });

  it('6. displays invalid credentials error from backend', async () => {
    authService.loginUser.mockRejectedValueOnce({ statusCode: 401, message: 'Invalid email or password' });
    
    renderLogin();
    
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByRole('button', { name: /^login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('8. displays generic server error', async () => {
    authService.loginUser.mockRejectedValueOnce({ success: false, message: 'Something went wrong. Please try again.' });
    
    renderLogin();
    
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /^login/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('9. displays network error', async () => {
    authService.loginUser.mockRejectedValueOnce({ success: false, message: 'Unable to connect to the server.' });
    
    renderLogin();
    
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /^login/i }));

    await waitFor(() => {
      expect(screen.getByText('Unable to connect to the server.')).toBeInTheDocument();
    });
  });

  it('12. registration link works (is rendered)', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /register/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('/register');
  });
});
