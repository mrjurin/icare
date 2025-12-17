-- Create Priority table
CREATE TABLE "priorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "priorities_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Create indexes
CREATE INDEX IF NOT EXISTS "priorities_name_idx" ON "priorities" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "priorities_code_idx" ON "priorities" USING btree ("code");
--> statement-breakpoint

-- Insert default priorities
INSERT INTO "priorities" ("name", "code", "description", "is_active") VALUES 
  ('Low', 'low', 'Low priority issues', true),
  ('Medium', 'medium', 'Medium priority issues', true),
  ('High', 'high', 'High priority issues', true),
  ('Critical', 'critical', 'Critical priority issues', true)
ON CONFLICT ("name") DO NOTHING;
