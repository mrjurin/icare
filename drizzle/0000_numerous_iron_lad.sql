CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
