CREATE TYPE "public"."dependency_status" AS ENUM('dependent', 'independent');--> statement-breakpoint
CREATE TYPE "public"."geocoding_job_status" AS ENUM('pending', 'running', 'paused', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."issue_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."member_relationship" AS ENUM('head', 'spouse', 'child', 'parent', 'sibling', 'other');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('at_home', 'away', 'deceased');--> statement-breakpoint
CREATE TYPE "public"."membership_application_status" AS ENUM('draft', 'submitted', 'zone_reviewed', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."profile_verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('adun', 'super_admin', 'zone_leader', 'staff_manager', 'staff');--> statement-breakpoint
CREATE TYPE "public"."staff_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."voting_support_status" AS ENUM('white', 'black', 'red');--> statement-breakpoint
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
CREATE TABLE "aids_program_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"zone_id" integer,
	"village_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "app_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"user_id" integer,
	"user_email" text,
	"user_role" varchar(50),
	"action" text NOT NULL,
	"details" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text,
	"file_size" integer,
	"backup_type" varchar(20) DEFAULT 'full' NOT NULL,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"created_by" integer,
	"metadata" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "block_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"block_id" integer NOT NULL,
	"locale" varchar(10) NOT NULL,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "block_translations_block_locale_unique" UNIQUE("block_id","locale")
);
--> statement-breakpoint
CREATE TABLE "cawangan" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"layout_id" integer NOT NULL,
	"block_type" varchar(50) NOT NULL,
	"block_key" varchar(100) NOT NULL,
	"display_order" integer NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"configuration" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_blocks_layout_key_unique" UNIQUE("layout_id","block_key")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "districts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "duns" (
	"id" serial PRIMARY KEY NOT NULL,
	"parliament_id" integer,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(10),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "genders_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "geocoding_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"status" "geocoding_job_status" DEFAULT 'pending' NOT NULL,
	"total_voters" integer DEFAULT 0 NOT NULL,
	"processed_voters" integer DEFAULT 0 NOT NULL,
	"geocoded_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" integer,
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
CREATE TABLE "household_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"household_id" integer NOT NULL,
	"name" text NOT NULL,
	"ic_number" varchar(20),
	"phone" varchar(20),
	"relationship" "member_relationship" NOT NULL,
	"date_of_birth" timestamp,
	"locality" text,
	"status" "member_status" DEFAULT 'at_home' NOT NULL,
	"dependency_status" "dependency_status" DEFAULT 'dependent' NOT NULL,
	"voting_support_status" "voting_support_status",
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" serial PRIMARY KEY NOT NULL,
	"head_of_household_id" integer,
	"head_name" text NOT NULL,
	"head_ic_number" varchar(20),
	"head_phone" varchar(20),
	"address" text NOT NULL,
	"zone_id" integer,
	"area" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issue_statuses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "issue_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "issue_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50),
	"parliament_id" integer,
	"dun_id" integer,
	"district_id" integer,
	"description" text,
	"lat" double precision,
	"lng" double precision,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "localities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "locality_geocoding_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "geocoding_job_status" DEFAULT 'pending' NOT NULL,
	"total_localities" integer DEFAULT 0 NOT NULL,
	"processed_localities" integer DEFAULT 0 NOT NULL,
	"geocoded_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_application_previous_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"party_name" text NOT NULL,
	"from_date" timestamp,
	"to_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_application_spr_voters" (
	"id" serial PRIMARY KEY NOT NULL,
	"membership_application_id" integer NOT NULL,
	"spr_voter_id" integer NOT NULL,
	"linked_by" integer,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	"is_auto_linked" boolean DEFAULT false NOT NULL,
	"notes" text,
	CONSTRAINT "membership_application_spr_voters_unique" UNIQUE("membership_application_id","spr_voter_id")
);
--> statement-breakpoint
CREATE TABLE "membership_applications" (
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
CREATE TABLE "memberships" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_membership_number_unique" UNIQUE("membership_number")
);
--> statement-breakpoint
CREATE TABLE "page_layouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"page_type" varchar(50) NOT NULL,
	"route" varchar(200) NOT NULL,
	"title" varchar(200),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_page_route" UNIQUE("route")
);
--> statement-breakpoint
CREATE TABLE "page_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"layout_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "page_versions_layout_version_unique" UNIQUE("layout_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "parliament_geocoding_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" "geocoding_job_status" DEFAULT 'pending' NOT NULL,
	"total_parliaments" integer DEFAULT 0 NOT NULL,
	"processed_parliaments" integer DEFAULT 0 NOT NULL,
	"geocoded_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parliaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"lat" double precision,
	"lng" double precision,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parliaments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polling_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50),
	"locality_id" integer,
	"address" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "polling_stations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "priorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "priorities_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "races_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "religions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "religions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"village_id" integer,
	"appointed_by" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"appointed_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"responsibilities" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spr_voter_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"election_date" timestamp,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spr_voters" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL,
	"no_siri" integer,
	"no_kp" varchar(20),
	"no_kp_lama" varchar(20),
	"nama" text NOT NULL,
	"no_hp" varchar(20),
	"jantina" varchar(1),
	"tarikh_lahir" timestamp,
	"bangsa" text,
	"agama" text,
	"kategori_kaum" text,
	"no_rumah" text,
	"alamat" text,
	"poskod" varchar(10),
	"daerah" text,
	"kod_lokaliti" varchar(50),
	"nama_parlimen" text,
	"nama_dun" text,
	"nama_pdm" text,
	"nama_lokaliti" text,
	"kategori_undi" text,
	"nama_tm" text,
	"masa_undi" text,
	"saluran" integer,
	"household_member_id" integer,
	"voting_support_status" "voting_support_status",
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"ic_number" varchar(20),
	"phone" varchar(20),
	"role" "staff_role" DEFAULT 'staff' NOT NULL,
	"position" text,
	"zone_id" integer,
	"status" "staff_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" serial PRIMARY KEY NOT NULL,
	"cawangan_id" integer NOT NULL,
	"zone_id" integer,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"dun_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"polling_station_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue_assignments" RENAME COLUMN "assignee_id" TO "staff_id";--> statement-breakpoint
