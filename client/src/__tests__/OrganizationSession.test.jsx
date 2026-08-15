import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import useAuthStore from '../store/authStore';
import useOrgStore from '../store/orgStore';
import organizationService from '../services/organizationService';

vi.mock('../services/organizationService');
vi.mock('../services/authService', () => ({
  default: {
    getCurrentUser: vi.fn(() => Promise.resolve({ success: true, data: { user: { id: '1', name: 'Test', email: 'test@example.com' } } })),
    logoutUser: vi.fn(() => Promise.resolve({ success: true }))
  }
}));

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('Organization Onboarding & Workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ 
      user: { id: '1', name: 'Test User', email: 'test@example.com' }, 
      isAuthenticated: true, 
      isInitialized: true 
    });
    useOrgStore.setState({
      organizations: [],
      currentOrganization: null,
      currentRole: null,
      isLoading: false,
      error: null
    });
  });

  it('1. Onboarding renders for zero organizations', async () => {
    organizationService.getOrganizations.mockResolvedValueOnce({ data: { organizations: [] } });
    
    renderWithRouter(<App />, { route: '/onboarding' });
    
    await waitFor(() => {
      expect(screen.getByText(/You're not part of an organization yet/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Create Organization/i })).toBeInTheDocument();
    });
  });

  it('2, 8. Organization list renders with multiple organizations', async () => {
    organizationService.getOrganizations.mockResolvedValueOnce({
      data: {
        organizations: [
          { id: 'org1', name: 'TechNova', role: 'OWNER' },
          { id: 'org2', name: 'OpenSource', role: 'MEMBER' }
        ]
      }
    });

    renderWithRouter(<App />, { route: '/app' });

    await waitFor(() => {
      expect(screen.getByText('TechNova')).toBeInTheDocument();
      expect(screen.getByText('OWNER')).toBeInTheDocument();
      expect(screen.getByText('OpenSource')).toBeInTheDocument();
      expect(screen.getByText('MEMBER')).toBeInTheDocument();
    });
  });

  it('3, 4. Create organization form renders and validation works', async () => {
    renderWithRouter(<App />, { route: '/onboarding/create-organization' });

    expect(screen.getByRole('heading', { name: /Create Organization/i })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Create Organization/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Organization name is required/i)).toBeInTheDocument();
    });
  });

  it('5, 6, 7. Successful organization creation, selection, and navigation', async () => {
    organizationService.createOrganization.mockResolvedValueOnce({
      success: true,
      data: {
        organization: { id: 'org3', name: 'My New Org', slug: 'my-new-org' },
        membership: { role: 'OWNER' }
      }
    });
    organizationService.getOrganization.mockResolvedValueOnce({
      data: {
        organization: { id: 'org3', name: 'My New Org', description: 'Test desc' },
        role: 'OWNER'
      }
    });

    renderWithRouter(<App />, { route: '/onboarding/create-organization' });

    fireEvent.input(screen.getByLabelText(/Organization Name/i), { target: { value: 'My New Org' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Organization/i }));

    await waitFor(() => {
      expect(organizationService.createOrganization).toHaveBeenCalled();
    });

    // It should navigate to /app/org/org3/dashboard and fetch it
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /My New Org/i })).toBeInTheDocument();
      expect(screen.getByText('Test desc')).toBeInTheDocument();
      expect(screen.getAllByText('OWNER').length).toBeGreaterThan(0);
    });
  });

  it('9. Workspace switching works', async () => {
    organizationService.getOrganizations.mockResolvedValueOnce({
      data: { organizations: [{ id: 'org1', name: 'TechNova', role: 'OWNER' }] }
    });

    renderWithRouter(<App />, { route: '/app' });

    await waitFor(() => {
      expect(screen.getByText('TechNova')).toBeInTheDocument();
    });

    // Clicking "Open" link which leads to dashboard
    const openLink = screen.getByRole('link', { name: /TechNova/i });
    expect(openLink.getAttribute('href')).toBe('/app/org/org1/dashboard');
  });

  it('10. 403 is handled on dashboard', async () => {
    organizationService.getOrganization.mockRejectedValueOnce({
      statusCode: 403,
      message: 'You do not have access to this organization'
    });

    renderWithRouter(<App />, { route: '/app/org/forbidden/dashboard' });

    await waitFor(() => {
      expect(screen.getByText(/You don't have access to this organization/i)).toBeInTheDocument();
    });
  });

  it('11. 404 is handled on dashboard', async () => {
    organizationService.getOrganization.mockRejectedValueOnce({
      statusCode: 404,
      message: 'Organization not found'
    });

    renderWithRouter(<App />, { route: '/app/org/missing/dashboard' });

    await waitFor(() => {
      expect(screen.getByText(/Organization not found/i)).toBeInTheDocument();
    });
  });

  it('12. Loading state works when fetching dashboard', async () => {
    organizationService.getOrganization.mockReturnValueOnce(new Promise(() => {}));

    renderWithRouter(<App />, { route: '/app/org/loadingorg/dashboard' });

    expect(screen.getByText(/Loading workspace/i)).toBeInTheDocument();
  });

  it('13. Error state works when creation fails', async () => {
    organizationService.createOrganization.mockRejectedValueOnce({
      message: 'Name already exists'
    });

    renderWithRouter(<App />, { route: '/onboarding/create-organization' });

    fireEvent.input(screen.getByLabelText(/Organization Name/i), { target: { value: 'Duplicate' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Organization/i }));

    await waitFor(() => {
      expect(screen.getByText(/Name already exists/i)).toBeInTheDocument();
    });
  });

  it('14. Unauthenticated user is redirected to login', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isInitialized: true });
    
    renderWithRouter(<App />, { route: '/app/org/123/dashboard' });

    await waitFor(() => {
      // In our routing, it redirects to /login. We can check if Login page renders.
      expect(screen.getByRole('heading', { name: /Sign in to your account/i })).toBeInTheDocument();
    });
  });
});
