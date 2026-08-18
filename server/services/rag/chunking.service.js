class ChunkingService {
  constructor() {
    this.defaultChunkSize = parseInt(process.env.RAG_CHUNK_SIZE) || 800;
    this.defaultChunkOverlap = parseInt(process.env.RAG_CHUNK_OVERLAP) || 100;
  }

  /**
   * Simple semantic chunker.
   * Splits by headings/paragraphs and groups into chunks matching the target size.
   */
  chunkText(text, options = {}) {
    const chunkSize = options.chunkSize || this.defaultChunkSize;
    const chunkOverlap = options.chunkOverlap || this.defaultChunkOverlap;

    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    
    const chunks = [];
    let currentChunk = '';
    let currentSection = 'General';

    // Simple heading extraction logic (Markdown style)
    const headingRegex = /^(#{1,6})\s+(.*)$/m;

    for (const paragraph of paragraphs) {
      // Check if this paragraph contains a heading to update current section context
      const headingMatch = paragraph.match(headingRegex);
      if (headingMatch) {
        currentSection = headingMatch[2].trim();
      }

      // If adding this paragraph exceeds chunk size, save the current chunk
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          section: currentSection,
          // Rough token estimation: 1 token ~= 4 chars
          tokenCount: Math.ceil(currentChunk.length / 4)
        });

        // Start new chunk with overlap from the end of the previous chunk
        // Overlap by going back 'chunkOverlap' characters, finding nearest word boundary
        const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
        const overlapText = currentChunk.substring(overlapStart);
        // Find first space in overlap text to avoid cutting words
        const firstSpaceIdx = overlapText.indexOf(' ');
        
        currentChunk = (firstSpaceIdx !== -1 ? overlapText.substring(firstSpaceIdx) : overlapText).trim() + '\n\n' + paragraph;
      } else {
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }

    // Add the final chunk if it has content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        section: currentSection,
        tokenCount: Math.ceil(currentChunk.length / 4)
      });
    }

    // Ensure we don't have empty chunks
    return chunks.filter(c => c.content.length > 0);
  }
}

export default new ChunkingService();
