-- Create backups table
CREATE TABLE "backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text,
	"file_size" integer,
	"backup_type" varchar(20) DEFAULT 'full' NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"created_by" integer REFERENCES "staff"("id") ON DELETE set null,
	"metadata" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
-- Create indexes for backups table
CREATE INDEX IF NOT EXISTS "backups_created_by_idx" ON "backups" USING btree ("created_by");
CREATE INDEX IF NOT EXISTS "backups_status_idx" ON "backups" USING btree ("status");
CREATE INDEX IF NOT EXISTS "backups_created_at_idx" ON "backups" USING btree ("created_at");
