-- Create Gender table
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
-- Create Religion table
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
-- Create Race table
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
-- Create District table
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
-- Create Parliament table
CREATE TABLE "parliaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(20),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parliaments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Create Locality table
CREATE TABLE "localities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50),
	"parliament_id" integer REFERENCES "parliaments"("id") ON DELETE set null,
	"dun_id" integer REFERENCES "duns"("id") ON DELETE set null,
	"district_id" integer REFERENCES "districts"("id") ON DELETE set null,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "localities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
-- Create Polling Station table
CREATE TABLE "polling_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50),
	"locality_id" integer REFERENCES "localities"("id") ON DELETE set null,
	"address" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "polling_stations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
-- Create indexes
CREATE INDEX IF NOT EXISTS "genders_name_idx" ON "genders" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "genders_code_idx" ON "genders" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "religions_name_idx" ON "religions" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "religions_code_idx" ON "religions" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "races_name_idx" ON "races" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "races_code_idx" ON "races" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_name_idx" ON "districts" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "districts_code_idx" ON "districts" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parliaments_name_idx" ON "parliaments" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "parliaments_code_idx" ON "parliaments" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_name_idx" ON "localities" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_code_idx" ON "localities" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_parliament_idx" ON "localities" USING btree ("parliament_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_dun_idx" ON "localities" USING btree ("dun_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "localities_district_idx" ON "localities" USING btree ("district_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "polling_stations_name_idx" ON "polling_stations" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "polling_stations_code_idx" ON "polling_stations" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "polling_stations_locality_idx" ON "polling_stations" USING btree ("locality_id");
--> statement-breakpoint
-- Insert default genders
INSERT INTO "genders" ("name", "code", "description") VALUES 
  ('Lelaki', 'L', 'Male'),
  ('Perempuan', 'P', 'Female')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Insert default religions (common in Malaysia)
INSERT INTO "religions" ("name", "code", "description") VALUES 
  ('Islam', 'ISLAM', 'Islam'),
  ('Buddha', 'BUDDHA', 'Buddhism'),
  ('Kristian', 'KRISTIAN', 'Christianity'),
  ('Hindu', 'HINDU', 'Hinduism'),
  ('Sikh', 'SIKH', 'Sikhism'),
  ('Lain-lain', 'OTHER', 'Other religions')
ON CONFLICT ("name") DO NOTHING;
--> statement-breakpoint
-- Insert default races (common in Malaysia)
INSERT INTO "races" ("name", "code", "description") VALUES 
  ('Melayu', 'MELAYU', 'Malay'),
  ('Cina', 'CINA', 'Chinese'),
  ('India', 'INDIA', 'Indian'),
  ('Kadazan', 'KADAZAN', 'Kadazan'),
  ('Dusun', 'DUSUN', 'Dusun'),
  ('Bajau', 'BAJAU', 'Bajau'),
  ('Murut', 'MURUT', 'Murut'),
  ('Lain-lain', 'OTHER', 'Other races')
ON CONFLICT ("name") DO NOTHING;
