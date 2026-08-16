import mongoose from 'mongoose';
import slugify from 'slugify';
import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import OrganizationMember from '../models/OrganizationMember.js';
import User from '../models/User.js';

class ProjectService {
  async createProject(organizationId, userId, data) {
    const { name, description, projectManagerId } = data;

    // Validate name
    if (!name || name.trim().length < 2) {
      const error = new Error('Project name must be at least 2 characters long');
      error.statusCode = 400;
      throw error;
    }

    // Validate projectManagerId belongs to the organization and is active
    if (!mongoose.Types.ObjectId.isValid(projectManagerId)) {
      const error = new Error('Invalid projectManagerId');
      error.statusCode = 400;
      throw error;
    }

    const pmMembership = await OrganizationMember.findOne({
      organization: organizationId,
      user: projectManagerId,
      isActive: true,
    });

    if (!pmMembership) {
      const error = new Error('Project Manager must be an active organization member');
      error.statusCode = 400;
      throw error;
    }

    // Generate Slug
    const slug = slugify(name, { lower: true, strict: true });

    // Check slug uniqueness
    const existingProject = await Project.findOne({ organization: organizationId, slug });
    if (existingProject) {
      const error = new Error('A project with this name already exists in the organization');
      error.statusCode = 409;
      throw error;
    }

    let session = null;
    let transactionSupported = false;

    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        transactionSupported = true;
      } catch (e) {
        console.warn('MongoDB transactions not supported, using non-atomic fallback.');
      }
    }

    try {
      const options = transactionSupported ? { session } : {};

      const [project] = await Project.create([{
        organization: organizationId,
        name: name.trim(),
        slug,
        description: description || '',
        status: 'PLANNING',
        createdBy: userId,
      }], options);

      const [projectManager] = await ProjectMember.create([{
        project: project._id,
        user: projectManagerId,
        role: 'PROJECT_MANAGER',
        assignedBy: userId,
        isActive: true,
      }], options);

      if (transactionSupported) {
        await session.commitTransaction();
        session.endSession();
      }

      return {
        project: {
          id: project._id,
          organizationId: project.organization,
          name: project.name,
          slug: project.slug,
          description: project.description,
          status: project.status,
          createdBy: project.createdBy,
        },
        projectManager: {
          userId: projectManager.user,
          role: projectManager.role,
        }
      };

    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  async getOrganizationProjects(organizationId) {
    const projects = await Project.find({ organization: organizationId });
    
    const projectManagerPromises = projects.map(project => 
      ProjectMember.findOne({
        project: project._id,
        role: 'PROJECT_MANAGER',
        isActive: true
      }).populate('user', 'name')
    );

    const projectManagers = await Promise.all(projectManagerPromises);

    return projects.map((project, index) => {
      const pm = projectManagers[index];
      return {
        id: project._id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        status: project.status,
        projectManager: pm && pm.user ? {
          id: pm.user._id,
          name: pm.user.name
        } : null
      };
    });
  }

  async getProject(projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }

    const projectManager = await ProjectMember.findOne({
      project: project._id,
      role: 'PROJECT_MANAGER',
      isActive: true
    }).populate('user', 'name email');

    return {
      id: project._id,
      organizationId: project.organization,
      name: project.name,
      slug: project.slug,
      description: project.description,
      status: project.status,
      createdBy: project.createdBy,
      createdAt: project.createdAt,
      projectManager: projectManager ? {
        id: projectManager.user._id,
        name: projectManager.user.name,
        email: projectManager.user.email
      } : null
    };
  }

  async getProjectMembers(projectId) {
    const members = await ProjectMember.find({ project: projectId, isActive: true })
      .populate('user', 'name email');

    return members.map(m => ({
      id: m._id,
      user: {
        id: m.user._id,
        name: m.user.name,
        email: m.user.email
      },
      role: m.role,
      joinedAt: m.joinedAt
    }));
  }

  async addProjectMember(organizationId, projectId, data, assignedByUserId) {
    const { userId, role } = data;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid userId');
      error.statusCode = 400;
      throw error;
    }

    if (!['DEVELOPER', 'PROJECT_MANAGER'].includes(role)) {
      const error = new Error('Invalid role');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify target user belongs to organization
    const orgMembership = await OrganizationMember.findOne({
      organization: organizationId,
      user: userId,
      isActive: true,
    });

    if (!orgMembership) {
      const error = new Error('User is not an active member of the organization');
      error.statusCode = 400;
      throw error;
    }

    // 2. Check if user is already a member
    const existingMembership = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        const error = new Error('User is already a member of this project');
        error.statusCode = 409;
        throw error;
      } else {
        // Reactivate
        existingMembership.isActive = true;
        existingMembership.role = role;
        existingMembership.assignedBy = assignedByUserId;
        existingMembership.joinedAt = new Date();
        await existingMembership.save();
        return existingMembership;
      }
    }

    // 3. Create new membership
    const newMember = await ProjectMember.create({
      project: projectId,
      user: userId,
      role,
      assignedBy: assignedByUserId,
      isActive: true,
    });

    return newMember;
  }

  async removeProjectMember(projectId, targetUserId) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      const error = new Error('Invalid target userId');
      error.statusCode = 400;
      throw error;
    }

    const membership = await ProjectMember.findOne({
      project: projectId,
      user: targetUserId,
      isActive: true,
    });

    if (!membership) {
      const error = new Error('User is not a member of this project');
      error.statusCode = 404;
      throw error;
    }

    // Prevent removing the only active project manager
    if (membership.role === 'PROJECT_MANAGER') {
      const activePMsCount = await ProjectMember.countDocuments({
        project: projectId,
        role: 'PROJECT_MANAGER',
        isActive: true,
      });

      if (activePMsCount <= 1) {
        const error = new Error('Cannot remove the only active Project Manager. Reassign first.');
        error.statusCode = 400;
        throw error;
      }
    }

    membership.isActive = false;
    await membership.save();

    return true;
  }

  async reassignProjectManager(organizationId, projectId, newManagerUserId, assignedByUserId) {
    if (!mongoose.Types.ObjectId.isValid(newManagerUserId)) {
      const error = new Error('Invalid newManagerUserId');
      error.statusCode = 400;
      throw error;
    }

    // 1. Verify new manager belongs to organization
    const orgMembership = await OrganizationMember.findOne({
      organization: organizationId,
      user: newManagerUserId,
      isActive: true,
    });

    if (!orgMembership) {
      const error = new Error('New manager must be an active organization member');
      error.statusCode = 400;
      throw error;
    }

    let session = null;
    let transactionSupported = false;

    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        transactionSupported = true;
      } catch (e) {
        console.warn('MongoDB transactions not supported, using non-atomic fallback.');
      }
    }

    try {
      const options = transactionSupported ? { session } : {};

      // 2. Demote old managers to DEVELOPER
      await ProjectMember.updateMany(
        { project: projectId, role: 'PROJECT_MANAGER', isActive: true },
        { $set: { role: 'DEVELOPER' } },
        options
      );

      // 3. Promote new manager
      const existingMembership = await ProjectMember.findOne({
        project: projectId,
        user: newManagerUserId,
      }, null, options);

      if (existingMembership) {
        existingMembership.role = 'PROJECT_MANAGER';
        existingMembership.isActive = true; // In case they were inactive
        await existingMembership.save(options);
      } else {
        await ProjectMember.create([{
          project: projectId,
          user: newManagerUserId,
          role: 'PROJECT_MANAGER',
          assignedBy: assignedByUserId,
          isActive: true,
        }], options);
      }

      if (transactionSupported) {
        await session.commitTransaction();
        session.endSession();
      }

      return true;
    } catch (error) {
      if (transactionSupported && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }
}

export default new ProjectService();
