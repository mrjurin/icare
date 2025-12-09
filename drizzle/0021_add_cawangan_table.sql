-- Create Cawangan table
CREATE TABLE IF NOT EXISTS "cawangan" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add foreign key constraint
ALTER TABLE "cawangan" ADD CONSTRAINT "cawangan_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "cawangan_zone_idx" ON "cawangan" USING btree ("zone_id");
CREATE INDEX IF NOT EXISTS "cawangan_name_idx" ON "cawangan" USING btree ("name");
CREATE INDEX IF NOT EXISTS "cawangan_code_idx" ON "cawangan" USING btree ("code");
