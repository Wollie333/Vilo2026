/**
 * Encryption Utility
 * Provides AES-256-CBC encryption/decryption for sensitive credentials
 *
 * Security Notes:
 * - Uses crypto.randomBytes for IV generation (cryptographically secure)
 * - IV is stored with encrypted data (format: "iv:encryptedData")
 * - Encryption key must be 32 bytes (256 bits) and stored in .env
 * - Never log or expose decrypted credentials
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validate encryption key on module load
if (!ENCRYPTION_KEY) {
  throw new Error(
    'ENCRYPTION_KEY environment variable is required. Generate with: openssl rand -base64 32'
  );
}

// Validate key length (must be 32 bytes when base64-decoded)
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'base64');
if (keyBuffer.length !== 32) {
  throw new Error(
    `ENCRYPTION_KEY must be 32 bytes (256 bits). Current length: ${keyBuffer.length} bytes. Generate with: openssl rand -base64 32`
  );
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string;  // Format: "iv:encryptedData" (both hex-encoded)
  algorithm: typeof ALGORITHM;
}

/**
 * Encrypt a plaintext string using AES-256-CBC
 *
 * @param plaintext The string to encrypt
 * @returns EncryptedData object with encrypted string and algorithm
 * @throws Error if encryption fails
 *
 * @example
 * const encrypted = encryptCredential('my-secret-token');
 * // Returns: { encrypted: "a1b2c3...:d4e5f6...", algorithm: "aes-256-cbc" }
 */
export function encryptCredential(plaintext: string): EncryptedData {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a non-empty string');
  }

  try {
    // Generate random IV (16 bytes for AES)
    const iv = crypto.randomBytes(16);

    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (both hex-encoded)
    return {
      encrypted: `${iv.toString('hex')}:${encrypted}`,
      algorithm: ALGORITHM,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt credential');
  }
}

/**
 * Decrypt an encrypted credential back to plaintext
 *
 * @param data EncryptedData object containing encrypted string and algorithm
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails or data is invalid
 *
 * @example
 * const plaintext = decryptCredential({
 *   encrypted: "a1b2c3...:d4e5f6...",
 *   algorithm: "aes-256-cbc"
 * });
 * // Returns: "my-secret-token"
 */
export function decryptCredential(data: EncryptedData): string {
  if (!data || !data.encrypted || !data.algorithm) {
    throw new Error('Invalid encrypted data structure');
  }

  if (data.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported algorithm: ${data.algorithm}. Expected: ${ALGORITHM}`);
  }

  try {
    // Split IV and encrypted data
    const parts = data.encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format. Expected "iv:encryptedData"');
    }

    const [ivHex, encryptedHex] = parts;

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    // Validate IV length
    if (iv.length !== 16) {
      throw new Error(`Invalid IV length: ${iv.length} bytes. Expected: 16 bytes`);
    }

    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);

    // Decrypt the data
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt credential. Data may be corrupted or key is incorrect.');
  }
}

/**
 * Helper function to encrypt a plaintext string and return just the encrypted string
 * (without the EncryptedData wrapper)
 *
 * @param plaintext The string to encrypt
 * @returns Encrypted string in format "iv:encryptedData"
 */
export function encryptString(plaintext: string): string {
  const result = encryptCredential(plaintext);
  return result.encrypted;
}

/**
 * Helper function to decrypt an encrypted string directly
 *
 * @param encryptedString Encrypted string in format "iv:encryptedData"
 * @returns Decrypted plaintext string
 */
export function decryptString(encryptedString: string): string {
  return decryptCredential({
    encrypted: encryptedString,
    algorithm: ALGORITHM,
  });
}

/**
 * Mask a credential for display purposes (show last 4 characters only)
 *
 * @param credential The credential to mask
 * @returns Masked string like "***1234"
 *
 * @example
 * maskCredential("123456789012345")
 * // Returns: "***2345"
 */
export function maskCredential(credential: string): string {
  if (!credential || credential.length <= 4) {
    return '****';
  }
  const lastFour = credential.slice(-4);
  return `***${lastFour}`;
}

/**
 * Check if encryption key is properly configured
 *
 * @returns true if encryption key is valid, false otherwise
 */
export function isEncryptionConfigured(): boolean {
  try {
    return keyBuffer.length === 32;
  } catch {
    return false;
  }
}

/**
 * Generate a new random encryption key (for initial setup)
 *
 * @returns Base64-encoded 32-byte key
 *
 * @example
 * const newKey = generateEncryptionKey();
 * console.log('Add to .env:', `ENCRYPTION_KEY=${newKey}`);
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
