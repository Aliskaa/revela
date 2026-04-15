-- ============================================================
-- REVELA - V1 CLEAN SCHEMA
-- PostgreSQL
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- SCHEMA
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS public;

COMMENT ON SCHEMA public IS 'standard public schema';

-- ------------------------------------------------------------
-- TYPES
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.campaign_status AS ENUM (
    'draft',
    'active',
    'closed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.participant_function_level AS ENUM (
    'direction',
    'middle_management',
    'frontline_manager'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.participant_step_status AS ENUM (
    'locked',
    'pending',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.submission_kind AS ENUM (
    'element_humain',
    'self_rating',
    'peer_rating'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.peer_invitation_status AS ENUM (
    'pending',
    'opened',
    'completed',
    'expired',
    'revoked'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------
-- SEQUENCES
-- ------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.__drizzle_migrations_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.campaign_participants_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.campaigns_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.coaches_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.companies_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.invite_tokens_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.participant_progress_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.participants_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.questionnaire_responses_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.scores_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

CREATE SEQUENCE IF NOT EXISTS public.peer_feedback_invitations_id_seq
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 2147483647
  START 1
  CACHE 1
  NO CYCLE;

-- ------------------------------------------------------------
-- CORE TABLES
-- ------------------------------------------------------------

-- Migration tracking
CREATE TABLE IF NOT EXISTS public.__drizzle_migrations (
  id serial4 NOT NULL,
  hash text NOT NULL,
  created_at int8 NULL,
  CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id)
);

-- Coaches
CREATE TABLE IF NOT EXISTS public.coaches (
  id serial4 NOT NULL,
  username varchar(64) NOT NULL,
  password varchar(255) NOT NULL,
  display_name varchar(255) NOT NULL,
  is_active bool DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NULL,
  updated_at timestamptz DEFAULT now() NULL,
  CONSTRAINT coaches_pkey PRIMARY KEY (id),
  CONSTRAINT coaches_username_unique UNIQUE (username)
);

CREATE INDEX IF NOT EXISTS coaches_username_idx
  ON public.coaches USING btree (username);

-- Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id serial4 NOT NULL,
  name varchar(255) NOT NULL,
  contact_name varchar(255) NULL,
  contact_email varchar(255) NULL,
  created_at timestamptz DEFAULT now() NULL,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_name_unique UNIQUE (name)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id serial4 NOT NULL,
  company_id int4 NOT NULL,
  name varchar(255) NOT NULL,
  status public.campaign_status DEFAULT 'draft'::campaign_status NOT NULL,
  allow_test_without_manual_inputs bool DEFAULT false NOT NULL,
  starts_at timestamptz NULL,
  ends_at timestamptz NULL,
  questionnaire_id varchar(16) NULL,
  coach_id int4 NOT NULL,
  created_at timestamptz DEFAULT now() NULL,
  updated_at timestamptz DEFAULT now() NULL,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_company_name_unique UNIQUE (company_id, name),
  CONSTRAINT campaigns_company_id_companies_id_fk
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  CONSTRAINT campaigns_coach_id_coaches_id_fk
    FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS campaigns_company_id_idx
  ON public.campaigns USING btree (company_id);

CREATE INDEX IF NOT EXISTS campaigns_coach_id_idx
  ON public.campaigns USING btree (coach_id);

CREATE INDEX IF NOT EXISTS campaigns_status_idx
  ON public.campaigns USING btree (status);

-- Participants
CREATE TABLE IF NOT EXISTS public.participants (
  id serial4 NOT NULL,
  company_id int4 NULL,
  first_name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NULL,
  organisation varchar(255) NULL,
  direction varchar(255) NULL,
  service varchar(255) NULL,
  function_level public.participant_function_level NULL,
  created_at timestamptz DEFAULT now() NULL,
  updated_at timestamptz DEFAULT now() NULL,
  CONSTRAINT participants_pkey PRIMARY KEY (id),
  CONSTRAINT participants_email_unique UNIQUE (email),
  CONSTRAINT participants_company_id_companies_id_fk
    FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

CREATE INDEX IF NOT EXISTS participants_email_idx
  ON public.participants USING btree (email);

-- Campaign participants
CREATE TABLE IF NOT EXISTS public.campaign_participants (
  id serial4 NOT NULL,
  campaign_id int4 NOT NULL,
  participant_id int4 NOT NULL,
  invited_at timestamptz NULL,
  joined_at timestamptz NULL,
  created_at timestamptz DEFAULT now() NULL,
  updated_at timestamptz DEFAULT now() NULL,
  CONSTRAINT campaign_participants_pkey PRIMARY KEY (id),
  CONSTRAINT campaign_participants_unique UNIQUE (campaign_id, participant_id),
  CONSTRAINT campaign_participants_campaign_id_campaigns_id_fk
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT campaign_participants_participant_id_participants_id_fk
    FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS campaign_participants_campaign_id_idx
  ON public.campaign_participants USING btree (campaign_id);

CREATE INDEX IF NOT EXISTS campaign_participants_participant_id_idx
  ON public.campaign_participants USING btree (participant_id);

-- ------------------------------------------------------------
-- INVITES
-- ------------------------------------------------------------

-- Participant invitation token (login / onboarding)
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id serial4 NOT NULL,
  token varchar(64) NOT NULL,
  participant_id int4 NOT NULL,
  questionnaire_id varchar(16) NOT NULL,
  campaign_id int4 NULL,
  created_at timestamptz DEFAULT now() NULL,
  expires_at timestamptz NULL,
  used_at timestamptz NULL,
  is_active bool DEFAULT true NOT NULL,
  CONSTRAINT invite_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT invite_tokens_token_unique UNIQUE (token),
  CONSTRAINT invite_tokens_participant_id_participants_id_fk
    FOREIGN KEY (participant_id) REFERENCES public.participants(id),
  CONSTRAINT invite_tokens_campaign_id_campaigns_id_fk
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS invite_tokens_token_idx
  ON public.invite_tokens USING btree (token);

CREATE INDEX IF NOT EXISTS invite_tokens_campaign_id_idx
  ON public.invite_tokens USING btree (campaign_id);

-- Peer feedback invitations
CREATE TABLE IF NOT EXISTS public.peer_feedback_invitations (
  id serial4 NOT NULL,
  campaign_id int4 NOT NULL,
  subject_participant_id int4 NOT NULL,
  email varchar(255) NOT NULL,
  token varchar(64) NOT NULL,
  status public.peer_invitation_status DEFAULT 'pending' NOT NULL,
  invited_at timestamptz DEFAULT now() NULL,
  opened_at timestamptz NULL,
  completed_at timestamptz NULL,
  expires_at timestamptz NULL,
  created_at timestamptz DEFAULT now() NULL,
  updated_at timestamptz DEFAULT now() NULL,
  CONSTRAINT peer_feedback_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT peer_feedback_invitations_token_unique UNIQUE (token),
  CONSTRAINT peer_feedback_invitations_campaign_id_campaigns_id_fk
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT peer_feedback_invitations_subject_participant_id_participants_id_fk
    FOREIGN KEY (subject_participant_id) REFERENCES public.participants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS peer_feedback_invitations_campaign_id_idx
  ON public.peer_feedback_invitations USING btree (campaign_id);

CREATE INDEX IF NOT EXISTS peer_feedback_invitations_subject_participant_id_idx
  ON public.peer_feedback_invitations USING btree (subject_participant_id);

CREATE INDEX IF NOT EXISTS peer_feedback_invitations_email_idx
  ON public.peer_feedback_invitations USING btree (email);

-- ------------------------------------------------------------
-- PROGRESSION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.participant_progress (
  id serial4 NOT NULL,
  campaign_id int4 NOT NULL,
  participant_id int4 NOT NULL,
  self_rating_status public.participant_step_status DEFAULT 'pending'::participant_step_status NOT NULL,
  peer_feedback_status public.participant_step_status DEFAULT 'pending'::participant_step_status NOT NULL,
  element_humain_status public.participant_step_status DEFAULT 'locked'::participant_step_status NOT NULL,
  results_status public.participant_step_status DEFAULT 'locked'::participant_step_status NOT NULL,
  self_rating_completed_at timestamptz NULL,
  peer_feedback_completed_at timestamptz NULL,
  element_humain_completed_at timestamptz NULL,
  results_published_at timestamptz NULL,
  created_at timestamptz DEFAULT now() NULL,
  updated_at timestamptz DEFAULT now() NULL,
  CONSTRAINT participant_progress_pkey PRIMARY KEY (id),
  CONSTRAINT participant_progress_unique UNIQUE (campaign_id, participant_id),
  CONSTRAINT participant_progress_campaign_id_campaigns_id_fk
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT participant_progress_participant_id_participants_id_fk
    FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS participant_progress_campaign_id_idx
  ON public.participant_progress USING btree (campaign_id);

CREATE INDEX IF NOT EXISTS participant_progress_participant_id_idx
  ON public.participant_progress USING btree (participant_id);

-- ------------------------------------------------------------
-- RESPONSES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id serial4 NOT NULL,
  participant_id int4 NULL,
  invite_token_id int4 NULL,
  questionnaire_id varchar(16) NOT NULL,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  organisation varchar(255) NULL,
  submitted_at timestamptz DEFAULT now() NULL,
  submission_kind public.submission_kind DEFAULT 'element_humain'::submission_kind NOT NULL,
  subject_participant_id int4 NULL,
  rater_participant_id int4 NULL,
  campaign_id int4 NULL,
  CONSTRAINT questionnaire_responses_pkey PRIMARY KEY (id),
  CONSTRAINT questionnaire_responses_participant_id_participants_id_fk
    FOREIGN KEY (participant_id) REFERENCES public.participants(id),
  CONSTRAINT questionnaire_responses_invite_token_id_invite_tokens_id_fk
    FOREIGN KEY (invite_token_id) REFERENCES public.invite_tokens(id),
  CONSTRAINT questionnaire_responses_subject_participant_id_participants_id_fk
    FOREIGN KEY (subject_participant_id) REFERENCES public.participants(id),
  CONSTRAINT questionnaire_responses_rater_participant_id_participants_id_fk
    FOREIGN KEY (rater_participant_id) REFERENCES public.participants(id),
  CONSTRAINT questionnaire_responses_campaign_id_campaigns_id_fk
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS questionnaire_responses_campaign_id_idx
  ON public.questionnaire_responses USING btree (campaign_id);

CREATE INDEX IF NOT EXISTS questionnaire_responses_questionnaire_id_idx
  ON public.questionnaire_responses USING btree (questionnaire_id);

CREATE INDEX IF NOT EXISTS questionnaire_responses_rater_participant_id_idx
  ON public.questionnaire_responses USING btree (rater_participant_id);

CREATE INDEX IF NOT EXISTS questionnaire_responses_subject_participant_id_idx
  ON public.questionnaire_responses USING btree (subject_participant_id);

CREATE INDEX IF NOT EXISTS questionnaire_responses_submission_kind_idx
  ON public.questionnaire_responses USING btree (submission_kind);

-- Scores
CREATE TABLE IF NOT EXISTS public.scores (
  id serial4 NOT NULL,
  response_id int4 NOT NULL,
  score_key int4 NOT NULL,
  value int4 NOT NULL,
  CONSTRAINT scores_pkey PRIMARY KEY (id),
  CONSTRAINT scores_response_id_questionnaire_responses_id_fk
    FOREIGN KEY (response_id) REFERENCES public.questionnaire_responses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS scores_response_id_idx
  ON public.scores USING btree (response_id);

COMMIT;