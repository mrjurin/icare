-- Create SPR voter versions table to track different election rounds
CREATE TABLE "spr_voter_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"election_date" timestamp,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by" integer REFERENCES "staff"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create SPR voters table
CREATE TABLE "spr_voters" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" integer NOT NULL REFERENCES "spr_voter_versions"("id") ON DELETE cascade,
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
	"household_member_id" integer REFERENCES "household_members"("id") ON DELETE set null,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "spr_voter_versions_name_idx" ON "spr_voter_versions" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spr_voter_versions_is_active_idx" ON "spr_voter_versions" USING btree ("is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spr_voters_version_idx" ON "spr_voters" USING btree ("version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spr_voters_no_kp_idx" ON "spr_voters" USING btree ("no_kp");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spr_voters_nama_idx" ON "spr_voters" USING btree ("nama");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spr_voters_kod_lokaliti_idx" ON "spr_voters" USING btree ("kod_lokaliti");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spr_voters_household_member_idx" ON "spr_voters" USING btree ("household_member_id");
--> statement-breakpoint
-- Create unique constraint to prevent duplicate voters in same version
CREATE UNIQUE INDEX IF NOT EXISTS "spr_voters_version_no_kp_unique" ON "spr_voters" ("version_id", "no_kp") WHERE "no_kp" IS NOT NULL;
