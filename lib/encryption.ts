import { v4 as uuidv4 } from 'uuid';

export interface EncryptedData {
  encryptedData: string;
  iv: string;
}

export interface AccessToken {
  uuid: string;
  key: string;
}

// Generate a random encryption key
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Convert CryptoKey to base64 string for storage
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Convert base64 string back to CryptoKey
export async function importKey(keyStr: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyStr), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data
export async function encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt data
export async function decryptData(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
  const encryptedBuffer = Uint8Array.from(
    atob(encryptedData.encryptedData),
    (c) => c.charCodeAt(0)
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// Generate an access token (UUID + encryption key)
export async function generateAccessToken(): Promise<AccessToken> {
  const uuid = uuidv4();
  const key = await generateEncryptionKey();
  const exportedKey = await exportKey(key);
  
  return {
    uuid,
    key: exportedKey,
  };
}

// Format access token for user
export function formatAccessToken(token: AccessToken): string {
  return `${token.uuid}:${token.key}`;
}

// Parse access token from string
export function parseAccessToken(tokenString: string): AccessToken {
  const [uuid, key] = tokenString.split(':');
  if (!uuid || !key) {
    throw new Error('Invalid access token format');
  }
  return { uuid, key };
} 