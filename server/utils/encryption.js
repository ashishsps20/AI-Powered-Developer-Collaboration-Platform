import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment variables.
 * Ensures the key is exactly 32 bytes (256 bits).
 */
const getEncryptionKey = () => {
  const keyStr = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('GITHUB_TOKEN_ENCRYPTION_KEY is not defined in environment variables');
  }

  // If the key is base64 or hex, decode it. Otherwise, use it directly if it's 32 bytes.
  // For simplicity and safety, we hash the provided string using SHA-256 to guarantee a 32-byte key.
  // This allows the user to provide a strong passphrase or a random string of any length.
  return crypto.createHash('sha256').update(keyStr).digest();
};

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param {string} text - The plaintext string to encrypt.
 * @returns {string} - The encrypted string in format: iv:authTag:encryptedData (hex encoded).
 */
export const encrypt = (text) => {
  if (!text) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt a previously encrypted string using AES-256-GCM.
 * @param {string} encryptedText - The encrypted string in format: iv:authTag:encryptedData.
 * @returns {string} - The decrypted plaintext string.
 */
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encryptedDataHex] = parts;
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Failed to decrypt token');
  }
};
