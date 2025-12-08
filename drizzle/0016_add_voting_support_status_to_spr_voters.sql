-- Add voting_support_status column to spr_voters table
-- The enum type already exists from migration 0010
ALTER TABLE "spr_voters" ADD COLUMN "voting_support_status" "voting_support_status";
--> statement-breakpoint
-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "spr_voters_voting_support_status_idx" ON "spr_voters" USING btree ("voting_support_status");
