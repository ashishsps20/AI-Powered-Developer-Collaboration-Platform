import axios from 'axios';

class EmbeddingService {
  get config() {
    const provider = process.env.EMBEDDING_PROVIDER || 'openai';
    return {
      provider,
      model: process.env.EMBEDDING_MODEL || (provider === 'gemini' ? 'gemini-embedding-2' : 'text-embedding-3-small'),
      dimension: parseInt(process.env.EMBEDDING_DIMENSION) || (provider === 'gemini' ? 3072 : 1536),
      providerUrl: process.env.EMBEDDING_API_URL || (provider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta/models' : 'https://api.openai.com/v1/embeddings')
    };
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
      if (this.config.provider === 'gemini') {
        return await this.generateGeminiEmbeddings(texts, apiKey);
      } else {
        return await this.generateOpenAIEmbeddings(texts, apiKey);
      }
    } catch (error) {
      console.error('Embedding Generation Error:', error.response?.data || error.message);
      throw new Error('Failed to generate embeddings');
    }
  }

  async generateGeminiEmbeddings(texts, apiKey) {
    const { providerUrl, model, dimension } = this.config;
    // Gemini batch endpoint
    const url = `${providerUrl}/${model}:batchEmbedContents?key=${apiKey}`;
    
    // Create requests array
    const requests = texts.map(text => ({
      model: `models/${model}`,
      content: { parts: [{ text }] }
    }));

    const response = await axios.post(
      url,
      { requests },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.embeddings) {
      throw new Error('Invalid response from Gemini embedding provider');
    }

    const embeddings = response.data.embeddings.map(e => e.values);

    if (embeddings.length > 0 && embeddings[0].length !== dimension) {
      console.warn(`Warning: Expected embedding dimension ${dimension}, but got ${embeddings[0].length}`);
    }

    return embeddings;
  }

  async generateOpenAIEmbeddings(texts, apiKey) {
    const { providerUrl, model, dimension } = this.config;
    const response = await axios.post(
      providerUrl,
      {
        input: texts,
        model: model,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from OpenAI embedding provider');
    }

    const embeddings = response.data.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);
      
    if (embeddings.length > 0 && embeddings[0].length !== dimension) {
      console.warn(`Warning: Expected embedding dimension ${dimension}, but got ${embeddings[0].length}`);
    }

    return embeddings;
  }
}

export default new EmbeddingService();
