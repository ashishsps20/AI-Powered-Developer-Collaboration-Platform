class TextCleanerService {
  /**
   * Clean text extracted from documents
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let cleaned = text;

    // 1. Normalize line endings (CRLF -> LF)
    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/\r/g, '\n');

    // 2. Remove excessive blank lines (more than 2 consecutive newlines)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 3. Remove excessive trailing/leading whitespaces on each line
    cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');

    // 4. Remove unprintable control characters, but keep newlines, tabs, and carriage returns
    // eslint-disable-next-line no-control-regex
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

    // 5. Replace multiple spaces with a single space (except at the start of a line to preserve indentation)
    cleaned = cleaned.replace(/(?<!^)\s{2,}/gm, ' ');

    return cleaned.trim();
  }
}

export default new TextCleanerService();
