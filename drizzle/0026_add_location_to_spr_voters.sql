-- Add latitude and longitude fields to spr_voters table for geocoding
ALTER TABLE "spr_voters" ADD COLUMN "lat" double precision;
ALTER TABLE "spr_voters" ADD COLUMN "lng" double precision;
--> statement-breakpoint
-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS "spr_voters_location_idx" ON "spr_voters" USING btree ("lat", "lng") WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL;
