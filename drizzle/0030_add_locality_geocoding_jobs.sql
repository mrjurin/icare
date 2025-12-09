-- Create locality_geocoding_jobs table to track geocoding progress for localities
CREATE TABLE "locality_geocoding_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "geocoding_job_status" DEFAULT 'pending' NOT NULL,
	"total_localities" integer DEFAULT 0 NOT NULL,
	"processed_localities" integer DEFAULT 0 NOT NULL,
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
-- Create indexes for locality_geocoding_jobs
CREATE INDEX IF NOT EXISTS "locality_geocoding_jobs_status_idx" ON "locality_geocoding_jobs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "locality_geocoding_jobs_created_at_idx" ON "locality_geocoding_jobs" USING btree ("created_at");
