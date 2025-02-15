import { pgTable, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const proposals = pgTable('proposals', {
  id: text('id').primaryKey(), // UUID
  startupName: text('startup_name').notNull(),
  pitch: text('pitch').notNull(),
  createdAt: timestamp('created_at').default(sql`NOW()`).notNull(),
  status: text('status').default('pending').notNull(), // pending, completed
  isArchived: boolean('is_archived').default(false).notNull(),
});

export const vcVotes = pgTable('vc_votes', {
  id: text('id').primaryKey(), // UUID
  proposalId: text('proposal_id').references(() => proposals.id).notNull(),
  vcPersona: text('vc_persona').notNull(), // The VC's name/identifier
  vote: boolean('vote').notNull(), // true = yes, false = no
  reasoning: text('reasoning').notNull(),
  createdAt: timestamp('created_at').default(sql`NOW()`).notNull(),
  metadata: json('metadata').$type<{
    confidence: number;
    keyPoints: string[];
    investmentThesis?: string;
  }>(),
}); 