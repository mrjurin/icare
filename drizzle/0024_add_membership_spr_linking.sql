-- Create linking table between membership applications and SPR voters
-- This allows tracking SPR voter records across different versions (PRN 1, PRN 2, etc.)
CREATE TABLE IF NOT EXISTS "membership_application_spr_voters" (
	"id" serial PRIMARY KEY NOT NULL,
	"membership_application_id" integer NOT NULL REFERENCES "membership_applications"("id") ON DELETE cascade,
	"spr_voter_id" integer NOT NULL REFERENCES "spr_voters"("id") ON DELETE cascade,
	"linked_by" integer REFERENCES "staff"("id") ON DELETE set null,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	"is_auto_linked" boolean DEFAULT false NOT NULL,
	"notes" text,
	CONSTRAINT "membership_application_spr_voters_unique" UNIQUE("membership_application_id", "spr_voter_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_application_spr_voters_application_idx" ON "membership_application_spr_voters" USING btree ("membership_application_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_application_spr_voters_spr_voter_idx" ON "membership_application_spr_voters" USING btree ("spr_voter_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_application_spr_voters_linked_by_idx" ON "membership_application_spr_voters" USING btree ("linked_by");
