ALTER TABLE "participants" DROP COLUMN IF EXISTS "avatar_url";--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "avatar_data" bytea;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "avatar_mime_type" varchar(64);
