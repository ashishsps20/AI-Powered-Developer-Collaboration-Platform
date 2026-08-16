import projectService from '../services/project.service.js';

class ProjectController {
  async createProject(req, res, next) {
    try {
      const { organizationId } = req.params;
      const data = req.body;

      const result = await projectService.createProject(organizationId, req.user.id, data);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrganizationProjects(req, res, next) {
    try {
      const { organizationId } = req.params;
      const projects = await projectService.getOrganizationProjects(organizationId);

      res.status(200).json({
        success: true,
        data: { projects },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProject(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = await projectService.getProject(projectId);

      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProjectMembers(req, res, next) {
    try {
      const { projectId } = req.params;
      const members = await projectService.getProjectMembers(projectId);

      res.status(200).json({
        success: true,
        data: { members },
      });
    } catch (error) {
      next(error);
    }
  }

  async addProjectMember(req, res, next) {
    try {
      const { organizationId, projectId } = req.params;
      const data = req.body;

      const member = await projectService.addProjectMember(organizationId, projectId, data, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Project member added successfully',
        data: { member },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeProjectMember(req, res, next) {
    try {
      const { projectId, userId } = req.params;

      await projectService.removeProjectMember(projectId, userId);

      res.status(200).json({
        success: true,
        message: 'Project member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async reassignProjectManager(req, res, next) {
    try {
      const { organizationId, projectId } = req.params;
      const { userId } = req.body;

      await projectService.reassignProjectManager(organizationId, projectId, userId, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Project manager reassigned successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProjectController();
