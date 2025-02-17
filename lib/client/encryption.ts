import { AccessToken, ProposalData, VCVoteData } from '@/types/encryption';

// Generate a random access token
export async function generateAccessToken(): Promise<AccessToken> {
  const uuid = crypto.randomUUID();
  const keyBuffer = crypto.getRandomValues(new Uint8Array(32));
  const key = btoa(String.fromCharCode(...keyBuffer));
  return { uuid, key };
}

// Format access token for storage/transmission
export function formatAccessToken(token: AccessToken): string {
  return `${token.uuid}:${token.key}`;
}

// Parse access token
export function parseAccessToken(tokenString: string): AccessToken {
  const [uuid, key] = tokenString.split(':');
  if (!uuid || !key) {
    throw new Error('Invalid access token format');
  }
  return { uuid, key };
}

// Import key from base64 string
export async function importKey(keyStr: string): Promise<CryptoKey> {
  try {
    const keyData = atob(keyStr);
    const keyBuffer = new Uint8Array(keyData.length);
    for (let i = 0; i < keyData.length; i++) {
      keyBuffer[i] = keyData.charCodeAt(i);
    }
    
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error('Key import error:', error.message);
      if (error.message.includes('atob')) {
        throw new Error('Invalid base64 encoding in key');
      }
    }
    throw error;
  }
}

// Encrypt data using Web Crypto API
export async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ encrypted_data: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    encrypted_data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt data using Web Crypto API
export async function decryptData(
  encryptedData: { encrypted_data: string; iv: string },
  key: CryptoKey
): Promise<string> {
  try {
    // Convert base64 to array buffer more safely
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const encryptedBuffer = Uint8Array.from(atob(encryptedData.encrypted_data), c => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Decryption error:', error.message);
      if (error.message.includes('atob')) {
        throw new Error('Invalid base64 encoding in encrypted data');
      }
    }
    throw error;
  }
}

export class EncryptionService {
  private static instance: EncryptionService;
  private tokenKey = 'smith_ventures_tokens';

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Store a token with its associated proposal ID
  storeToken(proposal_id: string, token: string) {
    const tokens = this.getStoredTokens();
    tokens[proposal_id] = token;
    localStorage.setItem(this.tokenKey, JSON.stringify(tokens));
  }

  // Get all stored tokens
  private getStoredTokens(): Record<string, string> {
    const tokens = localStorage.getItem(this.tokenKey);
    return tokens ? JSON.parse(tokens) : {};
  }

  // Get token for a specific proposal
  getToken(proposal_id: string): string | null {
    console.log('getToken called with:', proposal_id, typeof proposal_id);
    const tokens = this.getStoredTokens();
    console.log('Stored tokens:', tokens);
    const token = tokens[proposal_id] || null;
    console.log('Found token:', token ? 'Yes' : 'No');
    return token;
  }

  // Submit a new proposal with encryption
  async submitProposal(data: ProposalData): Promise<{ proposal_id: string; token: string }> {
    // Generate new access token
    const accessToken = await generateAccessToken();
    const key = await importKey(accessToken.key);
    
    // Encrypt the data
    const encrypted = await encryptData(JSON.stringify(data), key);
    
    // Submit to API
    const response = await fetch('/api/proposals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encrypted_data: encrypted.encrypted_data,
        iv: encrypted.iv,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit proposal');
    }

    const result = await response.json();
    const token = formatAccessToken(accessToken);
    
    // Store the token
    this.storeToken(result.proposalId, token);
    
    return {
      proposal_id: result.proposalId,
      token,
    };
  }

  // Submit a VC vote with encryption
  async submitVote(proposal_id: string, data: VCVoteData, metadata: any): Promise<{ vote_id: string }> {
    const token = this.getToken(proposal_id);
    if (!token) {
      throw new Error('No access token found for this proposal');
    }

    const { key } = parseAccessToken(token);
    const cryptoKey = await importKey(key);
    
    // Encrypt both vote data and metadata
    const encryptedVote = await encryptData(JSON.stringify(data), cryptoKey);
    const encryptedMetadata = await encryptData(JSON.stringify(metadata), cryptoKey);
    
    // Submit to API
    const response = await fetch('/api/votes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proposal_id,
        encrypted_data: encryptedVote.encrypted_data,
        iv: encryptedVote.iv,
        encrypted_metadata: encryptedMetadata.encrypted_data,
        metadata_iv: encryptedMetadata.iv,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit vote');
    }

    const result = await response.json();
    return { vote_id: result.vote_id };
  }

  // Retrieve and decrypt a proposal
  async getProposal(proposal_id: string): Promise<{
    proposal: ProposalData;
    votes: Array<{ id: string; vote: VCVoteData; metadata: any }>;
  }> {
    console.log('getProposal called with:', proposal_id, typeof proposal_id);
    
    if (!proposal_id || proposal_id === 'undefined') {
      console.error('Invalid proposal ID in getProposal:', proposal_id);
      throw new Error('Invalid proposal ID');
    }

    const token = this.getToken(proposal_id);
    console.log('Token found:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.error('No access token found for proposal:', proposal_id);
      throw new Error('No access token found for this proposal');
    }

    const { key } = parseAccessToken(token);
    console.log('Successfully parsed access token');
    
    const cryptoKey = await importKey(key);
    console.log('Successfully imported crypto key');

    // Fetch encrypted data
    console.log('Fetching from API:', `/api/proposals/${proposal_id}`);
    const response = await fetch(`/api/proposals/${proposal_id}`);
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch proposal' }));
      console.error('API error:', error);
      throw new Error(error.message || 'Failed to fetch proposal');
    }

    const data = await response.json();
    console.log('API response data:', {
      success: data.success,
      hasProposal: !!data.proposal,
      numVotes: data.votes?.length,
      proposalStatus: data.proposal?.status
    });
    
    if (!data.success || !data.proposal) {
      throw new Error(data.message || 'Failed to fetch proposal data');
    }
    
    // Decrypt proposal
    const decryptedProposal = JSON.parse(
      await decryptData({
        encrypted_data: data.proposal.encrypted_data,
        iv: data.proposal.iv,
      }, cryptoKey)
    ) as ProposalData;

    // Add status and created_at from the encrypted proposal
    decryptedProposal.status = data.proposal.status;
    decryptedProposal.created_at = data.proposal.created_at;

    // Decrypt votes if they exist
    const decryptedVotes = data.votes?.length > 0 
      ? await Promise.all(
          data.votes.map(async (vote: any) => ({
            id: vote.id,
            vote: JSON.parse(
              await decryptData({
                encrypted_data: vote.encrypted_data,
                iv: vote.iv,
              }, cryptoKey)
            ) as VCVoteData,
            metadata: JSON.parse(
              await decryptData({
                encrypted_data: vote.encrypted_metadata,
                iv: vote.metadata_iv,
              }, cryptoKey)
            ),
          }))
        )
      : [];

    return {
      proposal: decryptedProposal,
      votes: decryptedVotes,
    };
  }

  // Start evaluation with encryption
  async startEvaluation(proposal_id: string): Promise<{ success: boolean; numVotes?: number }> {
    const token = this.getToken(proposal_id);
    if (!token) {
      throw new Error('No access token found for this proposal');
    }

    const response = await fetch(`/api/proposals/${proposal_id}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken: token }),
    });

    if (!response.ok) {
      throw new Error('Failed to start evaluation');
    }

    const result = await response.json();
    return result;
  }
} 