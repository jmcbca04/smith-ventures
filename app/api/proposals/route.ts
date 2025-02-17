import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db';
import { proposals } from '@/db/schema';
import { EncryptedData } from '@/lib/encryption';

const proposalSchema = z.object({
  encrypted_data: z.string(),
  iv: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { encrypted_data, iv } = proposalSchema.parse(body);

    const proposalId = uuidv4();
    
    await db.insert(proposals).values({
      id: proposalId,
      encrypted_data,
      iv,
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