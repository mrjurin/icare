-- Create issue_types table
CREATE TABLE "issue_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50) UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes
CREATE INDEX "issue_types_name_idx" ON "issue_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "issue_types_code_idx" ON "issue_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "issue_types_is_active_idx" ON "issue_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "issue_types_display_order_idx" ON "issue_types" USING btree ("display_order");--> statement-breakpoint

-- Add issue_type_id column to issues table
ALTER TABLE "issues" ADD COLUMN "issue_type_id" integer;--> statement-breakpoint

-- Add foreign key constraint
ALTER TABLE "issues" ADD CONSTRAINT "issues_issue_type_id_issue_types_id_fk" FOREIGN KEY ("issue_type_id") REFERENCES "public"."issue_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Create index on issue_type_id
CREATE INDEX "issues_issue_type_idx" ON "issues" USING btree ("issue_type_id");--> statement-breakpoint

-- Migrate existing enum values to issue_types table
INSERT INTO "issue_types" ("name", "code", "description", "is_active", "display_order", "created_at", "updated_at")
VALUES
	('Road Maintenance', 'road_maintenance', 'Issues related to road maintenance, potholes, and road conditions', true, 1, now(), now()),
	('Drainage', 'drainage', 'Issues related to drainage systems, clogged drains, and flooding', true, 2, now(), now()),
	('Public Safety', 'public_safety', 'Issues related to public safety, security, and emergency situations', true, 3, now(), now()),
	('Sanitation', 'sanitation', 'Issues related to waste management, cleanliness, and sanitation', true, 4, now(), now()),
	('Other', 'other', 'Other types of issues not covered by the above categories', true, 5, now(), now())
ON CONFLICT DO NOTHING;--> statement-breakpoint

-- Migrate existing issues to use issue_types
-- Map enum values to issue_type_id based on code
UPDATE "issues" i
SET "issue_type_id" = it.id
FROM "issue_types" it
WHERE i.category::text = it.code
AND i.issue_type_id IS NULL;--> statement-breakpoint
