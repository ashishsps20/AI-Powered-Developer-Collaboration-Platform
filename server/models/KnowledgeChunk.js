import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
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
    chunkIndex: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    section: {
      type: String,
    },
    tokenCount: {
      type: Number,
    },
    qdrantPointId: {
      type: String, // Storing as String since Qdrant requires UUID or Unsigned Int
    },
    embeddingModel: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeChunkSchema.index({ document: 1, chunkIndex: 1 });
knowledgeChunkSchema.index({ project: 1 });

const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
export default KnowledgeChunk;
