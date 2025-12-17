-- Create Issue Status table
CREATE TABLE "issue_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issue_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Create indexes
CREATE INDEX IF NOT EXISTS "issue_statuses_name_idx" ON "issue_statuses" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_statuses_code_idx" ON "issue_statuses" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_statuses_is_active_idx" ON "issue_statuses" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_statuses_display_order_idx" ON "issue_statuses" USING btree ("display_order");
--> statement-breakpoint

-- Insert default issue statuses
INSERT INTO "issue_statuses" ("name", "code", "description", "is_active", "display_order") VALUES 
  ('Pending', 'pending', 'Issue is pending review', true, 1),
  ('In Progress', 'in_progress', 'Issue is being worked on', true, 2),
  ('Resolved', 'resolved', 'Issue has been resolved', true, 3),
  ('Closed', 'closed', 'Issue has been closed', true, 4)
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint

-- Add issue_status_id column to issues table
ALTER TABLE "issues" ADD COLUMN "issue_status_id" integer;
--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "issues" ADD CONSTRAINT "issues_issue_status_id_issue_statuses_id_fk" FOREIGN KEY ("issue_status_id") REFERENCES "public"."issue_statuses"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Create index on issue_status_id
CREATE INDEX IF NOT EXISTS "issues_issue_status_idx" ON "issues" USING btree ("issue_status_id");
--> statement-breakpoint

-- Migrate existing enum values to issue_statuses table
-- Map enum values to issue_status_id based on code
UPDATE "issues" 
SET "issue_status_id" = (
  SELECT "id" FROM "issue_statuses" 
  WHERE "issue_statuses"."code" = "issues"."status"::text
)
WHERE "issue_status_id" IS NULL;
