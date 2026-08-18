class ResponseParserService {
  /**
   * Safely extract the answer and sources from the LLM output.
   * Handles cases where the model returns markdown code blocks or malformed JSON.
   */
  parseResponse(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
      return { answer: 'Sorry, I was unable to generate a response.', sources: [] };
    }

    try {
      // Clean up potential markdown code blocks (e.g., ```json ... ```)
      let cleanedContent = rawContent.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.substring(7);
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.substring(3);
      }
      if (cleanedContent.endsWith('```')) {
        cleanedContent = cleanedContent.substring(0, cleanedContent.length - 3);
      }
      cleanedContent = cleanedContent.trim();

      const parsed = JSON.parse(cleanedContent);

      return {
        answer: parsed.answer || 'I could not find an answer in my output.',
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      };
    } catch (error) {
      console.error('Failed to parse AI response JSON:', error.message);
      // Fallback: If it's not valid JSON, treat the entire output as the answer text
      return {
        answer: rawContent,
        sources: []
      };
    }
  }
}

export default new ResponseParserService();
