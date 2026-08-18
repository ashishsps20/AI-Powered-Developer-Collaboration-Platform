import Project from '../../models/Project.js';
import Task from '../../models/Task.js';
import Issue from '../../models/Issue.js';
import ProjectMember from '../../models/ProjectMember.js';
import Activity from '../../models/Activity.js';
import User from '../../models/User.js';
import TaskGitHubLink from '../../models/TaskGitHubLink.js';
import IssueGitHubLink from '../../models/IssueGitHubLink.js';

class ContextBuilderService {
  /**
   * Gather limited project context based on current user and question.
   */
  async buildProjectContext(organizationId, projectId, userId, userQuestion = '') {
    // 1. Get Project info
    const project = await Project.findOne({ _id: projectId, organization: organizationId })
      .select('name description status createdAt manager')
      .lean();

    if (!project) throw new Error('Project not found');

    // 2. Get Current User info
    const currentUser = await User.findById(userId).select('name email').lean();
    const currentMember = await ProjectMember.findOne({ project: projectId, user: userId })
      .select('role')
      .lean();

    // 3. Get Members (limited to 50 to avoid massive payloads)
    const members = await ProjectMember.find({ project: projectId })
      .populate('user', 'name')
      .limit(50)
      .lean();
    
    const formattedMembers = members.map(m => ({
      name: m.user?.name || 'Unknown',
      role: m.role
    }));

    // 4. Get Tasks (Prioritize assigned to user, incomplete, high priority)
    // Here we get up to 20 tasks, prioritizing open ones
    const tasks = await Task.find({ project: projectId })
      .sort({ status: 1, priority: -1, updatedAt: -1 })
      .limit(20)
      .populate('assignedTo', 'name')
      .lean();

    const formattedTasks = tasks.map(t => ({
      id: t._id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo?.name || 'Unassigned'
    }));

    // 5. Get Issues (Prioritize open, high priority)
    const issues = await Issue.find({ project: projectId, status: { $ne: 'CLOSED' } })
      .sort({ priority: -1, updatedAt: -1 })
      .limit(15)
      .populate('assignedTo', 'name')
      .lean();

    const formattedIssues = issues.map(i => ({
      id: i._id,
      title: i.title,
      status: i.status,
      priority: i.priority,
      assignedTo: i.assignedTo?.name || 'Unassigned'
    }));

    // 6. Get Recent Activity (Last 20 events)
    const activities = await Activity.find({ project: projectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('actor', 'name')
      .lean();

    const formattedActivities = activities.map(a => ({
      action: a.action,
      entityType: a.entityType,
      user: a.actor?.name || 'System',
      timestamp: a.createdAt,
    }));

    // Construct final context
    return {
      project: {
        name: project.name,
        description: project.description,
        status: project.status,
      },
      currentUser: {
        name: currentUser?.name || 'Unknown',
        projectRole: currentMember?.role || 'MEMBER',
      },
      members: formattedMembers,
      recentTasks: formattedTasks,
      openIssues: formattedIssues,
      recentActivity: formattedActivities,
    };
  }
}

export default new ContextBuilderService();
