-- Step 1: Create default cawangan for each zone
-- This ensures every zone has at least one cawangan
INSERT INTO "cawangan" ("zone_id", "name", "code", "description")
SELECT 
  id as zone_id,
  name || ' - Default Cawangan' as name,
  code || '-C1' as code,
  'Default cawangan created during migration' as description
FROM "zones"
WHERE NOT EXISTS (
  SELECT 1 FROM "cawangan" WHERE "cawangan"."zone_id" = "zones"."id"
);
--> statement-breakpoint
-- Step 2: Add cawangan_id column to villages table
ALTER TABLE "villages" ADD COLUMN IF NOT EXISTS "cawangan_id" integer;
--> statement-breakpoint
-- Step 3: Link existing villages to default cawangan
UPDATE "villages" v
SET "cawangan_id" = (
  SELECT c.id 
  FROM "cawangan" c 
  WHERE c.zone_id = v.zone_id 
  ORDER BY c.id 
  LIMIT 1
)
WHERE "cawangan_id" IS NULL;
--> statement-breakpoint
-- Step 4: Add foreign key constraint
ALTER TABLE "villages" ADD CONSTRAINT "villages_cawangan_id_cawangan_id_fk" FOREIGN KEY ("cawangan_id") REFERENCES "public"."cawangan"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Step 5: Create index
CREATE INDEX IF NOT EXISTS "villages_cawangan_idx" ON "villages" USING btree ("cawangan_id");
--> statement-breakpoint
-- Step 6: Make cawangan_id NOT NULL (after all villages are linked)
-- Note: This will fail if any villages don't have a cawangan, so we ensure all are linked first
ALTER TABLE "villages" ALTER COLUMN "cawangan_id" SET NOT NULL;
