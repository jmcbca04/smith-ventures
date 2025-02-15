import { NextResponse } from 'next/server';
import { db } from '@/db';
import { proposals, vcVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getVCEvaluation } from '@/lib/openai';
import { vcPersonas } from '@/config/vc-personas';

export async function POST(
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

    // Artificial delay to simulate real VC deliberation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get evaluations from all VCs
    const evaluationPromises = vcPersonas.map(async (vcPersona) => {
      const evaluation = await getVCEvaluation(
        vcPersona,
        proposal.startupName,
        proposal.pitch
      );

      // Save the vote
      await db.insert(vcVotes).values({
        id: uuidv4(),
        proposalId,
        vcPersona: vcPersona.id,
        vote: evaluation.vote,
        reasoning: evaluation.reasoning,
        metadata: evaluation.metadata,
      });

      return {
        vcPersona,
        evaluation,
      };
    });

    const evaluations = await Promise.all(evaluationPromises);

    // Update proposal status
    await db
      .update(proposals)
      .set({ status: 'completed' })
      .where(eq(proposals.id, proposalId));

    return NextResponse.json({
      success: true,
      evaluations: evaluations.map(({ vcPersona, evaluation }) => ({
        vcName: vcPersona.name,
        modeledAfter: vcPersona.modeledAfter,
        vote: evaluation.vote,
        reasoning: evaluation.reasoning,
        metadata: evaluation.metadata,
      })),
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 