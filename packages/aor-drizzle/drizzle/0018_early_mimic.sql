CREATE TABLE "element_b_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"questionnaire_id" varchar(4) NOT NULL,
	"series0" jsonb,
	"series1" jsonb,
	"last_saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "element_b_drafts" ADD CONSTRAINT "element_b_drafts_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_b_drafts" ADD CONSTRAINT "element_b_drafts_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "element_b_drafts_unique_per_participant_campaign_questionnaire" ON "element_b_drafts" USING btree ("participant_id","campaign_id","questionnaire_id");