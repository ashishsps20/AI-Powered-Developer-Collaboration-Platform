import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class TextExtractorService {
  /**
   * Extract text from a file buffer based on mime type
   */
  async extractText(fileBuffer, mimeType) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Empty file buffer provided');
    }

    try {
      if (mimeType === 'application/pdf') {
        return await this.extractPdf(fileBuffer);
      } else if (
        mimeType === 'text/plain' || 
        mimeType === 'text/markdown' || 
        mimeType === 'text/x-markdown'
      ) {
        return this.extractTextFile(fileBuffer);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  async extractPdf(fileBuffer) {
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse PDF document');
    }
  }

  /**
   * Extract text from raw text/markdown file
   */
  extractTextFile(fileBuffer) {
    return fileBuffer.toString('utf-8');
  }
}

export default new TextExtractorService();
