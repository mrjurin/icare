-- Create AIDS Programs table
CREATE TABLE "aids_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"aid_type" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" integer NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for aids_programs
CREATE INDEX "aids_programs_status_idx" ON "aids_programs" USING btree ("status");
CREATE INDEX "aids_programs_created_by_idx" ON "aids_programs" USING btree ("created_by");
CREATE INDEX "aids_programs_created_at_idx" ON "aids_programs" USING btree ("created_at");
--> statement-breakpoint
-- Add foreign key constraint for created_by
ALTER TABLE "aids_programs" ADD CONSTRAINT "aids_programs_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create AIDS Program Zones/Villages table
CREATE TABLE "aids_program_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"zone_id" integer,
	"village_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for aids_program_zones
CREATE INDEX "aids_program_zones_program_idx" ON "aids_program_zones" USING btree ("program_id");
CREATE INDEX "aids_program_zones_zone_idx" ON "aids_program_zones" USING btree ("zone_id");
CREATE INDEX "aids_program_zones_village_idx" ON "aids_program_zones" USING btree ("village_id");
--> statement-breakpoint
-- Add foreign key constraints for aids_program_zones
ALTER TABLE "aids_program_zones" ADD CONSTRAINT "aids_program_zones_program_id_aids_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."aids_programs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_program_zones" ADD CONSTRAINT "aids_program_zones_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_program_zones" ADD CONSTRAINT "aids_program_zones_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Create AIDS Program Assignments table
CREATE TABLE "aids_program_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"assigned_to" integer NOT NULL,
	"assigned_by" integer,
	"assignment_type" varchar(20) DEFAULT 'zone_leader' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for aids_program_assignments
CREATE INDEX "aids_program_assignments_program_idx" ON "aids_program_assignments" USING btree ("program_id");
CREATE INDEX "aids_program_assignments_zone_idx" ON "aids_program_assignments" USING btree ("zone_id");
CREATE INDEX "aids_program_assignments_assigned_to_idx" ON "aids_program_assignments" USING btree ("assigned_to");
CREATE INDEX "aids_program_assignments_status_idx" ON "aids_program_assignments" USING btree ("status");
--> statement-breakpoint
-- Add foreign key constraints for aids_program_assignments
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_program_id_aids_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."aids_programs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_assigned_by_staff_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create AIDS Distribution Records table
CREATE TABLE "aids_distribution_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"household_id" integer NOT NULL,
	"marked_by" integer NOT NULL,
	"marked_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for aids_distribution_records
CREATE INDEX "aids_distribution_records_program_idx" ON "aids_distribution_records" USING btree ("program_id");
CREATE INDEX "aids_distribution_records_household_idx" ON "aids_distribution_records" USING btree ("household_id");
CREATE INDEX "aids_distribution_records_marked_by_idx" ON "aids_distribution_records" USING btree ("marked_by");
CREATE INDEX "aids_distribution_records_program_household_idx" ON "aids_distribution_records" USING btree ("program_id", "household_id");
--> statement-breakpoint
-- Add foreign key constraints for aids_distribution_records
ALTER TABLE "aids_distribution_records" ADD CONSTRAINT "aids_distribution_records_program_id_aids_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."aids_programs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_distribution_records" ADD CONSTRAINT "aids_distribution_records_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "aids_distribution_records" ADD CONSTRAINT "aids_distribution_records_marked_by_staff_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Create unique constraint to prevent duplicate distribution records
CREATE UNIQUE INDEX "aids_distribution_records_program_household_unique" ON "aids_distribution_records" USING btree ("program_id", "household_id");
