import { QdrantClient } from '@qdrant/js-client-rest';
import embeddingService from './embedding.service.js';

class VectorSearchService {
  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  get collectionName() {
    return process.env.QDRANT_COLLECTION || 'project_knowledge';
  }

  get dimension() {
    return parseInt(process.env.EMBEDDING_DIMENSION) || 1536;
  }

  /**
   * Ensure collection exists
   */
  async ensureCollection() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);
      
      if (!exists) {
        console.log(`[Qdrant] Creating collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.dimension,
            distance: 'Cosine',
          },
        });
        
        // Create indexes for efficient filtering
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'organizationId',
          field_schema: 'keyword',
        });
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'projectId',
          field_schema: 'keyword',
        });
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'documentId',
          field_schema: 'keyword',
        });
      }
    } catch (error) {
      console.error('[Qdrant] Failed to ensure collection:', error);
      // We don't throw here to allow app startup even if Qdrant is temporarily down
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(organizationId, projectId, query, options = {}) {
    const limit = options.limit || parseInt(process.env.RAG_TOP_K) || 5;
    const scoreThreshold = options.scoreThreshold || parseFloat(process.env.RAG_SCORE_THRESHOLD) || 0.6;

    // 1. Generate query embedding
    const queryVector = await embeddingService.generateEmbedding(query);

    // 2. Search Qdrant with filters
    try {
      const searchResults = await this.client.query(this.collectionName, {
        query: queryVector,
        limit,
        score_threshold: scoreThreshold,
        filter: {
          must: [
            {
              key: 'organizationId',
              match: { value: organizationId.toString() },
            },
            {
              key: 'projectId',
              match: { value: projectId.toString() },
            }
          ]
        },
        with_payload: true,
      });

      if (!searchResults || !searchResults.points) return [];

      return searchResults.points.map(result => ({
        id: result.id,
        score: result.score,
        payload: result.payload,
      }));
    } catch (error) {
      console.error('[Qdrant] Search failed:', error);
      throw new Error('Vector search failed');
    }
  }

  /**
   * Insert or update vectors
   */
  async upsertVectors(points) {
    if (!points || points.length === 0) return;
    
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      });
    } catch (error) {
      console.error('[Qdrant] Upsert failed:', error);
      throw new Error('Failed to insert vectors into Qdrant');
    }
  }

  /**
   * Delete vectors by document ID
   */
  async deleteDocumentVectors(organizationId, projectId, documentId) {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'organizationId',
              match: { value: organizationId.toString() },
            },
            {
              key: 'projectId',
              match: { value: projectId.toString() },
            },
            {
              key: 'documentId',
              match: { value: documentId.toString() },
            }
          ]
        }
      });
      return true;
    } catch (error) {
      console.error('[Qdrant] Delete by document ID failed:', error);
      return false;
    }
  }
}

export default new VectorSearchService();
