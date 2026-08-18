import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ASSISTANT', 'SYSTEM'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

aiMessageSchema.index({ conversation: 1, createdAt: 1 });

const AIMessage = mongoose.model('AIMessage', aiMessageSchema);
export default AIMessage;
