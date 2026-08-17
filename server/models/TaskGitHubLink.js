import mongoose from 'mongoose';

const taskGitHubLinkSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    githubRepositoryId: {
      type: Number,
      required: true,
    },
    githubPullRequestNumber: {
      type: Number,
      required: true,
    },
    githubPullRequestId: {
      type: Number,
      required: true,
    },
    githubUrl: {
      type: String,
      required: true,
    },
    linkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// The same GitHub PR must not be linked to multiple internal tasks within the same project.
taskGitHubLinkSchema.index({ project: 1, githubRepositoryId: 1, githubPullRequestId: 1 }, { unique: true });
taskGitHubLinkSchema.index({ task: 1 });

const TaskGitHubLink = mongoose.model('TaskGitHubLink', taskGitHubLinkSchema);

export default TaskGitHubLink;
