ALTER TABLE "coaches" ADD COLUMN "avatar_data" bytea;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "avatar_mime_type" varchar(64);
