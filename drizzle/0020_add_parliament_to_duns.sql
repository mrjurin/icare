-- Add parliament_id to duns table
ALTER TABLE "duns" ADD COLUMN IF NOT EXISTS "parliament_id" integer;
--> statement-breakpoint
-- Add foreign key constraint
ALTER TABLE "duns" ADD CONSTRAINT "duns_parliament_id_parliaments_id_fk" FOREIGN KEY ("parliament_id") REFERENCES "public"."parliaments"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create index for performance
CREATE INDEX IF NOT EXISTS "duns_parliament_idx" ON "duns" USING btree ("parliament_id");
