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

    // Get all VC votes for this proposal
    const votes = await db
      .select()
      .from(vcVotes)
      .where(eq(vcVotes.proposalId, proposalId));

    // Map votes to include VC persona details
    const votesWithDetails = votes.map(vote => {
      const vcPersona = vcPersonas.find(vc => vc.id === vote.vcPersona);
      return {
        vcName: vcPersona?.name,
        modeledAfter: vcPersona?.modeledAfter,
        vote: vote.vote,
        reasoning: vote.reasoning,
        metadata: vote.metadata,
      };
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        startupName: proposal.startupName,
        pitch: proposal.pitch,
        status: proposal.status,
        createdAt: proposal.createdAt,
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