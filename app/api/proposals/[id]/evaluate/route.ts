import { NextResponse } from 'next/server';
import { db } from '@/db';
import { proposals, vcVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { vcPersonas } from '@/config/vc-personas';
import { encryptDataNode } from '@/lib/server/encryption';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id;
    console.log('Starting evaluation for proposal:', proposalId);

    // Get the access token from the request body
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Access token is required' },
        { status: 400 }
      );
    }

    // Extract the encryption key from the access token
    const [_, key] = accessToken.split(':');
    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Invalid access token format' },
        { status: 400 }
      );
    }

    // Get the proposal
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    if (!proposal) {
      return NextResponse.json(
        { success: false, message: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Generate test evaluations
    const votes = await Promise.all(vcPersonas.map(async (persona) => {
      const vote = Math.random() > 0.5 ? 'yes' : 'no';
      
      // Prepare vote data
      const voteData = {
        vc_persona: persona.name,
        vote: vote === 'yes',
        reasoning: `${persona.name} (${persona.focus.join(', ')}): ${vote === 'yes' ? 
          `This proposal aligns with our investment focus in ${persona.focus[0]}.` : 
          `This proposal doesn't quite match our investment criteria in ${persona.focus[0]}.`}`
      };

      // Prepare metadata
      const metadata = {
        confidence: 0.8,
        key_points: [
          `Investment focus: ${persona.focus.join(', ')}`,
          `Modeled after: ${persona.modeledAfter}`,
          vote === 'yes' ? 'Strong market potential' : 'Market concerns'
        ],
        investment_thesis: vote === 'yes' ? 
          `As a VC focused on ${persona.focus[0]}, we see strong potential in this venture.` : 
          undefined
      };

      // Encrypt both vote data and metadata using the client's encryption key
      const encryptedVote = await encryptDataNode(JSON.stringify(voteData), key);
      const encryptedMetadata = await encryptDataNode(JSON.stringify(metadata), key);

      return {
        id: uuid(),
        proposal_id: proposalId,
        encrypted_data: encryptedVote.encrypted_data,
        iv: encryptedVote.iv,
        encrypted_metadata: encryptedMetadata.encrypted_data,
        metadata_iv: encryptedMetadata.iv,
        created_at: new Date(),
      };
    }));

    // Store votes
    await db.insert(vcVotes).values(votes);
    console.log('Stored votes in database');

    // Update proposal status
    await db
      .update(proposals)
      .set({ status: 'completed' })
      .where(eq(proposals.id, proposalId));

    console.log('Updated proposal status to completed');

    // Get the updated proposal
    const [updatedProposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId));

    // Return the complete updated data
    return NextResponse.json({
      success: true,
      proposal: {
        id: updatedProposal.id,
        encrypted_data: updatedProposal.encrypted_data,
        iv: updatedProposal.iv,
        status: updatedProposal.status,
        created_at: updatedProposal.created_at.toISOString(),
      },
      votes: votes.map(vote => ({
        id: vote.id,
        encrypted_data: vote.encrypted_data,
        iv: vote.iv,
        encrypted_metadata: vote.encrypted_metadata,
        metadata_iv: vote.metadata_iv,
        created_at: vote.created_at.toISOString()
      }))
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 