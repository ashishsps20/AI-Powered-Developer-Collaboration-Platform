class EmailService {
  /**
   * Send an invitation email to a user.
   * In a real production application, this would use nodemailer and an SMTP server.
   * For development/testing, it logs the secure link to the console.
   */
  async sendInvitationEmail(toEmail, inviterName, organizationName, rawToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${frontendUrl}/accept-invitation?token=${rawToken}`;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n========================================================');
      console.log('📧 DEVELOPMENT EMAIL MOCK');
      console.log('========================================================');
      console.log(`To: ${toEmail}`);
      console.log(`Subject: You have been invited to join ${organizationName}`);
      console.log(`Body:`);
      console.log(`Hello,`);
      console.log(`${inviterName} has invited you to join ${organizationName} on our platform.`);
      console.log(`Please click the link below to accept the invitation:`);
      console.log(`${invitationLink}`);
      console.log('========================================================\n');
    } else {
      // TODO: Implement actual nodemailer SMTP transport for production
      // const transporter = nodemailer.createTransport({...})
      // await transporter.sendMail({...})
      console.log(`[Production mode] Sending real email to ${toEmail} with link ${invitationLink}`);
    }

    return true;
  }
}

export default new EmailService();
