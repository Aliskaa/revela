CREATE TYPE "public"."ai_restitution_status" AS ENUM('generated', 'edited', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "ai_prompt_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" varchar(64) NOT NULL,
	"system_prompt" text NOT NULL,
	"forbidden_phrases" jsonb NOT NULL,
	"hypothesis_markers" jsonb NOT NULL,
	"max_words" integer DEFAULT 650 NOT NULL,
	"provider" varchar(32) DEFAULT 'anthropic' NOT NULL,
	"model" varchar(64) DEFAULT 'claude-opus-4-7' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_prompt_versions_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "ai_restitutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"status" "ai_restitution_status" DEFAULT 'generated' NOT NULL,
	"model" varchar(64) NOT NULL,
	"prompt_version_id" integer NOT NULL,
	"intermediate_json" jsonb NOT NULL,
	"raw_output" text NOT NULL,
	"edited_output" text,
	"validation_report" jsonb,
	"regen_attempts" integer DEFAULT 0 NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_coach_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_restitutions_unique_per_participant_campaign" UNIQUE("participant_id","campaign_id")
);
--> statement-breakpoint
ALTER TABLE "ai_restitutions" ADD CONSTRAINT "ai_restitutions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_restitutions" ADD CONSTRAINT "ai_restitutions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_restitutions" ADD CONSTRAINT "ai_restitutions_prompt_version_id_ai_prompt_versions_id_fk" FOREIGN KEY ("prompt_version_id") REFERENCES "public"."ai_prompt_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_restitutions" ADD CONSTRAINT "ai_restitutions_approved_by_coach_id_coaches_id_fk" FOREIGN KEY ("approved_by_coach_id") REFERENCES "public"."coaches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_prompt_versions_is_active_idx" ON "ai_prompt_versions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ai_restitutions_campaign_id_idx" ON "ai_restitutions" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ai_restitutions_status_idx" ON "ai_restitutions" USING btree ("status");