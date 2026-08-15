import invitationService from '../services/invitation.service.js';

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const { organizationId } = req.params;
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid email is required',
        });
      }

      const invitation = await invitationService.createInvitation(organizationId, email, req.user);

      // Generate the invitation URL (since we don't have real email in dev)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const invitationUrl = invitation.rawToken 
        ? `${frontendUrl}/accept-invitation?token=${invitation.rawToken}`
        : undefined;

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: { 
          invitation,
          invitationUrl
        },
      });
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Invitation token is required',
        });
      }

      const result = await invitationService.acceptInvitation(req.user.id, req.user.email, token);

      res.status(200).json({
        success: true,
        message: 'Invitation accepted successfully',
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  async rejectInvitation(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Invitation token is required',
        });
      }

      await invitationService.rejectInvitation(req.user.email, token);

      res.status(200).json({
        success: true,
        message: 'Invitation rejected successfully',
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  async getPendingInvitations(req, res, next) {
    try {
      const invitations = await invitationService.getPendingInvitations(req.user.email);

      res.status(200).json({
        success: true,
        data: { invitations },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrganizationInvitations(req, res, next) {
    try {
      const { organizationId } = req.params;
      const invitations = await invitationService.getOrganizationInvitations(organizationId);

      res.status(200).json({
        success: true,
        data: { invitations },
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelInvitation(req, res, next) {
    try {
      const { organizationId, invitationId } = req.params;

      await invitationService.cancelInvitation(organizationId, invitationId);

      res.status(200).json({
        success: true,
        message: 'Invitation cancelled successfully',
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }
}

export default new InvitationController();
