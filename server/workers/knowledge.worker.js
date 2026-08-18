import { Worker } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { createRedisConnection } from '../config/redis.js';
import socketService from '../services/socket.service.js';
import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import storageService from '../services/storage.service.js';
import textExtractorService from '../services/rag/textExtractor.service.js';
import textCleanerService from '../services/rag/textCleaner.service.js';
import chunkingService from '../services/rag/chunking.service.js';
import embeddingService from '../services/rag/embedding.service.js';
import vectorSearchService from '../services/rag/vectorSearch.service.js';

const processDocument = async (job) => {
  const { documentId, projectId, organizationId } = job.data;
  
  // 1. Load document
  const document = await KnowledgeDocument.findOne({
    _id: documentId,
    project: projectId,
    organization: organizationId
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (!document.isActive) {
    throw new Error('Document is inactive');
  }

  // 2. Emit PROCESSING event
  document.processingStatus = 'PROCESSING';
  await document.save();
  socketService.emitToProject(projectId.toString(), 'knowledge:processing', {
    documentId,
    status: 'PROCESSING'
  });

  try {
    // 3. Load source content
    let rawText = '';
    if (document.sourceType === 'MANUAL') {
      rawText = document.description; // We stored manual content here or we could fetch it
    } else if (document.sourceType === 'UPLOAD') {
      const fileBuffer = await storageService.getFile(document.storagePath);
      // 4. Extract text
      rawText = await textExtractorService.extractText(fileBuffer, document.mimeType);
    }

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No extractable text found.');
    }

    // 5. Clean text
    const cleanText = textCleanerService.cleanText(rawText);

    // 6. Chunk text
    const chunks = chunkingService.chunkText(cleanText);

    if (chunks.length === 0) {
      throw new Error('No extractable text found after cleaning.');
    }

    // 7. Generate embeddings in batches
    const batchSize = parseInt(process.env.EMBEDDING_BATCH_SIZE) || 20;
    const allEmbeddings = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batchChunks = chunks.slice(i, i + batchSize);
      const batchTexts = batchChunks.map(c => c.content);
      const batchEmbeddings = await embeddingService.generateEmbeddings(batchTexts);
      allEmbeddings.push(...batchEmbeddings);
    }

    // 8. Prepare and Save KnowledgeChunk records
    const qdrantPoints = [];
    const dbChunks = chunks.map((chunk, index) => {
      const qdrantPointId = uuidv4(); // Generate valid UUID for Qdrant
      
      qdrantPoints.push({
        id: qdrantPointId,
        vector: allEmbeddings[index],
        payload: {
          organizationId: organizationId.toString(),
          projectId: projectId.toString(),
          documentId: documentId.toString(),
          chunkId: null, // Will update after insert
          chunkIndex: index,
          section: chunk.section,
          version: document.version
        }
      });

      return {
        document: documentId,
        organization: organizationId,
        project: projectId,
        chunkIndex: index,
        content: chunk.content,
        section: chunk.section,
        tokenCount: chunk.tokenCount,
        qdrantPointId,
        embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        version: document.version
      };
    });

    // Save to MongoDB to get _ids
    const insertedChunks = await KnowledgeChunk.insertMany(dbChunks);

    // Update payloads with real chunkId
    for (let i = 0; i < qdrantPoints.length; i++) {
      qdrantPoints[i].payload.chunkId = insertedChunks[i]._id.toString();
    }

    // 9. Insert vectors into Qdrant
    await vectorSearchService.ensureCollection();
    await vectorSearchService.upsertVectors(qdrantPoints);

    // 10. Update chunkCount and COMPLETED status
    document.chunkCount = chunks.length;
    document.processingStatus = 'COMPLETED';
    document.processingError = undefined;
    await document.save();

    // 11. Emit Socket.IO event
    socketService.emitToProject(projectId.toString(), 'knowledge:completed', {
      documentId,
      status: 'COMPLETED'
    });

  } catch (error) {
    console.error(`[Knowledge Worker] Error processing document ${documentId}:`, error);
    
    // Attempt cleanup of partial vectors
    await vectorSearchService.deleteDocumentVectors(organizationId, projectId, documentId).catch(() => {});
    await KnowledgeChunk.deleteMany({ document: documentId, version: document.version }).catch(() => {});

    document.processingStatus = 'FAILED';
    document.processingError = error.message || 'Unknown processing error';
    await document.save();

    socketService.emitToProject(projectId.toString(), 'knowledge:failed', {
      documentId,
      status: 'FAILED',
      error: document.processingError
    });

    throw error;
  }
};

export const initKnowledgeWorker = () => {
  const worker = new Worker('knowledgeProcessing', processDocument, {
    connection: createRedisConnection(),
    concurrency: 2 // Can be configured
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error ${err.message}`);
  });

  return worker;
};