ALTER TABLE "issue_assignments" DROP CONSTRAINT "issue_assignments_assignee_id_profiles_id_fk";
--> statement-breakpoint
DROP INDEX "issue_assignments_assignee_idx";--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "issue_type_id" integer;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "issue_status_id" integer;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "priority" "issue_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "locality_id" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ic_number" varchar(20);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "village_id" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "zone_id" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "household_member_id" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "spr_voter_id" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verification_status" "profile_verification_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verified_by" integer;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verification_remarks" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "aid_distributions" ADD CONSTRAINT "aid_distributions_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aid_distributions" ADD CONSTRAINT "aid_distributions_distributed_by_staff_id_fk" FOREIGN KEY ("distributed_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_distribution_records" ADD CONSTRAINT "aids_distribution_records_program_id_aids_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."aids_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_distribution_records" ADD CONSTRAINT "aids_distribution_records_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_distribution_records" ADD CONSTRAINT "aids_distribution_records_marked_by_staff_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_program_id_aids_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."aids_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_assigned_to_staff_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_assignments" ADD CONSTRAINT "aids_program_assignments_assigned_by_staff_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_zones" ADD CONSTRAINT "aids_program_zones_program_id_aids_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."aids_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_zones" ADD CONSTRAINT "aids_program_zones_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_program_zones" ADD CONSTRAINT "aids_program_zones_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aids_programs" ADD CONSTRAINT "aids_programs_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_staff_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backups" ADD CONSTRAINT "backups_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_translations" ADD CONSTRAINT "block_translations_block_id_content_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."content_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cawangan" ADD CONSTRAINT "cawangan_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_layout_id_page_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."page_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duns" ADD CONSTRAINT "duns_parliament_id_parliaments_id_fk" FOREIGN KEY ("parliament_id") REFERENCES "public"."parliaments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geocoding_jobs" ADD CONSTRAINT "geocoding_jobs_version_id_spr_voter_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."spr_voter_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geocoding_jobs" ADD CONSTRAINT "geocoding_jobs_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_income" ADD CONSTRAINT "household_income_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_head_of_household_id_profiles_id_fk" FOREIGN KEY ("head_of_household_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_parliament_id_parliaments_id_fk" FOREIGN KEY ("parliament_id") REFERENCES "public"."parliaments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_dun_id_duns_id_fk" FOREIGN KEY ("dun_id") REFERENCES "public"."duns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localities" ADD CONSTRAINT "localities_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locality_geocoding_jobs" ADD CONSTRAINT "locality_geocoding_jobs_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_application_previous_parties" ADD CONSTRAINT "membership_application_previous_parties_application_id_membership_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."membership_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_application_spr_voters" ADD CONSTRAINT "membership_application_spr_voters_membership_application_id_membership_applications_id_fk" FOREIGN KEY ("membership_application_id") REFERENCES "public"."membership_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_application_spr_voters" ADD CONSTRAINT "membership_application_spr_voters_spr_voter_id_spr_voters_id_fk" FOREIGN KEY ("spr_voter_id") REFERENCES "public"."spr_voters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_application_spr_voters" ADD CONSTRAINT "membership_application_spr_voters_linked_by_staff_id_fk" FOREIGN KEY ("linked_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_cawangan_id_cawangan_id_fk" FOREIGN KEY ("cawangan_id") REFERENCES "public"."cawangan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_zone_reviewed_by_staff_id_fk" FOREIGN KEY ("zone_reviewed_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_applications" ADD CONSTRAINT "membership_applications_approved_by_staff_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_application_id_membership_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."membership_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_cawangan_id_cawangan_id_fk" FOREIGN KEY ("cawangan_id") REFERENCES "public"."cawangan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_approved_by_staff_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_layouts" ADD CONSTRAINT "page_layouts_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_layout_id_page_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."page_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parliament_geocoding_jobs" ADD CONSTRAINT "parliament_geocoding_jobs_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polling_stations" ADD CONSTRAINT "polling_stations_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_appointed_by_staff_id_fk" FOREIGN KEY ("appointed_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spr_voter_versions" ADD CONSTRAINT "spr_voter_versions_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spr_voters" ADD CONSTRAINT "spr_voters_version_id_spr_voter_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."spr_voter_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spr_voters" ADD CONSTRAINT "spr_voters_household_member_id_household_members_id_fk" FOREIGN KEY ("household_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_granted_by_staff_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_cawangan_id_cawangan_id_fk" FOREIGN KEY ("cawangan_id") REFERENCES "public"."cawangan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_dun_id_duns_id_fk" FOREIGN KEY ("dun_id") REFERENCES "public"."duns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_polling_station_id_polling_stations_id_fk" FOREIGN KEY ("polling_station_id") REFERENCES "public"."polling_stations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aid_distributions_household_idx" ON "aid_distributions" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "aid_distributions_date_idx" ON "aid_distributions" USING btree ("distribution_date");--> statement-breakpoint
CREATE INDEX "aid_distributions_type_idx" ON "aid_distributions" USING btree ("aid_type");--> statement-breakpoint
CREATE INDEX "aids_distribution_records_program_idx" ON "aids_distribution_records" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "aids_distribution_records_household_idx" ON "aids_distribution_records" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "aids_distribution_records_marked_by_idx" ON "aids_distribution_records" USING btree ("marked_by");--> statement-breakpoint
CREATE INDEX "aids_distribution_records_program_household_idx" ON "aids_distribution_records" USING btree ("program_id","household_id");--> statement-breakpoint
CREATE INDEX "aids_program_assignments_program_idx" ON "aids_program_assignments" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "aids_program_assignments_zone_idx" ON "aids_program_assignments" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "aids_program_assignments_assigned_to_idx" ON "aids_program_assignments" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "aids_program_assignments_status_idx" ON "aids_program_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aids_program_zones_program_idx" ON "aids_program_zones" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "aids_program_zones_zone_idx" ON "aids_program_zones" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "aids_program_zones_village_idx" ON "aids_program_zones" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "aids_programs_status_idx" ON "aids_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "aids_programs_created_by_idx" ON "aids_programs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "aids_programs_created_at_idx" ON "aids_programs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "app_settings_key_idx" ON "app_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_email_idx" ON "audit_logs" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_composite_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "backups_created_by_idx" ON "backups" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "backups_status_idx" ON "backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "backups_created_at_idx" ON "backups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "block_translations_block_idx" ON "block_translations" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "block_translations_locale_idx" ON "block_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "cawangan_zone_idx" ON "cawangan" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "cawangan_name_idx" ON "cawangan" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cawangan_code_idx" ON "cawangan" USING btree ("code");--> statement-breakpoint
CREATE INDEX "content_blocks_layout_idx" ON "content_blocks" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "content_blocks_block_type_idx" ON "content_blocks" USING btree ("block_type");--> statement-breakpoint
CREATE INDEX "content_blocks_display_order_idx" ON "content_blocks" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "content_blocks_is_visible_idx" ON "content_blocks" USING btree ("is_visible");--> statement-breakpoint
CREATE INDEX "districts_name_idx" ON "districts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "districts_code_idx" ON "districts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "duns_name_idx" ON "duns" USING btree ("name");--> statement-breakpoint
CREATE INDEX "duns_code_idx" ON "duns" USING btree ("code");--> statement-breakpoint
CREATE INDEX "duns_parliament_idx" ON "duns" USING btree ("parliament_id");--> statement-breakpoint
CREATE INDEX "genders_name_idx" ON "genders" USING btree ("name");--> statement-breakpoint
CREATE INDEX "genders_code_idx" ON "genders" USING btree ("code");--> statement-breakpoint
CREATE INDEX "geocoding_jobs_version_idx" ON "geocoding_jobs" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "geocoding_jobs_status_idx" ON "geocoding_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "geocoding_jobs_created_at_idx" ON "geocoding_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "household_income_household_idx" ON "household_income" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_members_household_idx" ON "household_members" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "household_members_status_idx" ON "household_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "household_members_dependency_idx" ON "household_members" USING btree ("dependency_status");--> statement-breakpoint
CREATE INDEX "household_members_locality_idx" ON "household_members" USING btree ("locality");--> statement-breakpoint
CREATE INDEX "households_head_idx" ON "households" USING btree ("head_of_household_id");--> statement-breakpoint
CREATE INDEX "households_zone_idx" ON "households" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "households_area_idx" ON "households" USING btree ("area");--> statement-breakpoint
CREATE INDEX "issue_statuses_name_idx" ON "issue_statuses" USING btree ("name");--> statement-breakpoint
CREATE INDEX "issue_statuses_code_idx" ON "issue_statuses" USING btree ("code");--> statement-breakpoint
CREATE INDEX "issue_statuses_is_active_idx" ON "issue_statuses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "issue_statuses_display_order_idx" ON "issue_statuses" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "issue_types_name_idx" ON "issue_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "issue_types_code_idx" ON "issue_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "issue_types_is_active_idx" ON "issue_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "issue_types_display_order_idx" ON "issue_types" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "localities_name_idx" ON "localities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "localities_code_idx" ON "localities" USING btree ("code");--> statement-breakpoint
CREATE INDEX "localities_parliament_idx" ON "localities" USING btree ("parliament_id");--> statement-breakpoint
CREATE INDEX "localities_dun_idx" ON "localities" USING btree ("dun_id");--> statement-breakpoint
CREATE INDEX "localities_district_idx" ON "localities" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "localities_lat_idx" ON "localities" USING btree ("lat");--> statement-breakpoint
CREATE INDEX "localities_lng_idx" ON "localities" USING btree ("lng");--> statement-breakpoint
CREATE INDEX "locality_geocoding_jobs_status_idx" ON "locality_geocoding_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "locality_geocoding_jobs_created_at_idx" ON "locality_geocoding_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "membership_app_prev_parties_application_idx" ON "membership_application_previous_parties" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "membership_application_spr_voters_application_idx" ON "membership_application_spr_voters" USING btree ("membership_application_id");--> statement-breakpoint
CREATE INDEX "membership_application_spr_voters_spr_voter_idx" ON "membership_application_spr_voters" USING btree ("spr_voter_id");--> statement-breakpoint
CREATE INDEX "membership_application_spr_voters_linked_by_idx" ON "membership_application_spr_voters" USING btree ("linked_by");--> statement-breakpoint
CREATE INDEX "membership_applications_zone_idx" ON "membership_applications" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "membership_applications_cawangan_idx" ON "membership_applications" USING btree ("cawangan_id");--> statement-breakpoint
CREATE INDEX "membership_applications_status_idx" ON "membership_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "membership_applications_ic_number_idx" ON "membership_applications" USING btree ("ic_number");--> statement-breakpoint
CREATE INDEX "membership_applications_membership_number_idx" ON "membership_applications" USING btree ("membership_number");--> statement-breakpoint
CREATE INDEX "memberships_membership_number_idx" ON "memberships" USING btree ("membership_number");--> statement-breakpoint
CREATE INDEX "memberships_zone_idx" ON "memberships" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "memberships_cawangan_idx" ON "memberships" USING btree ("cawangan_id");--> statement-breakpoint
CREATE INDEX "memberships_status_idx" ON "memberships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "memberships_ic_number_idx" ON "memberships" USING btree ("ic_number");--> statement-breakpoint
CREATE INDEX "page_layouts_page_type_idx" ON "page_layouts" USING btree ("page_type");--> statement-breakpoint
CREATE INDEX "page_layouts_route_idx" ON "page_layouts" USING btree ("route");--> statement-breakpoint
CREATE INDEX "page_layouts_is_active_idx" ON "page_layouts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "page_layouts_is_published_idx" ON "page_layouts" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "page_layouts_created_by_idx" ON "page_layouts" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "page_versions_layout_idx" ON "page_versions" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "page_versions_version_number_idx" ON "page_versions" USING btree ("version_number");--> statement-breakpoint
CREATE INDEX "page_versions_created_by_idx" ON "page_versions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "page_versions_is_published_idx" ON "page_versions" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "page_versions_created_at_idx" ON "page_versions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "parliament_geocoding_jobs_status_idx" ON "parliament_geocoding_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "parliament_geocoding_jobs_created_at_idx" ON "parliament_geocoding_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "parliaments_name_idx" ON "parliaments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "parliaments_code_idx" ON "parliaments" USING btree ("code");--> statement-breakpoint
CREATE INDEX "parliaments_lat_idx" ON "parliaments" USING btree ("lat");--> statement-breakpoint
CREATE INDEX "parliaments_lng_idx" ON "parliaments" USING btree ("lng");--> statement-breakpoint
CREATE INDEX "permissions_code_idx" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "permissions_category_idx" ON "permissions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "polling_stations_name_idx" ON "polling_stations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "polling_stations_code_idx" ON "polling_stations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "polling_stations_locality_idx" ON "polling_stations" USING btree ("locality_id");--> statement-breakpoint
CREATE INDEX "priorities_name_idx" ON "priorities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "priorities_code_idx" ON "priorities" USING btree ("code");--> statement-breakpoint
CREATE INDEX "races_name_idx" ON "races" USING btree ("name");--> statement-breakpoint
CREATE INDEX "races_code_idx" ON "races" USING btree ("code");--> statement-breakpoint
CREATE INDEX "religions_name_idx" ON "religions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "religions_code_idx" ON "religions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "role_assignments_staff_idx" ON "role_assignments" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "role_assignments_role_idx" ON "role_assignments" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_assignments_zone_idx" ON "role_assignments" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "role_assignments_village_idx" ON "role_assignments" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "role_assignments_appointed_by_idx" ON "role_assignments" USING btree ("appointed_by");--> statement-breakpoint
CREATE INDEX "role_assignments_status_idx" ON "role_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "spr_voter_versions_name_idx" ON "spr_voter_versions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "spr_voter_versions_is_active_idx" ON "spr_voter_versions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "spr_voters_version_idx" ON "spr_voters" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "spr_voters_no_kp_idx" ON "spr_voters" USING btree ("no_kp");--> statement-breakpoint
CREATE INDEX "spr_voters_nama_idx" ON "spr_voters" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "spr_voters_kod_lokaliti_idx" ON "spr_voters" USING btree ("kod_lokaliti");--> statement-breakpoint
CREATE INDEX "spr_voters_household_member_idx" ON "spr_voters" USING btree ("household_member_id");--> statement-breakpoint
CREATE INDEX "spr_voters_voting_support_status_idx" ON "spr_voters" USING btree ("voting_support_status");--> statement-breakpoint
CREATE INDEX "spr_voters_location_idx" ON "spr_voters" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX "staff_role_idx" ON "staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_status_idx" ON "staff" USING btree ("status");--> statement-breakpoint
CREATE INDEX "staff_email_idx" ON "staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "staff_ic_number_idx" ON "staff" USING btree ("ic_number");--> statement-breakpoint
CREATE INDEX "staff_zone_idx" ON "staff" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "staff_permissions_staff_idx" ON "staff_permissions" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "staff_permissions_permission_idx" ON "staff_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "staff_permissions_granted_by_idx" ON "staff_permissions" USING btree ("granted_by");--> statement-breakpoint
CREATE INDEX "villages_name_idx" ON "villages" USING btree ("name");--> statement-breakpoint
CREATE INDEX "villages_cawangan_idx" ON "villages" USING btree ("cawangan_id");--> statement-breakpoint
CREATE INDEX "villages_zone_idx" ON "villages" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "zones_name_idx" ON "zones" USING btree ("name");--> statement-breakpoint
CREATE INDEX "zones_dun_idx" ON "zones" USING btree ("dun_id");--> statement-breakpoint
CREATE INDEX "zones_polling_station_idx" ON "zones" USING btree ("polling_station_id");--> statement-breakpoint
ALTER TABLE "issue_assignments" ADD CONSTRAINT "issue_assignments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_issue_type_id_issue_types_id_fk" FOREIGN KEY ("issue_type_id") REFERENCES "public"."issue_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_issue_status_id_issue_statuses_id_fk" FOREIGN KEY ("issue_status_id") REFERENCES "public"."issue_statuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_locality_id_localities_id_fk" FOREIGN KEY ("locality_id") REFERENCES "public"."localities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_household_member_id_household_members_id_fk" FOREIGN KEY ("household_member_id") REFERENCES "public"."household_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_spr_voter_id_spr_voters_id_fk" FOREIGN KEY ("spr_voter_id") REFERENCES "public"."spr_voters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_verified_by_staff_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_assignments_staff_idx" ON "issue_assignments" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "issues_issue_status_idx" ON "issues" USING btree ("issue_status_id");--> statement-breakpoint
CREATE INDEX "issues_priority_idx" ON "issues" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "issues_issue_type_idx" ON "issues" USING btree ("issue_type_id");--> statement-breakpoint
CREATE INDEX "issues_locality_idx" ON "issues" USING btree ("locality_id");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "profiles_ic_number_idx" ON "profiles" USING btree ("ic_number");--> statement-breakpoint
CREATE INDEX "profiles_village_idx" ON "profiles" USING btree ("village_id");--> statement-breakpoint
CREATE INDEX "profiles_zone_idx" ON "profiles" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "profiles_verification_status_idx" ON "profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "profiles_household_member_idx" ON "profiles" USING btree ("household_member_id");--> statement-breakpoint
CREATE INDEX "profiles_spr_voter_idx" ON "profiles" USING btree ("spr_voter_id");