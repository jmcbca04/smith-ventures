import { NextResponse } from 'next/server';
import { db } from '@/db';
import { proposals, vcVotes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { evaluateProposal } from '@/lib/openai';
import { decryptDataNode } from '@/lib/server/encryption';

// Set longer timeout for Vercel
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

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

    // Decrypt the proposal data to pass to OpenAI
    let proposalData;
    try {
      proposalData = JSON.parse(
        await decryptDataNode({
          encrypted_data: proposal.encrypted_data,
          iv: proposal.iv
        },
        key)
      );
    } catch (error) {
      console.error('Failed to decrypt proposal data:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to decrypt proposal data' },
        { status: 400 }
      );
    }

    // Get evaluations from OpenAI with retries
    let evaluations;
    try {
      evaluations = await evaluateProposal(proposalData, key);
    } catch (error) {
      console.error('OpenAI evaluation failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to complete evaluations',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Store votes
    try {
      const votes = evaluations.map(evaluation => ({
        id: uuid(),
        proposal_id: proposalId,
        encrypted_data: evaluation.encrypted_data,
        iv: evaluation.iv,
        encrypted_metadata: evaluation.encrypted_metadata,
        metadata_iv: evaluation.metadata_iv,
        created_at: new Date(),
      }));

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
      console.error('Database operation failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to store evaluation results',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 