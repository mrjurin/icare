-- Add super_admin and zone_leader to staff_role enum
DO $$ BEGIN
 ALTER TYPE "staff_role" ADD VALUE IF NOT EXISTS 'super_admin';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TYPE "staff_role" ADD VALUE IF NOT EXISTS 'zone_leader';
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Create DUNs table
CREATE TABLE IF NOT EXISTS "duns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add dun_id to zones table
ALTER TABLE "zones" ADD COLUMN IF NOT EXISTS "dun_id" integer;
--> statement-breakpoint
-- Add zone_id to staff table for zone leaders
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "zone_id" integer;
--> statement-breakpoint
-- Add foreign key constraints
ALTER TABLE "zones" ADD CONSTRAINT "zones_dun_id_duns_id_fk" FOREIGN KEY ("dun_id") REFERENCES "public"."duns"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "duns_name_idx" ON "duns" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "duns_code_idx" ON "duns" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "zones_dun_idx" ON "zones" USING btree ("dun_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_zone_idx" ON "staff" USING btree ("zone_id");
--> statement-breakpoint
-- Set a default DUN for existing zones (if any exist)
-- This ensures existing zones have a DUN assigned
DO $$
DECLARE
  default_dun_id integer;
BEGIN
  -- Create a default DUN if none exists
  INSERT INTO "duns" ("name", "code", "description")
  VALUES ('N.18 Inanam', 'N18', 'Default DUN for existing zones')
  ON CONFLICT DO NOTHING
  RETURNING id INTO default_dun_id;
  
  -- If no default DUN was created, get the first one
  IF default_dun_id IS NULL THEN
    SELECT id INTO default_dun_id FROM "duns" LIMIT 1;
  END IF;
  
  -- Update all zones without a dun_id to use the default
  IF default_dun_id IS NOT NULL THEN
    UPDATE "zones" SET "dun_id" = default_dun_id WHERE "dun_id" IS NULL;
  END IF;
END $$;
--> statement-breakpoint
-- Make dun_id NOT NULL after setting defaults
ALTER TABLE "zones" ALTER COLUMN "dun_id" SET NOT NULL;















