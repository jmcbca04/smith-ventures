import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// Types
export type ProposalType = typeof schema.proposals.$inferSelect;
export type NewProposalType = typeof schema.proposals.$inferInsert;
export type VCVoteType = typeof schema.vcVotes.$inferSelect;
export type NewVCVoteType = typeof schema.vcVotes.$inferInsert; 