import mongoose from 'mongoose';

const projectGitHubSettingsSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
    },
    autoUpdateTaskOnPROpen: {
      type: Boolean,
      default: false,
    },
    autoCompleteTaskOnPRMerge: {
      type: Boolean,
      default: false,
    },
    autoUpdateIssueOnGitHubIssueClose: {
      type: Boolean,
      default: false,
    },
    syncGitHubIssueComments: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const ProjectGitHubSettings = mongoose.model('ProjectGitHubSettings', projectGitHubSettingsSchema);

export default ProjectGitHubSettings;
