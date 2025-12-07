-- Create app_settings table for storing global application configuration
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
-- Create index on key for faster lookups
CREATE INDEX "app_settings_key_idx" ON "app_settings" USING btree ("key");
--> statement-breakpoint
-- Add foreign key constraint for updated_by
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_staff_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
-- Insert default admin header title setting
INSERT INTO "app_settings" ("key", "value", "description") VALUES ('admin_header_title', 'N.18 Inanam Community Watch', 'The title displayed in the admin header');
--> statement-breakpoint
-- Insert default app name setting
INSERT INTO "app_settings" ("key", "value", "description") VALUES ('app_name', 'Community Watch', 'The application name displayed in the sidebar');
