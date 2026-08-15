import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AcceptInvitation from '../pages/AcceptInvitation';
import UserInvitations from '../pages/UserInvitations';
import OrganizationMembers from '../pages/OrganizationMembers';
import InviteMemberModal from '../components/organization/InviteMemberModal';
import useAuthStore from '../store/authStore';
import useOrgStore from '../store/orgStore';
import organizationService from '../services/organizationService';

// Mock dependencies
jest.mock('../store/authStore');
jest.mock('../store/orgStore');
jest.mock('../services/organizationService');

describe('Module 6: Organization Invitations & Membership Frontend', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AcceptInvitation component', () => {
    it('shows loading state initially', () => {
      useAuthStore.mockReturnValue({ isInitialized: false, isAuthenticated: false });
      render(
        <MemoryRouter initialEntries={['/accept-invitation?token=123']}>
          <AcceptInvitation />
        </MemoryRouter>
      );
      expect(screen.getByText(/Verifying authentication state/i)).toBeInTheDocument();
    });

    it('shows error if token is missing', async () => {
      useAuthStore.mockReturnValue({ isInitialized: true, isAuthenticated: true });
      render(
        <MemoryRouter initialEntries={['/accept-invitation']}>
          <AcceptInvitation />
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/No invitation token provided/i)).toBeInTheDocument();
      });
    });
  });

  describe('UserInvitations component', () => {
    it('displays loading state while fetching', () => {
      organizationService.getPendingInvitations.mockImplementation(() => new Promise(() => {}));
      render(
        <BrowserRouter>
          <UserInvitations />
        </BrowserRouter>
      );
      // It has pulse effect, no easy text, but we check for absence of no invitations text
      expect(screen.queryByText(/You have no pending invitations/i)).not.toBeInTheDocument();
    });

    it('displays invitations when fetched successfully', async () => {
      organizationService.getPendingInvitations.mockResolvedValue({
        data: {
          invitations: [
            {
              _id: 'inv1',
              organization: { name: 'Test Org' },
              role: 'MEMBER',
              expiresAt: new Date().toISOString()
            }
          ]
        }
      });

      render(
        <BrowserRouter>
          <UserInvitations />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Org')).toBeInTheDocument();
        expect(screen.getByText('MEMBER')).toBeInTheDocument();
      });
    });
  });

  describe('OrganizationMembers component', () => {
    beforeEach(() => {
      useOrgStore.mockReturnValue({
        currentOrganization: { id: 'org1', name: 'Test Org' },
        currentRole: 'OWNER',
        setCurrentOrganization: jest.fn().mockResolvedValue()
      });
      organizationService.getMembers.mockResolvedValue({
        data: {
          members: [
            { _id: 'mem1', user: { name: 'Alice', email: 'alice@test.com' }, role: 'OWNER', createdAt: new Date() },
            { _id: 'mem2', user: { name: 'Bob', email: 'bob@test.com' }, role: 'MEMBER', createdAt: new Date() }
          ]
        }
      });
    });

    it('renders members list', async () => {
      render(
        <MemoryRouter initialEntries={['/app/org/org1/members']}>
          <OrganizationMembers />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });
    });

    it('shows Invite Member button for OWNER', async () => {
      render(
        <MemoryRouter initialEntries={['/app/org/org1/members']}>
          <OrganizationMembers />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Invite Member')).toBeInTheDocument();
      });
    });

    it('hides Invite Member button for MEMBER', async () => {
      useOrgStore.mockReturnValue({
        currentOrganization: { id: 'org1', name: 'Test Org' },
        currentRole: 'MEMBER',
        setCurrentOrganization: jest.fn().mockResolvedValue()
      });

      render(
        <MemoryRouter initialEntries={['/app/org/org1/members']}>
          <OrganizationMembers />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Invite Member')).not.toBeInTheDocument();
      });
    });
  });

  describe('InviteMemberModal component', () => {
    it('submits email correctly', async () => {
      organizationService.inviteMember.mockResolvedValue({ data: { invitationUrl: 'http://test' } });
      const onClose = jest.fn();
      const onInviteSuccess = jest.fn();
      
      render(
        <InviteMemberModal
          organizationId="org1"
          isOpen={true}
          onClose={onClose}
          onInviteSuccess={onInviteSuccess}
        />
      );

      const input = screen.getByPlaceholderText('developer@example.com');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      
      const submitBtn = screen.getByText('Send Invitation');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(organizationService.inviteMember).toHaveBeenCalledWith('org1', { email: 'test@example.com' });
        expect(screen.getByText(/Invitation sent successfully/i)).toBeInTheDocument();
      });
    });
  });
});
