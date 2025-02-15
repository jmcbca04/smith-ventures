import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import { proposals } from '@/db/schema';

const proposalSchema = z.object({
  startupName: z.string().min(1).max(100),
  pitch: z.string().min(50).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startupName, pitch } = proposalSchema.parse(body);

    const proposalId = uuidv4();
    
    await db.insert(proposals).values({
      id: proposalId,
      startupName,
      pitch,
      status: 'pending',
    });

    return NextResponse.json({ 
      success: true, 
      proposalId,
      message: 'Proposal submitted successfully' 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Proposal submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 