-- Add latitude and longitude fields to localities table for geocoding
ALTER TABLE "localities" ADD COLUMN IF NOT EXISTS "lat" double precision;
ALTER TABLE "localities" ADD COLUMN IF NOT EXISTS "lng" double precision;

-- Create indexes for location queries
CREATE INDEX IF NOT EXISTS "localities_lat_idx" ON "localities" USING btree ("lat");
CREATE INDEX IF NOT EXISTS "localities_lng_idx" ON "localities" USING btree ("lng");
