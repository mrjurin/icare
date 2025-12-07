-- Create enums for households
DO $$ BEGIN
 CREATE TYPE "member_relationship" AS ENUM('head', 'spouse', 'child', 'parent', 'sibling', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "member_status" AS ENUM('at_home', 'away', 'deceased');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "dependency_status" AS ENUM('dependent', 'independent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE "households" (
	"id" serial PRIMARY KEY NOT NULL,
	"head_of_household_id" integer,
	"head_name" text NOT NULL,
	"head_ic_number" varchar(20),
	"head_phone" varchar(20),
	"address" text NOT NULL,
	"area" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"name" text NOT NULL,
	"ic_number" varchar(20),
	"relationship" "member_relationship" NOT NULL,
	"date_of_birth" timestamp,
	"status" "member_status" DEFAULT 'at_home' NOT NULL,
	"dependency_status" "dependency_status" DEFAULT 'dependent' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_income" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"monthly_income" double precision,
	"income_source" text,
	"number_of_income_earners" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aid_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"aid_type" varchar(100) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"distributed_to" integer NOT NULL,
	"distributed_by" integer,
	"distribution_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_head_of_household_id_profiles_id_fk" FOREIGN KEY ("head_of_household_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "household_income" ADD CONSTRAINT "household_income_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "aid_distributions" ADD CONSTRAINT "aid_distributions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "aid_distributions" ADD CONSTRAINT "aid_distributions_distributed_by_staff_id_fk" FOREIGN KEY ("distributed_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "households_head_idx" ON "households" USING btree ("head_of_household_id");
--> statement-breakpoint
CREATE INDEX "households_area_idx" ON "households" USING btree ("area");
--> statement-breakpoint
CREATE INDEX "household_members_household_idx" ON "household_members" USING btree ("household_id");
--> statement-breakpoint
CREATE INDEX "household_members_status_idx" ON "household_members" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "household_members_dependency_idx" ON "household_members" USING btree ("dependency_status");
--> statement-breakpoint
CREATE INDEX "household_income_household_idx" ON "household_income" USING btree ("household_id");
--> statement-breakpoint
CREATE INDEX "aid_distributions_household_idx" ON "aid_distributions" USING btree ("household_id");
--> statement-breakpoint
CREATE INDEX "aid_distributions_date_idx" ON "aid_distributions" USING btree ("distribution_date");
--> statement-breakpoint
CREATE INDEX "aid_distributions_type_idx" ON "aid_distributions" USING btree ("aid_type");
