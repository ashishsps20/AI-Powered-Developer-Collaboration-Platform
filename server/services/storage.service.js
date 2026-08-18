import fs from 'fs/promises';
import path from 'path';

class StorageService {
  constructor() {
    this.baseUploadPath = path.join(process.cwd(), 'uploads', 'knowledge');
  }

  /**
   * Save a file to the storage system
   */
  async saveFile(projectId, documentId, fileBuffer, fileName) {
    const projectDir = path.join(this.baseUploadPath, projectId.toString(), documentId.toString());
    
    await fs.mkdir(projectDir, { recursive: true });
    
    // We store the original file
    const filePath = path.join(projectDir, fileName);
    await fs.writeFile(filePath, fileBuffer);
    
    // Return relative path from base upload path
    return path.join(projectId.toString(), documentId.toString(), fileName);
  }

  /**
   * Get a file buffer
   */
  async getFile(storagePath) {
    const fullPath = path.join(this.baseUploadPath, storagePath);
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('File not found');
      }
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(storagePath) {
    if (!storagePath) return false;
    
    const fullPath = path.join(this.baseUploadPath, storagePath);
    try {
      await fs.unlink(fullPath);
      
      // Attempt to clean up empty directories
      const dirPath = path.dirname(fullPath);
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.rmdir(dirPath);
      }
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false; // Already deleted
      }
      throw error;
    }
  }
}

export default new StorageService();
