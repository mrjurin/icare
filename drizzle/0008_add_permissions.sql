-- Create permissions table
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create staff_permissions table
CREATE TABLE IF NOT EXISTS "staff_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add foreign key constraints
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_granted_by_staff_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "permissions_code_idx" ON "permissions" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "permissions_category_idx" ON "permissions" USING btree ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_permissions_staff_idx" ON "staff_permissions" USING btree ("staff_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_permissions_permission_idx" ON "staff_permissions" USING btree ("permission_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_permissions_granted_by_idx" ON "staff_permissions" USING btree ("granted_by");
--> statement-breakpoint
-- Insert default permissions
INSERT INTO "permissions" ("code", "name", "description", "category") VALUES
	('register_household', 'Register Household', 'Allows staff to register new households in their assigned zones', 'households'),
	('update_household', 'Update Household', 'Allows staff to update household information', 'households'),
	('delete_household', 'Delete Household', 'Allows staff to delete households', 'households'),
	('manage_staff', 'Manage Staff', 'Allows staff to create, update, and delete staff members', 'staff'),
	('manage_zones', 'Manage Zones', 'Allows staff to create, update, and delete zones', 'zones'),
	('manage_roles', 'Manage Roles', 'Allows staff to create, update, and delete organizational roles', 'roles'),
	('assign_roles', 'Assign Roles', 'Allows staff to assign organizational roles to other staff', 'roles'),
	('manage_permissions', 'Manage Permissions', 'Allows staff to grant and revoke permissions', 'permissions'),
	('distribute_aid', 'Distribute Aid', 'Allows staff to record aid distributions', 'households'),
	('view_all_zones', 'View All Zones', 'Allows staff to view all zones regardless of assignment', 'zones');
