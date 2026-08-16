import Activity from '../models/Activity.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

class ActivityService {
  /**
   * Create a generic activity log.
   */
  async createActivity({ projectId, actorId, action, entityType, entityId, metadata = {}, session = null }) {
    try {
      const activityData = {
        project: projectId,
        action,
        entityType,
        entityId,
        metadata
      };

      if (actorId) {
        activityData.actor = actorId;
      }

      const activities = await Activity.create([activityData], { session });
      return activities[0];
    } catch (error) {
      console.error('Error creating activity:', error);
      // We generally don't want activity creation to break main flows if it fails,
      // but if a session is provided, it will bubble up and abort the transaction.
      if (session) throw error;
    }
  }

  /**
   * Retrieve project activity feed
   */
  async getProjectActivity(projectId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ project: projectId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name avatar email'); // Get basic user info

    const total = await Activity.countDocuments({ project: projectId });

    return {
      activities,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const activityService = new ActivityService();
export default activityService;
