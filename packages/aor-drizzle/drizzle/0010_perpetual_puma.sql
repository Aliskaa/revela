ALTER TABLE "questionnaire_responses" ADD COLUMN IF NOT EXISTS "rated_participant_id" integer;--> statement-breakpoint

UPDATE "questionnaire_responses"
SET "rated_participant_id" = substring("name" from '^pid:([0-9]+)\|')::integer
WHERE "submission_kind" = 'peer_rating'
  AND "rated_participant_id" IS NULL
  AND "name" ~ '^pid:[0-9]+\|';--> statement-breakpoint

DO $$
BEGIN
  ALTER TABLE "questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_rated_participant_id_participants_id_fk"
    FOREIGN KEY ("rated_participant_id") REFERENCES "public"."participants"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "questionnaire_responses_rated_participant_id_idx"
  ON "questionnaire_responses" USING btree ("rated_participant_id");--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "questionnaire_responses_unique_self_rating"
  ON "questionnaire_responses" USING btree ("campaign_id", "questionnaire_id", "subject_participant_id")
  WHERE "submission_kind" = 'self_rating'
    AND "campaign_id" IS NOT NULL
    AND "subject_participant_id" IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "questionnaire_responses_unique_element_humain"
  ON "questionnaire_responses" USING btree ("campaign_id", "questionnaire_id", "subject_participant_id")
  WHERE "submission_kind" = 'element_humain'
    AND "campaign_id" IS NOT NULL
    AND "subject_participant_id" IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "questionnaire_responses_unique_peer_rating_target"
  ON "questionnaire_responses" USING btree (
    "campaign_id",
    "questionnaire_id",
    "subject_participant_id",
    "rated_participant_id"
  )
  WHERE "submission_kind" = 'peer_rating'
    AND "campaign_id" IS NOT NULL
    AND "subject_participant_id" IS NOT NULL
    AND "rated_participant_id" IS NOT NULL;
