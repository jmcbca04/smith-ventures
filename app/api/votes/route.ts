import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import { vcVotes } from '@/db/schema';

const voteSchema = z.object({
  proposal_id: z.string().uuid(),
  encrypted_data: z.string(),
  iv: z.string(),
  encrypted_metadata: z.string(),
  metadata_iv: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposal_id, encrypted_data, iv, encrypted_metadata, metadata_iv } = voteSchema.parse(body);

    const vote_id = uuidv4();
    
    await db.insert(vcVotes).values({
      id: vote_id,
      proposal_id,
      encrypted_data,
      iv,
      encrypted_metadata,
      metadata_iv,
    });

    return NextResponse.json({ 
      success: true, 
      vote_id,
      message: 'Vote submitted successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Vote submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 