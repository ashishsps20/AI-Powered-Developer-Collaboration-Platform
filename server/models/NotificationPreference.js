import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    taskAssignments: {
      type: Boolean,
      default: true,
    },
    issueAssignments: {
      type: Boolean,
      default: true,
    },
    mentions: {
      type: Boolean,
      default: true,
    },
    comments: {
      type: Boolean,
      default: true,
    },
    githubEvents: {
      type: Boolean,
      default: true,
    },
    projectUpdates: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

export default NotificationPreference;
