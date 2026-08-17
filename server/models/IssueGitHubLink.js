import mongoose from 'mongoose';

const issueGitHubLinkSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
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
    githubIssueNumber: {
      type: Number,
      required: true,
    },
    githubIssueId: {
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

// A GitHub Issue should not be linked to multiple internal issues in the same project.
issueGitHubLinkSchema.index({ project: 1, githubRepositoryId: 1, githubIssueId: 1 }, { unique: true });
issueGitHubLinkSchema.index({ issue: 1 });

const IssueGitHubLink = mongoose.model('IssueGitHubLink', issueGitHubLinkSchema);

export default IssueGitHubLink;
