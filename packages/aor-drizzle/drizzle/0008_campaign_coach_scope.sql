CREATE TABLE IF NOT EXISTS "coaches" (
  "id" serial PRIMARY KEY NOT NULL,
  "username" varchar(64) NOT NULL,
  "password" varchar(255) NOT NULL,
  "display_name" varchar(255) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "coaches_username_unique" UNIQUE("username")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coaches_username_idx" ON "coaches" USING btree ("username");--> statement-breakpoint
INSERT INTO "coaches" ("username", "password", "display_name", "is_active", "created_at", "updated_at")
VALUES ('legacy-coach', 'legacy-coach', 'Legacy Coach', true, now(), now())
ON CONFLICT ("username") DO NOTHING;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "coach_id" integer;--> statement-breakpoint
UPDATE "campaigns"
SET "coach_id" = (SELECT "id" FROM "coaches" WHERE "username" = 'legacy-coach' LIMIT 1)
WHERE "coach_id" IS NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ALTER COLUMN "coach_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "campaigns_coach_id_coaches_id_fk";--> statement-breakpoint
ALTER TABLE "campaigns"
  ADD CONSTRAINT "campaigns_coach_id_coaches_id_fk"
  FOREIGN KEY ("coach_id")
  REFERENCES "coaches"("id")
  ON DELETE RESTRICT
  ON UPDATE NO ACTION;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_coach_id_idx" ON "campaigns" USING btree ("coach_id");
