import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
// @ts-ignore - Ignoring type mismatch as this is a known issue with the current versions
export const db = drizzle(sql, { schema });

// Types
export type ProposalType = typeof schema.proposals.$inferSelect;
export type NewProposalType = typeof schema.proposals.$inferInsert;
export type VCVoteType = typeof schema.vcVotes.$inferSelect;
export type NewVCVoteType = typeof schema.vcVotes.$inferInsert; 