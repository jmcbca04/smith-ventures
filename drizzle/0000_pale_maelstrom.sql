CREATE TABLE IF NOT EXISTS "proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"startup_name" text NOT NULL,
	"pitch" text NOT NULL,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vc_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"proposal_id" text NOT NULL,
	"vc_persona" text NOT NULL,
	"vote" boolean NOT NULL,
	"reasoning" text NOT NULL,
	"created_at" timestamp DEFAULT NOW() NOT NULL,
	"metadata" json
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vc_votes" ADD CONSTRAINT "vc_votes_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
