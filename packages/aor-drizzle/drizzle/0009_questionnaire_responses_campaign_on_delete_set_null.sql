ALTER TABLE "questionnaire_responses" DROP CONSTRAINT IF EXISTS "questionnaire_responses_campaign_id_campaigns_id_fk";--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
