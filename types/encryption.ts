// Original data structures that will be encrypted
export interface ProposalData {
  startup_name: string;
  pitch: string;
  created_at?: string; // Optional since it's added by the server
  status?: 'pending' | 'completed'; // Add status to track evaluation state
}

export interface VCVoteData {
  vc_persona: string;
  vote: boolean;
  reasoning: string;
}

// Access token structure
export interface AccessToken {
  uuid: string;
  key: string;
}

// Database structures with encrypted data
export interface EncryptedProposal {
  id: string;
  encrypted_data: string;
  iv: string;
  created_at: Date;
  status: 'pending' | 'completed';
  is_archived: boolean;
}

export interface EncryptedVCVote {
  id: string;
  proposal_id: string;
  encrypted_data: string;
  iv: string;
  created_at: Date;
  metadata: {
    confidence: number;
    confidence_explanation?: string;
    key_points: string[];
    investment_thesis?: string;
    risks_and_recommendations?: string;
  };
} 