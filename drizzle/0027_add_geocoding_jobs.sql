-- Create enum for geocoding job status
CREATE TYPE "geocoding_job_status" AS ENUM('pending', 'running', 'completed', 'failed');
--> statement-breakpoint
-- Create geocoding_jobs table to track geocoding progress
CREATE TABLE "geocoding_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL REFERENCES "spr_voter_versions"("id") ON DELETE cascade,
	"status" "geocoding_job_status" DEFAULT 'pending' NOT NULL,
	"total_voters" integer DEFAULT 0 NOT NULL,
	"processed_voters" integer DEFAULT 0 NOT NULL,
	"geocoded_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" integer REFERENCES "staff"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for geocoding_jobs
CREATE INDEX IF NOT EXISTS "geocoding_jobs_version_idx" ON "geocoding_jobs" USING btree ("version_id");
CREATE INDEX IF NOT EXISTS "geocoding_jobs_status_idx" ON "geocoding_jobs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "geocoding_jobs_created_at_idx" ON "geocoding_jobs" USING btree ("created_at");
