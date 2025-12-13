-- Create villages table
CREATE TABLE IF NOT EXISTS "villages" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add foreign key constraint
ALTER TABLE "villages" ADD CONSTRAINT "villages_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "villages_name_idx" ON "villages" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "villages_zone_idx" ON "villages" USING btree ("zone_id");











