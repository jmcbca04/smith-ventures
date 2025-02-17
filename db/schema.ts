import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const proposals = pgTable('proposals', {
  id: text('id').primaryKey(), // UUID
  encrypted_data: text('encrypted_data').notNull(), // Base64 encrypted data
  iv: text('iv').notNull(), // Initialization vector for decryption
  created_at: timestamp('created_at').default(sql`NOW()`).notNull(),
  status: text('status').default('pending').notNull(), // pending, completed
  is_archived: boolean('is_archived').default(false).notNull(),
});

export const vcVotes = pgTable('vc_votes', {
  id: text('id').primaryKey(), // UUID
  proposal_id: text('proposal_id').references(() => proposals.id).notNull(),
  encrypted_data: text('encrypted_data').notNull(), // Base64 encrypted data
  iv: text('iv').notNull(), // Initialization vector for decryption
  encrypted_metadata: text('encrypted_metadata').notNull(), // Base64 encrypted metadata
  metadata_iv: text('metadata_iv').notNull(), // IV for metadata decryption
  created_at: timestamp('created_at').default(sql`NOW()`).notNull(),
}); 