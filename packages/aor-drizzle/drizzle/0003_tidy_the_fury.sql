CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."participant_step_status" AS ENUM('locked', 'pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."participant_function_level" AS ENUM('direction', 'middle_management', 'frontline_manager');--> statement-breakpoint
CREATE TABLE "campaign_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"invited_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "campaign_participants_unique" UNIQUE("campaign_id","participant_id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"allow_test_without_manual_inputs" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "campaigns_company_name_unique" UNIQUE("company_id","name")
);
--> statement-breakpoint
CREATE TABLE "participant_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"self_rating_status" "participant_step_status" DEFAULT 'pending' NOT NULL,
	"peer_feedback_status" "participant_step_status" DEFAULT 'pending' NOT NULL,
	"element_humain_status" "participant_step_status" DEFAULT 'locked' NOT NULL,
	"results_status" "participant_step_status" DEFAULT 'locked' NOT NULL,
	"self_rating_completed_at" timestamp with time zone,
	"peer_feedback_completed_at" timestamp with time zone,
	"element_humain_completed_at" timestamp with time zone,
	"results_published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "participant_progress_unique" UNIQUE("campaign_id","participant_id")
);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "organisation" varchar(255);--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "direction" varchar(255);--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "service" varchar(255);--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "function_level" "participant_function_level";--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "campaign_id" integer;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_progress" ADD CONSTRAINT "participant_progress_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_progress" ADD CONSTRAINT "participant_progress_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_participants_campaign_id_idx" ON "campaign_participants" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_participants_participant_id_idx" ON "campaign_participants" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "campaigns_company_id_idx" ON "campaigns" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "participant_progress_campaign_id_idx" ON "participant_progress" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "participant_progress_participant_id_idx" ON "participant_progress" USING btree ("participant_id");--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "questionnaire_responses_campaign_id_idx" ON "questionnaire_responses" USING btree ("campaign_id");