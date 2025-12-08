-- Add polling_station_id column to zones table
ALTER TABLE "zones" ADD COLUMN "polling_station_id" integer REFERENCES "polling_stations"("id") ON DELETE set null;
--> statement-breakpoint
-- Create index for polling_station_id
CREATE INDEX IF NOT EXISTS "zones_polling_station_idx" ON "zones" USING btree ("polling_station_id");
