-- Create enum for membership application status
CREATE TYPE "membership_application_status" AS ENUM('draft', 'submitted', 'zone_reviewed', 'approved', 'rejected');
--> statement-breakpoint

-- Create Membership Applications table
CREATE TABLE IF NOT EXISTS "membership_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"cawangan_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"ic_number" varchar(20) NOT NULL,
	"phone" varchar(20),
	"email" text,
	"address" text,
	"date_of_birth" timestamp,
	"gender" varchar(1),
	"race" text,
	"religion" text,
	"photo_url" text,
	"was_previous_member" boolean DEFAULT false NOT NULL,
	"zone_reviewed_by" integer,
	"zone_reviewed_at" timestamp,
	"zone_supports" boolean,
	"zone_remarks" text,
	"membership_number" varchar(50),
	"approved_by" integer,
	"approved_at" timestamp,
	"status" "membership_application_status" DEFAULT 'draft' NOT NULL,
	"admin_remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for membership_applications
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_cawangan_id_cawangan_id_fk" FOREIGN KEY ("cawangan_id") REFERENCES "public"."cawangan"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_zone_reviewed_by_staff_id_fk" FOREIGN KEY ("zone_reviewed_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_approved_by_staff_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Create indexes for membership_applications
CREATE INDEX IF NOT EXISTS "membership_applications_zone_idx" ON "membership_applications" USING btree ("zone_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_applications_cawangan_idx" ON "membership_applications" USING btree ("cawangan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_applications_status_idx" ON "membership_applications" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_applications_ic_number_idx" ON "membership_applications" USING btree ("ic_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "membership_applications_membership_number_idx" ON "membership_applications" USING btree ("membership_number");
--> statement-breakpoint

-- Create Previous Party Memberships table
CREATE TABLE IF NOT EXISTS "membership_application_previous_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"party_name" text NOT NULL,
	"from_date" timestamp,
	"to_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraint for previous parties
ALTER TABLE "membership_application_previous_parties" ADD CONSTRAINT "membership_application_previous_parties_application_id_membership_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."membership_applications"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Create index for previous parties
CREATE INDEX IF NOT EXISTS "membership_app_prev_parties_application_idx" ON "membership_application_previous_parties" USING btree ("application_id");
--> statement-breakpoint

-- Create Memberships table
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"membership_number" varchar(50) NOT NULL,
	"zone_id" integer NOT NULL,
	"cawangan_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"ic_number" varchar(20) NOT NULL,
	"phone" varchar(20),
	"email" text,
	"address" text,
	"date_of_birth" timestamp,
	"gender" varchar(1),
	"race" text,
	"religion" text,
	"photo_url" text,
	"joined_date" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key constraints for memberships
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_application_id_membership_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."membership_applications"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_cawangan_id_cawangan_id_fk" FOREIGN KEY ("cawangan_id") REFERENCES "public"."cawangan"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_approved_by_staff_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Create unique constraint for membership_number
CREATE UNIQUE INDEX IF NOT EXISTS "memberships_membership_number_unique" ON "memberships" USING btree ("membership_number");
--> statement-breakpoint

-- Create indexes for memberships
CREATE INDEX IF NOT EXISTS "memberships_membership_number_idx" ON "memberships" USING btree ("membership_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_zone_idx" ON "memberships" USING btree ("zone_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_cawangan_idx" ON "memberships" USING btree ("cawangan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_status_idx" ON "memberships" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_ic_number_idx" ON "memberships" USING btree ("ic_number");
