ALTER TABLE "companies" ADD COLUMN "avatar_data" bytea;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "avatar_mime_type" varchar(64);--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();
