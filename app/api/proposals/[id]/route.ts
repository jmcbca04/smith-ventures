import { NextResponse } from 'next/server';
import { db } from '@/db';
import { proposals, vcVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { vcPersonas } from '@/config/vc-personas';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id;
    console.log('GET request for proposal:', proposalId);
    
    // Get the proposal
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      console.log('Proposal not found:', proposalId);
      return NextResponse.json(
        { success: false, message: 'Proposal not found' },
        { status: 404 }
      );
    }

    console.log('Found proposal:', {
      id: proposal.id,
      status: proposal.status,
      created_at: proposal.created_at,
      hasEncryptedData: !!proposal.encrypted_data,
      hasIv: !!proposal.iv
    });

    // Get all VC votes for this proposal
    const votes = await db
      .select()
      .from(vcVotes)
      .where(eq(vcVotes.proposal_id, proposalId));

    console.log(`Found ${votes.length} votes for proposal ${proposalId}`);
    console.log('Raw votes from database:', votes.map(v => ({
      id: v.id,
      hasEncryptedData: !!v.encrypted_data,
      hasIv: !!v.iv,
      hasMetadata: !!v.encrypted_metadata,
      hasMetadataIv: !!v.metadata_iv,
      created_at: v.created_at
    })));

    // Map votes to include encrypted data and metadata
    const votesWithDetails = votes.map(vote => ({
      id: vote.id,
      encrypted_data: vote.encrypted_data,
      iv: vote.iv,
      encrypted_metadata: vote.encrypted_metadata,
      metadata_iv: vote.metadata_iv,
      created_at: vote.created_at.toISOString()
    }));

    console.log('Returning proposal data:', {
      id: proposal.id,
      status: proposal.status,
      numVotes: votesWithDetails.length,
      hasEncryptedData: !!proposal.encrypted_data,
      hasIv: !!proposal.iv,
      votesHaveMetadata: votesWithDetails.every(v => v.encrypted_metadata && v.metadata_iv),
      rawStatus: proposal.status,
      rawVotes: votes.length
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        encrypted_data: proposal.encrypted_data,
        iv: proposal.iv,
        status: proposal.status,
        created_at: proposal.created_at.toISOString(),
      },
      votes: votesWithDetails,
    });
  } catch (error) {
    console.error('Proposal retrieval error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 