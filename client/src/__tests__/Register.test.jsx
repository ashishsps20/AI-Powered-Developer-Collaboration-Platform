import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
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

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  it('1. renders registration page', () => {
    renderRegister();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('2. shows required field validation errors', async () => {
    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Confirm Password is required')).toBeInTheDocument();
    });
  });

  it('3. validates email format', async () => {
    renderRegister();
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('4. requires password minimum length', async () => {
    renderRegister();
    fireEvent.input(screen.getByLabelText(/^password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('5. requires passwords to match', async () => {
    renderRegister();
    fireEvent.input(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.input(screen.getByLabelText(/confirm password/i), { target: { value: 'password321' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('6 & 9 & 10. successful registration shows loading and navigates to onboarding', async () => {
    authService.registerUser.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
      success: true,
      message: 'Account created successfully',
      data: { user: { id: '123' } }
    }), 50)));

    renderRegister();
    
    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Ashish Gautam' } });
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.input(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    
    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    // 9. Loading state check
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account\.\.\./i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(authService.registerUser).toHaveBeenCalledWith({
        name: 'Ashish Gautam',
        email: 'ashish@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      });
      // 10. Navigates to onboarding
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding', expect.anything());
    });
  });

  it('7. displays duplicate email error from backend', async () => {
    authService.registerUser.mockRejectedValueOnce({ statusCode: 409, message: 'An account with this email already exists' });
    
    renderRegister();
    
    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Ashish' } });
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.input(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    });
  });

  it('8. displays generic server error', async () => {
    authService.registerUser.mockRejectedValueOnce({ success: false, message: 'Something went wrong. Please try again.' });
    
    renderRegister();
    
    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: 'Ashish' } });
    fireEvent.input(screen.getByLabelText(/email/i), { target: { value: 'ashish@example.com' } });
    fireEvent.input(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
    fireEvent.input(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });
});
