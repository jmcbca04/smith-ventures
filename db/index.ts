import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const databaseUrl = process.env.NODE_ENV === 'production'
  ? process.env.PROD_DATABASE_URL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('No database connection string was provided. Please ensure either DATABASE_URL (development) or PROD_DATABASE_URL (production) is set.');
}

const sql = neon(databaseUrl);
// @ts-ignore - Ignoring type mismatch as this is a known issue with the current versions
export const db = drizzle(sql, { schema });

// Types
export type ProposalType = typeof schema.proposals.$inferSelect;
export type NewProposalType = typeof schema.proposals.$inferInsert;
export type VCVoteType = typeof schema.vcVotes.$inferSelect;
export type NewVCVoteType = typeof schema.vcVotes.$inferInsert; 