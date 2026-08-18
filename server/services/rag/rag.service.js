import vectorSearchService from './vectorSearch.service.js';
import KnowledgeChunk from '../../models/KnowledgeChunk.js';

class RAGService {
  /**
   * Retrieve relevant knowledge for a query
   * Combines vector search with MongoDB metadata retrieval
   */
  async retrieveKnowledge(organizationId, projectId, query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      // 1. Semantic search in Qdrant
      const searchResults = await vectorSearchService.searchKnowledge(
        organizationId,
        projectId,
        query
      );

      if (searchResults.length === 0) {
        return [];
      }

      // 2. Deduplicate results (just in case) and extract chunk IDs
      // Note: We use qdrantPointId but we need the MongoDB Chunk ID which we stored in the payload
      const uniqueChunkIds = [...new Set(searchResults.map(r => r.payload.chunkId))];

      // 3. Fetch full chunk data from MongoDB (if we need the full text, though we could store it in payload)
      // Since Qdrant payload stores limited data, we fetch the authoritative chunk from MongoDB
      const chunks = await KnowledgeChunk.find({
        _id: { $in: uniqueChunkIds },
        project: projectId // Extra safety check
      })
      .populate('document', 'title sourceType isActive')
      .lean();

      // 4. Map back to search results and sort by score
      const finalResults = searchResults.map(result => {
        const chunk = chunks.find(c => c._id.toString() === result.payload.chunkId);
        if (!chunk || !chunk.document.isActive) return null;

        return {
          documentId: chunk.document._id,
          chunkId: chunk._id,
          title: chunk.document.title,
          section: chunk.section || 'General',
          content: chunk.content,
          score: result.score
        };
      })
      .filter(Boolean); // Remove nulls

      return finalResults;
    } catch (error) {
      console.error('[RAG Service] Retrieval error:', error);
      return []; // Return empty gracefully rather than breaking the AI flow
    }
  }
}

export default new RAGService();
