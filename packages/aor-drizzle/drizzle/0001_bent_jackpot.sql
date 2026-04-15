CREATE TYPE "public"."submission_kind" AS ENUM('element_humain', 'self_rating', 'peer_rating');--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "submission_kind" "submission_kind" DEFAULT 'element_humain' NOT NULL;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "subject_participant_id" integer;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "rater_participant_id" integer;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_subject_participant_id_participants_id_fk" FOREIGN KEY ("subject_participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_rater_participant_id_participants_id_fk" FOREIGN KEY ("rater_participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "questionnaire_responses" SET "subject_participant_id" = "participant_id" WHERE "participant_id" IS NOT NULL AND "subject_participant_id" IS NULL;--> statement-breakpoint
UPDATE "questionnaire_responses" SET "rater_participant_id" = "participant_id" WHERE "participant_id" IS NOT NULL AND "rater_participant_id" IS NULL;--> statement-breakpoint
CREATE INDEX "questionnaire_responses_submission_kind_idx" ON "questionnaire_responses" USING btree ("submission_kind");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_subject_participant_id_idx" ON "questionnaire_responses" USING btree ("subject_participant_id");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_rater_participant_id_idx" ON "questionnaire_responses" USING btree ("rater_participant_id");