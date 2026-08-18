import NotificationPreference from '../models/NotificationPreference.js';

class NotificationPreferenceService {
  /**
   * Get user preferences, creating defaults if they don't exist
   */
  async getPreferences(userId) {
    let prefs = await NotificationPreference.findOne({ user: userId });
    
    if (!prefs) {
      prefs = await NotificationPreference.create({ user: userId });
    }
    
    return prefs;
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, updateData) {
    // Only allow updating boolean flags
    const allowedUpdates = {};
    const flags = ['taskAssignments', 'issueAssignments', 'mentions', 'comments', 'githubEvents', 'projectUpdates'];
    
    for (const flag of flags) {
      if (updateData[flag] !== undefined) {
        allowedUpdates[flag] = Boolean(updateData[flag]);
      }
    }

    let prefs = await NotificationPreference.findOneAndUpdate(
      { user: userId },
      { $set: allowedUpdates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    return prefs;
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
export default notificationPreferenceService;
