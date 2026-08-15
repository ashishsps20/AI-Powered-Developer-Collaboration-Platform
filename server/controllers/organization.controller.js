import organizationService from '../services/organization.service.js';
import { createOrganizationValidator } from '../validators/organization.validator.js';

class OrganizationController {
  async createOrganization(req, res, next) {
    try {
      const { error, value } = createOrganizationValidator.validate(req.body, { abortEarly: false });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await organizationService.createOrganization(req.user.id, value);

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUserOrganizations(req, res, next) {
    try {
      const organizations = await organizationService.getUserOrganizations(req.user.id);

      res.status(200).json({
        success: true,
        data: {
          organizations,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrganization(req, res, next) {
    try {
      const { organizationId } = req.params;
      const organization = await organizationService.getOrganizationById(organizationId);

      // We don't want to expose _id and __v directly if possible, clean it up
      const safeOrganization = {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        logo: organization.logo,
        createdBy: organization.createdBy,
        isActive: organization.isActive
      };

      res.status(200).json({
        success: true,
        data: {
          organization: safeOrganization,
          role: req.organizationMembership.role
        },
      });
    } catch (err) {
      if (err.statusCode === 400 || err.statusCode === 404) {
        return res.status(err.statusCode).json({
          success: false,
          message: err.message
        });
      }
      next(err);
    }
  }
}

export default new OrganizationController();
