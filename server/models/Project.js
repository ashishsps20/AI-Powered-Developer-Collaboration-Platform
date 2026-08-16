import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'PLANNING',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    repository: {
      type: {
        provider: { type: String, default: null },
        repositoryId: { type: String, default: null },
        repositoryName: { type: String, default: null },
        repositoryUrl: { type: String, default: null },
      },
      default: {
        provider: null,
        repositoryId: null,
        repositoryName: null,
        repositoryUrl: null,
      },
    },
    githubRepository: {
      type: {
        githubRepositoryId: { type: Number },
        owner: { type: String },
        name: { type: String },
        fullName: { type: String },
        htmlUrl: { type: String },
        defaultBranch: { type: String },
        private: { type: Boolean }
      },
      default: null
    },
  },
  { timestamps: true }
);

// A project slug should be unique within its organization
projectSchema.index({ organization: 1, slug: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;
