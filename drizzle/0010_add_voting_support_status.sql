-- Create enum for voting support status
DO $$ BEGIN
 CREATE TYPE "voting_support_status" AS ENUM('white', 'black', 'red');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add voting_support_status column to household_members table
ALTER TABLE "household_members" ADD COLUMN "voting_support_status" "voting_support_status";















