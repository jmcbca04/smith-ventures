import crypto from 'crypto';
import { AccessToken } from '@/types/encryption';

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

// Convert base64 string to key buffer
function importKeyNode(keyStr: string): Buffer {
  return Buffer.from(keyStr, 'base64');
}

// Decrypt data using Node's crypto
export async function decryptDataNode(
  encryptedData: { encrypted_data: string; iv: string },
  keyStr: string
): Promise<string> {
  try {
    const key = importKeyNode(keyStr);
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const encryptedBuffer = Buffer.from(encryptedData.encrypted_data, 'base64');
    
    // Extract the auth tag from the end of the encrypted data
    const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH);
    const ciphertext = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Encrypt data using Node's crypto
export async function encryptDataNode(
  data: string,
  keyStr: string
): Promise<{ encrypted_data: string; iv: string }> {
  try {
    const key = importKeyNode(keyStr);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);

    // Get the auth tag and append it to the encrypted data
    const authTag = cipher.getAuthTag();
    const encryptedWithAuthTag = Buffer.concat([encrypted, authTag]);

    return {
      encrypted_data: encryptedWithAuthTag.toString('base64'),
      iv: iv.toString('base64'),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Parse access token
export function parseAccessToken(tokenString: string): AccessToken {
  const [uuid, key] = tokenString.split(':');
  if (!uuid || !key) {
    throw new Error('Invalid access token format');
  }
  return { uuid, key };
} 