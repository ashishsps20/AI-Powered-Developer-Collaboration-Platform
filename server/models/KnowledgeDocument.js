import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    sourceType: {
      type: String,
      enum: ['UPLOAD', 'MANUAL', 'GITHUB', 'PROJECT_DOCUMENT'],
      required: true,
    },
    fileName: {
      type: String,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    storagePath: {
      type: String,
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    processingError: {
      type: String,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeDocumentSchema.index({ project: 1, processingStatus: 1 });
knowledgeDocumentSchema.index({ organization: 1 });

const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
export default KnowledgeDocument;
