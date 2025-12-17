-- Create issue_priority enum type
CREATE TYPE "public"."issue_priority" AS ENUM('low', 'medium', 'high', 'critical');
--> statement-breakpoint

-- Add priority column to issues table
ALTER TABLE "issues" ADD COLUMN "priority" "issue_priority" DEFAULT 'medium' NOT NULL;
--> statement-breakpoint

-- Create index for priority
CREATE INDEX IF NOT EXISTS "issues_priority_idx" ON "issues" USING btree ("priority");
