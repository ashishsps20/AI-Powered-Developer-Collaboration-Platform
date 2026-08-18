import axios from 'axios';

class EmbeddingService {
  constructor() {
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.dimension = parseInt(process.env.EMBEDDING_DIMENSION) || 1536;
    // Default to OpenAI compatibility
    this.providerUrl = process.env.EMBEDDING_API_URL || 'https://api.openai.com/v1/embeddings';
  }

  /**
   * Generates embedding for a single text string
   */
  async generateEmbedding(text) {
    const results = await this.generateEmbeddings([text]);
    return results[0];
  }

  /**
   * Generates embeddings for an array of text strings
   */
  async generateEmbeddings(texts) {
    if (!texts || texts.length === 0) return [];
    
    const apiKey = process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error('Embedding API key is missing');
    }

    try {
      const response = await axios.post(
        this.providerUrl,
        {
          input: texts,
          model: this.model,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: 30000,
        }
      );

      // OpenAI-compatible response format
      // { data: [{ embedding: [...] }, ...] }
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from embedding provider');
      }

      // Sort by index just in case and map to vector arrays
      const embeddings = response.data.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);
        
      if (embeddings.length > 0 && embeddings[0].length !== this.dimension) {
        console.warn(`Warning: Expected embedding dimension ${this.dimension}, but got ${embeddings[0].length}`);
      }

      return embeddings;
    } catch (error) {
      console.error('Embedding Generation Error:', error.response?.data || error.message);
      throw new Error('Failed to generate embeddings');
    }
  }
}

export default new EmbeddingService();
