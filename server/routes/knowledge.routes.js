import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireProjectMember, requireProjectManager } from '../middleware/project.middleware.js';
import {
  createManualDocument,
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
  reprocessDocument,
  searchKnowledge
} from '../controllers/knowledge.controller.js';

const router = express.Router({ mergeParams: true });

// Setup multer for memory storage since we handle saving to disk manually after validation
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_KNOWLEDGE_DOCUMENT_SIZE) || 10 * 1024 * 1024,
  },
});

// All knowledge routes require auth and project membership
router.use(requireAuth);
router.use(requireProjectMember);

// Base: /api/organizations/:organizationId/projects/:projectId/knowledge

// Search
router.post('/search', searchKnowledge);

// List all documents
router.get('/documents', listDocuments);

// Get specific document
router.get('/documents/:documentId', getDocument);

// Manual document creation (requires at least MEMBER role? or let's say anyone can contribute knowledge)
// Let's restrict to PROJECT_MANAGER or higher for document management as per instructions:
// "Project Manager: create document, upload document, delete document, reprocess document, search"
// Actually, let's just use requireProjectRole(['OWNER', 'ADMIN', 'PROJECT_MANAGER']) for writes.
// Note: If 'PROJECT_MANAGER' is not in your roles, adjust accordingly. (Often it's MANAGER or ADMIN).
// Checking existing implementation... Usually 'OWNER', 'ADMIN' are org roles, and 'PROJECT_MANAGER', 'MEMBER' are project roles.
// I'll assume 'PROJECT_MANAGER' is valid based on prompt: "Use existing project roles. At minimum: Project Manager:"

// Create manual document
router.post('/documents/manual', requireProjectManager, createManualDocument);

// Upload document
router.post('/documents', requireProjectManager, upload.single('file'), uploadDocument);

// Reprocess document
router.post('/documents/:documentId/reprocess', requireProjectManager, reprocessDocument);

// Delete document
router.delete('/documents/:documentId', requireProjectManager, deleteDocument);

export default router;
