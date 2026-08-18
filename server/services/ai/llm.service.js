import axios from 'axios';

class LLMService {
  /**
   * Send a chat completion request to an OpenAI-compatible API
   * @param {Array} messages - Array of message objects { role, content }
   * @param {Object} options - Additional options (temperature, etc)
   * @returns {Object} { content, usage, model }
   */
  async generateResponse(messages, options = {}) {
    const providerUrl = process.env.AI_PROVIDER_URL || 'https://api.openai.com/v1/chat/completions';
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo';
    
    if (!apiKey) {
      throw new Error('AI service is not configured (missing API key)');
    }

    try {
      const response = await axios.post(
        providerUrl,
        {
          model,
          messages,
          temperature: options.temperature || parseFloat(process.env.AI_TEMPERATURE) || 0.7,
          max_tokens: options.maxTokens || parseInt(process.env.AI_MAX_TOKENS) || 2048,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          timeout: parseInt(process.env.AI_REQUEST_TIMEOUT_MS) || 30000,
        }
      );

      const responseData = response.data;
      const content = responseData.choices[0]?.message?.content || '';
      
      return {
        content,
        usage: {
          promptTokens: responseData.usage?.prompt_tokens || 0,
          completionTokens: responseData.usage?.completion_tokens || 0,
          totalTokens: responseData.usage?.total_tokens || 0,
        },
        model: responseData.model || model,
      };
    } catch (error) {
      console.error('LLM Service Error:', error.response?.data || error.message);
      
      // Handle known errors cleanly
      if (error.response?.status === 401) {
        throw new Error('AI service configuration error (Invalid API key)');
      }
      if (error.response?.status === 429) {
        throw new Error('AI service rate limit exceeded. Please try again later.');
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('AI service timed out.');
      }
      
      throw new Error('AI service is temporarily unavailable.');
    }
  }
}

export default new LLMService();
