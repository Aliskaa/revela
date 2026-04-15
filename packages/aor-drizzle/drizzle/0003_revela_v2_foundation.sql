DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        CREATE TYPE "public"."campaign_status" AS ENUM ('draft', 'active', 'closed', 'archived');
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
        CREATE TYPE "public"."admin_role" AS ENUM ('super_admin', 'campaign_admin', 'coach');
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE "public"."report_status" AS ENUM ('draft', 'pending_coach_review', 'approved', 'published');
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_request_status') THEN
        CREATE TYPE "public"."feedback_request_status" AS ENUM ('pending', 'completed', 'expired', 'cancelled');
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_function_level') THEN
        CREATE TYPE "public"."participant_function_level" AS ENUM (
            'direction',
            'middle_management',
            'frontline_manager'
        );
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_step_status') THEN
        CREATE TYPE "public"."participant_step_status" AS ENUM ('locked', 'pending', 'in_progress', 'completed');
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_job_status') THEN
        CREATE TYPE "public"."import_job_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_job_status') THEN
        CREATE TYPE "public"."export_job_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
    END IF;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" serial PRIMARY KEY NOT NULL,
    "company_id" integer NOT NULL,
    "name" varchar(255) NOT NULL,
    "status" "campaign_status" DEFAULT 'draft' NOT NULL,
    "allow_test_without_manual_inputs" boolean DEFAULT false NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "campaigns_company_name_unique" UNIQUE("company_id", "name")
);
--> statement-breakpoint
ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_company_id_idx" ON "campaigns" USING btree ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaigns_status_idx" ON "campaigns" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admins" (
    "id" serial PRIMARY KEY NOT NULL,
    "company_id" integer,
    "email" varchar(255) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "role" "admin_role" NOT NULL,
    "display_name" varchar(255),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admins"
    ADD CONSTRAINT "admins_company_id_companies_id_fk"
    FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admins_company_id_idx" ON "admins" USING btree ("company_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_admins" (
    "campaign_id" integer NOT NULL,
    "admin_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "campaign_admins_pkey" PRIMARY KEY("campaign_id", "admin_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_admins"
    ADD CONSTRAINT "campaign_admins_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "campaign_admins"
    ADD CONSTRAINT "campaign_admins_admin_id_admins_id_fk"
    FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint

ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "organisation" varchar(255);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "direction" varchar(255);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "service" varchar(255);
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "function_level" "participant_function_level";
--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_participants" (
    "id" serial PRIMARY KEY NOT NULL,
    "campaign_id" integer NOT NULL,
    "participant_id" integer NOT NULL,
    "invited_at" timestamp with time zone,
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "campaign_participants_unique" UNIQUE("campaign_id", "participant_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_participants"
    ADD CONSTRAINT "campaign_participants_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "campaign_participants"
    ADD CONSTRAINT "campaign_participants_participant_id_participants_id_fk"
    FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_participants_campaign_id_idx" ON "campaign_participants" USING btree ("campaign_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_participants_participant_id_idx" ON "campaign_participants" USING btree ("participant_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "questionnaires" (
    "id" varchar(16) PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "questions" (
    "id" serial PRIMARY KEY NOT NULL,
    "questionnaire_id" varchar(16) NOT NULL,
    "code" varchar(64) NOT NULL,
    "position" integer NOT NULL,
    "dimension" varchar(64) NOT NULL,
    "sub_dimension" varchar(64) NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "questions_questionnaire_code_unique" UNIQUE("questionnaire_id", "code"),
    CONSTRAINT "questions_questionnaire_position_unique" UNIQUE("questionnaire_id", "position")
);
--> statement-breakpoint
ALTER TABLE "questions"
    ADD CONSTRAINT "questions_questionnaire_id_questionnaires_id_fk"
    FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_questionnaire_id_idx" ON "questions" USING btree ("questionnaire_id");
--> statement-breakpoint

ALTER TABLE "questionnaire_responses" ADD COLUMN IF NOT EXISTS "campaign_id" integer;
--> statement-breakpoint
ALTER TABLE "questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questionnaire_responses_campaign_id_idx" ON "questionnaire_responses" USING btree ("campaign_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "response_answers" (
    "id" serial PRIMARY KEY NOT NULL,
    "response_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "value" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "response_answers_response_question_unique" UNIQUE("response_id", "question_id")
);
--> statement-breakpoint
ALTER TABLE "response_answers"
    ADD CONSTRAINT "response_answers_response_id_questionnaire_responses_id_fk"
    FOREIGN KEY ("response_id") REFERENCES "public"."questionnaire_responses"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "response_answers"
    ADD CONSTRAINT "response_answers_question_id_questions_id_fk"
    FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "response_answers_response_id_idx" ON "response_answers" USING btree ("response_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "response_answers_question_id_idx" ON "response_answers" USING btree ("question_id");
--> statement-breakpoint

ALTER TABLE "scores" ADD COLUMN IF NOT EXISTS "question_id" integer;
--> statement-breakpoint
ALTER TABLE "scores"
    ADD CONSTRAINT "scores_question_id_questions_id_fk"
    FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scores_question_id_idx" ON "scores" USING btree ("question_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "peer_feedback_requests" (
    "id" serial PRIMARY KEY NOT NULL,
    "campaign_id" integer NOT NULL,
    "subject_participant_id" integer NOT NULL,
    "slot_no" smallint NOT NULL,
    "rater_email" varchar(255) NOT NULL,
    "rater_name" varchar(255),
    "token_hash" varchar(128) NOT NULL,
    "status" "feedback_request_status" DEFAULT 'pending' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    CONSTRAINT "peer_feedback_requests_slot_check" CHECK ("slot_no" BETWEEN 1 AND 5),
    CONSTRAINT "peer_feedback_requests_token_hash_unique" UNIQUE("token_hash"),
    CONSTRAINT "peer_feedback_requests_slot_unique" UNIQUE("campaign_id", "subject_participant_id", "slot_no")
);
--> statement-breakpoint
ALTER TABLE "peer_feedback_requests"
    ADD CONSTRAINT "peer_feedback_requests_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "peer_feedback_requests"
    ADD CONSTRAINT "peer_feedback_requests_subject_participant_id_participants_id_fk"
    FOREIGN KEY ("subject_participant_id") REFERENCES "public"."participants"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "peer_feedback_requests_subject_participant_id_idx" ON "peer_feedback_requests" USING btree ("subject_participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "peer_feedback_requests_status_idx" ON "peer_feedback_requests" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "participant_progress" (
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
    CONSTRAINT "participant_progress_unique" UNIQUE("campaign_id", "participant_id")
);
--> statement-breakpoint
ALTER TABLE "participant_progress"
    ADD CONSTRAINT "participant_progress_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "participant_progress"
    ADD CONSTRAINT "participant_progress_participant_id_participants_id_fk"
    FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "participant_progress_campaign_id_idx" ON "participant_progress" USING btree ("campaign_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "participant_progress_participant_id_idx" ON "participant_progress" USING btree ("participant_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ai_reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "campaign_id" integer NOT NULL,
    "participant_id" integer NOT NULL,
    "generated_content" text NOT NULL,
    "coach_edited_content" text,
    "status" "report_status" DEFAULT 'draft' NOT NULL,
    "approved_by_admin_id" integer,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_reports"
    ADD CONSTRAINT "ai_reports_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "ai_reports"
    ADD CONSTRAINT "ai_reports_participant_id_participants_id_fk"
    FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "ai_reports"
    ADD CONSTRAINT "ai_reports_approved_by_admin_id_admins_id_fk"
    FOREIGN KEY ("approved_by_admin_id") REFERENCES "public"."admins"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_reports_campaign_id_idx" ON "ai_reports" USING btree ("campaign_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_reports_participant_id_idx" ON "ai_reports" USING btree ("participant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_reports_status_idx" ON "ai_reports" USING btree ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "import_jobs" (
    "id" serial PRIMARY KEY NOT NULL,
    "campaign_id" integer NOT NULL,
    "created_by_admin_id" integer NOT NULL,
    "filename" varchar(255) NOT NULL,
    "status" "import_job_status" DEFAULT 'pending' NOT NULL,
    "rows_total" integer DEFAULT 0 NOT NULL,
    "rows_success" integer DEFAULT 0 NOT NULL,
    "rows_failed" integer DEFAULT 0 NOT NULL,
    "error_summary" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "import_jobs"
    ADD CONSTRAINT "import_jobs_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "import_jobs"
    ADD CONSTRAINT "import_jobs_created_by_admin_id_admins_id_fk"
    FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "import_job_rows" (
    "id" serial PRIMARY KEY NOT NULL,
    "import_job_id" integer NOT NULL,
    "row_number" integer NOT NULL,
    "participant_email" varchar(255),
    "status" "import_job_status" DEFAULT 'pending' NOT NULL,
    "error_message" text,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "import_job_rows_job_row_unique" UNIQUE("import_job_id", "row_number")
);
--> statement-breakpoint
ALTER TABLE "import_job_rows"
    ADD CONSTRAINT "import_job_rows_import_job_id_import_jobs_id_fk"
    FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "export_jobs" (
    "id" serial PRIMARY KEY NOT NULL,
    "campaign_id" integer,
    "participant_id" integer,
    "requested_by_admin_id" integer NOT NULL,
    "format" varchar(32) DEFAULT 'pdf' NOT NULL,
    "status" "export_job_status" DEFAULT 'pending' NOT NULL,
    "storage_key" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "export_jobs"
    ADD CONSTRAINT "export_jobs_campaign_id_campaigns_id_fk"
    FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "export_jobs"
    ADD CONSTRAINT "export_jobs_participant_id_participants_id_fk"
    FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "export_jobs"
    ADD CONSTRAINT "export_jobs_requested_by_admin_id_admins_id_fk"
    FOREIGN KEY ("requested_by_admin_id") REFERENCES "public"."admins"("id")
    ON DELETE RESTRICT ON UPDATE NO ACTION;
--> statement-breakpoint

INSERT INTO "questionnaires" ("id", "name", "description")
VALUES
    ('EH', 'element humain', 'questionnaire element humain'),
    ('SELF', 'self rating', 'saisie manuelle auto-evaluation'),
    ('PEER', 'peer rating', 'saisie manuelle feedback pairs')
ON CONFLICT ("id") DO NOTHING;
