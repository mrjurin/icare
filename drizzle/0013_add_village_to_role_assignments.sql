-- Add village_id column to role_assignments table for village-level appointments
ALTER TABLE "role_assignments" ADD COLUMN IF NOT EXISTS "village_id" integer;
--> statement-breakpoint
-- Add foreign key constraint for village_id
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Create index for village_id
CREATE INDEX IF NOT EXISTS "role_assignments_village_idx" ON "role_assignments" USING btree ("village_id");
--> statement-breakpoint
-- Update existing roles to use English names
UPDATE "roles" SET "name" = 'Branch Chief' WHERE "name" = 'Ketua Cawangan';
--> statement-breakpoint
UPDATE "roles" SET "name" = 'Village Chief' WHERE "name" = 'Ketua Kampung';
