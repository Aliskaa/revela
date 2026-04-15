CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "invite_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(64) NOT NULL,
	"participant_id" integer NOT NULL,
	"questionnaire_id" varchar(4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"expires_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "invite_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "participants_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant_id" integer,
	"invite_token_id" integer,
	"questionnaire_id" varchar(4) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"organisation" varchar(255),
	"submitted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"response_id" integer NOT NULL,
	"score_key" integer NOT NULL,
	"value" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invite_tokens" ADD CONSTRAINT "invite_tokens_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_invite_token_id_invite_tokens_id_fk" FOREIGN KEY ("invite_token_id") REFERENCES "public"."invite_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_response_id_questionnaire_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invite_tokens_token_idx" ON "invite_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "participants_email_idx" ON "participants" USING btree ("email");--> statement-breakpoint
CREATE INDEX "questionnaire_responses_questionnaire_id_idx" ON "questionnaire_responses" USING btree ("questionnaire_id");--> statement-breakpoint
CREATE INDEX "scores_response_id_idx" ON "scores" USING btree ("response_id");