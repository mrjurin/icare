-- Add spr_voter_id column to profiles table
ALTER TABLE "profiles" ADD COLUMN "spr_voter_id" integer;
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_spr_voter_id_spr_voters_id_fk" FOREIGN KEY ("spr_voter_id") REFERENCES "public"."spr_voters"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Create index on spr_voter_id
CREATE INDEX IF NOT EXISTS "profiles_spr_voter_idx" ON "profiles" USING btree ("spr_voter_id");
