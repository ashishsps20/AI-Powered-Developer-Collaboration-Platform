import mongoose from 'mongoose';

const aiUsageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIConversation',
    },
    model: {
      type: String,
      required: true,
    },
    requestTokens: {
      type: Number,
      default: 0,
    },
    responseTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'ERROR'],
      default: 'SUCCESS',
    },
  },
  {
    timestamps: true,
  }
);

aiUsageLogSchema.index({ user: 1, project: 1 });
aiUsageLogSchema.index({ organization: 1 });

const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);
export default AIUsageLog;
