-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"responsibilities" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create role_assignments table
CREATE TABLE IF NOT EXISTS "role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"appointed_by" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"appointed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add foreign key constraints
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_appointed_by_staff_id_fk" FOREIGN KEY ("appointed_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "roles_name_idx" ON "roles" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_assignments_staff_idx" ON "role_assignments" USING btree ("staff_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_assignments_role_idx" ON "role_assignments" USING btree ("role_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_assignments_zone_idx" ON "role_assignments" USING btree ("zone_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_assignments_appointed_by_idx" ON "role_assignments" USING btree ("appointed_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "role_assignments_status_idx" ON "role_assignments" USING btree ("status");
--> statement-breakpoint
-- Seed initial roles (using English names)
INSERT INTO "roles" ("name", "description", "responsibilities")
VALUES 
  ('Branch Chief', 'Branch Chief', 'Responsible for matters of aids and registering households. Can manage multiple villages.'),
  ('Village Chief', 'Village Chief', 'Handling matters like Divorce, Conflict, and other community issues. One per village.')
ON CONFLICT DO NOTHING;
