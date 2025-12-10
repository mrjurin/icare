-- Add locality_id column to issues table
ALTER TABLE "issues" ADD COLUMN "locality_id" integer REFERENCES "localities"("id") ON DELETE set null;
--> statement-breakpoint
-- Create index for locality_id
CREATE INDEX IF NOT EXISTS "issues_locality_idx" ON "issues" USING btree ("locality_id");
