-- Create audit_logs table for comprehensive audit trail
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"user_id" integer REFERENCES "staff"("id") ON DELETE set null,
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
-- Create indexes for audit_logs table
CREATE INDEX IF NOT EXISTS "audit_logs_event_type_idx" ON "audit_logs" USING btree ("event_type");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_idx" ON "audit_logs" USING btree ("entity_type");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_email_idx" ON "audit_logs" USING btree ("user_email");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_composite_idx" ON "audit_logs" USING btree ("entity_type", "entity_id");
