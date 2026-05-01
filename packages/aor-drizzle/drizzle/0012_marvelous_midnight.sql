UPDATE "invite_tokens"
SET "is_active" = false
WHERE "is_active" = true
  AND "used_at" IS NULL
  AND "expires_at" IS NOT NULL
  AND "expires_at" < now();--> statement-breakpoint

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "participant_id", "campaign_id", "questionnaire_id"
      ORDER BY "created_at" DESC NULLS LAST, "id" DESC
    ) AS rn
  FROM "invite_tokens"
  WHERE "is_active" = true
    AND "used_at" IS NULL
    AND "campaign_id" IS NOT NULL
)
UPDATE "invite_tokens"
SET "is_active" = false
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);--> statement-breakpoint

WITH ranked AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "participant_id", "questionnaire_id"
      ORDER BY "created_at" DESC NULLS LAST, "id" DESC
    ) AS rn
  FROM "invite_tokens"
  WHERE "is_active" = true
    AND "used_at" IS NULL
    AND "campaign_id" IS NULL
)
UPDATE "invite_tokens"
SET "is_active" = false
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);--> statement-breakpoint

CREATE UNIQUE INDEX "invite_tokens_active_campaign_assignment_unique" ON "invite_tokens" USING btree ("participant_id","campaign_id","questionnaire_id") WHERE "invite_tokens"."is_active" = true and "invite_tokens"."used_at" is null and "invite_tokens"."campaign_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "invite_tokens_active_standalone_assignment_unique" ON "invite_tokens" USING btree ("participant_id","questionnaire_id") WHERE "invite_tokens"."is_active" = true and "invite_tokens"."used_at" is null and "invite_tokens"."campaign_id" is null;
