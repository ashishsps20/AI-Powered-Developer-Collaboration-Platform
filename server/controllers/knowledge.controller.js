import KnowledgeDocument from '../models/KnowledgeDocument.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { knowledgeQueue } from '../queues/knowledge.queue.js';
import storageService from '../services/storage.service.js';
import vectorSearchService from '../services/rag/vectorSearch.service.js';

export const createManualDocument = async (req, res, next) => {
  try {
    const { organizationId, projectId } = req.params;
    const { title, description, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const document = await KnowledgeDocument.create({
      organization: organizationId,
      project: projectId,
      uploadedBy: req.user._id,
      title,
      description: content, // We store manual content here for processing later
      sourceType: 'MANUAL',
      mimeType: 'text/markdown', // Assume manual entry is markdown or plain text
      processingStatus: 'PENDING',
    });

    await knowledgeQueue.add('processDocument', {
      documentId: document._id.toString(),
      projectId,
      organizationId,
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    const { organizationId, projectId } = req.params;
    const { title, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    if (!title) {
      // Clean up uploaded file if validation fails since multer stored it in memory
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const document = await KnowledgeDocument.create({
      organization: organizationId,
      project: projectId,
      uploadedBy: req.user._id,
      title,
      description,
      sourceType: 'UPLOAD',
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      processingStatus: 'PENDING',
    });

    // Save physical file
    const storagePath = await storageService.saveFile(
      projectId,
      document._id,
      file.buffer,
      file.originalname
    );

    document.storagePath = storagePath;
    await document.save();

    await knowledgeQueue.add('processDocument', {
      documentId: document._id.toString(),
      projectId,
      organizationId,
    });

    // Don't return storage path
    const docResponse = document.toObject();
    delete docResponse.storagePath;

    res.status(201).json({
      success: true,
      data: docResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const listDocuments = async (req, res, next) => {
  try {
    const { organizationId, projectId } = req.params;

    const documents = await KnowledgeDocument.find({
      organization: organizationId,
      project: projectId,
    })
      .select('-storagePath')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (req, res, next) => {
  try {
    const { organizationId, projectId, documentId } = req.params;

    const document = await KnowledgeDocument.findOne({
      _id: documentId,
      organization: organizationId,
      project: projectId,
    })
      .select('-storagePath')
      .populate('uploadedBy', 'name email');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { organizationId, projectId, documentId } = req.params;

    const document = await KnowledgeDocument.findOne({
      _id: documentId,
      organization: organizationId,
      project: projectId,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // 1. Delete Qdrant vectors
    await vectorSearchService.deleteDocumentVectors(organizationId, projectId, documentId);

    // 2. Delete KnowledgeChunks
    await KnowledgeChunk.deleteMany({ document: documentId });

    // 3. Delete File
    if (document.storagePath) {
      await storageService.deleteFile(document.storagePath);
    }

    // 4. Delete Document
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const reprocessDocument = async (req, res, next) => {
  try {
    const { organizationId, projectId, documentId } = req.params;

    const document = await KnowledgeDocument.findOne({
      _id: documentId,
      organization: organizationId,
      project: projectId,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Increment version
    document.version += 1;
    document.processingStatus = 'PENDING';
    document.processingError = undefined;
    await document.save();

    // Remove old active vectors & chunks
    await vectorSearchService.deleteDocumentVectors(organizationId, projectId, documentId).catch(console.error);
    await KnowledgeChunk.deleteMany({ document: documentId, version: { $lt: document.version } }).catch(console.error);

    // Queue processing
    await knowledgeQueue.add('processDocument', {
      documentId: document._id.toString(),
      projectId,
      organizationId,
    });

    res.status(200).json({
      success: true,
      message: 'Document queued for reprocessing',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const searchKnowledge = async (req, res, next) => {
  try {
    const { organizationId, projectId } = req.params;
    const { query, limit } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    // Import lazily to avoid circular dependencies if any
    const ragService = (await import('../services/rag/rag.service.js')).default;
    
    // searchKnowledge returns top K results
    // We just reuse ragService for direct UI searches
    // wait, vectorSearchService handles options.limit, but ragService doesn't accept limit in my code yet. Let's just use vectorSearchService and map manually for UI search, or add limit to RAG service
    
    const vectorSearchService = (await import('../services/rag/vectorSearch.service.js')).default;
    const searchResults = await vectorSearchService.searchKnowledge(organizationId, projectId, query, { limit });

    if (searchResults.length === 0) {
       return res.status(200).json({ success: true, data: { results: [] } });
    }

    const uniqueChunkIds = [...new Set(searchResults.map(r => r.payload.chunkId))];
    const chunks = await KnowledgeChunk.find({ _id: { $in: uniqueChunkIds } })
      .populate('document', 'title')
      .lean();

    const results = searchResults.map(result => {
      const chunk = chunks.find(c => c._id.toString() === result.payload.chunkId);
      if (!chunk) return null;
      return {
        documentId: chunk.document._id,
        chunkId: chunk._id,
        title: chunk.document.title,
        section: chunk.section || 'General',
        content: chunk.content,
        score: result.score
      };
    }).filter(Boolean);

    res.status(200).json({
      success: true,
      data: { results },
    });
  } catch (error) {
    next(error);
  }
};
