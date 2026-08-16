import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['PROJECT_MANAGER', 'DEVELOPER'],
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A user cannot appear twice in the same project
projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);

export default ProjectMember;
