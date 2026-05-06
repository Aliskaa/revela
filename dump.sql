--
-- PostgreSQL database dump
--

\restrict bbS0hL4NbR17a5FnFNOaoY5XZ6GjiYMRIJ1jdgo4GpWwyGtQbkXkeQN32HEq0WV

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: audit_actor_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_actor_type AS ENUM (
    'super-admin',
    'coach',
    'participant',
    'system',
    'anonymous'
);


--
-- Name: campaign_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.campaign_status AS ENUM (
    'draft',
    'active',
    'closed',
    'archived'
);


--
-- Name: participant_function_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.participant_function_level AS ENUM (
    'direction',
    'middle_management',
    'frontline_manager'
);


--
-- Name: participant_step_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.participant_step_status AS ENUM (
    'locked',
    'pending',
    'completed'
);


--
-- Name: refresh_token_subject_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.refresh_token_subject_type AS ENUM (
    'admin',
    'participant'
);


--
-- Name: submission_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_kind AS ENUM (
    'element_humain',
    'self_rating',
    'peer_rating'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_events (
    id integer NOT NULL,
    actor_type public.audit_actor_type NOT NULL,
    actor_id integer,
    action text NOT NULL,
    resource_type text,
    resource_id integer,
    payload jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_events_id_seq OWNED BY public.audit_events.id;


--
-- Name: campaign_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaign_participants (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    participant_id integer NOT NULL,
    invited_at timestamp with time zone,
    joined_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: campaign_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campaign_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campaign_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campaign_participants_id_seq OWNED BY public.campaign_participants.id;


--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    company_id integer NOT NULL,
    name character varying(255) NOT NULL,
    status public.campaign_status DEFAULT 'draft'::public.campaign_status NOT NULL,
    allow_test_without_manual_inputs boolean DEFAULT false NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    questionnaire_id character varying(16),
    coach_id integer NOT NULL
);


--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: coaches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coaches (
    id integer NOT NULL,
    username character varying(64) NOT NULL,
    password character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: coaches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coaches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coaches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coaches_id_seq OWNED BY public.coaches.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    contact_name character varying(255),
    contact_email character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: invite_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_tokens (
    id integer NOT NULL,
    token character varying(64) NOT NULL,
    participant_id integer NOT NULL,
    questionnaire_id character varying(4) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    used_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    campaign_id integer
);


--
-- Name: invite_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invite_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invite_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invite_tokens_id_seq OWNED BY public.invite_tokens.id;


--
-- Name: participant_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participant_progress (
    id integer NOT NULL,
    campaign_id integer NOT NULL,
    participant_id integer NOT NULL,
    self_rating_status public.participant_step_status DEFAULT 'pending'::public.participant_step_status NOT NULL,
    peer_feedback_status public.participant_step_status DEFAULT 'pending'::public.participant_step_status NOT NULL,
    element_humain_status public.participant_step_status DEFAULT 'locked'::public.participant_step_status NOT NULL,
    results_status public.participant_step_status DEFAULT 'locked'::public.participant_step_status NOT NULL,
    self_rating_completed_at timestamp with time zone,
    peer_feedback_completed_at timestamp with time zone,
    element_humain_completed_at timestamp with time zone,
    results_published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: participant_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participant_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participant_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participant_progress_id_seq OWNED BY public.participant_progress.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants (
    id integer NOT NULL,
    company_id integer,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    password_hash character varying(255),
    organisation character varying(255),
    direction character varying(255),
    service character varying(255),
    function_level public.participant_function_level,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participants_id_seq OWNED BY public.participants.id;


--
-- Name: questionnaire_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questionnaire_responses (
    id integer NOT NULL,
    participant_id integer,
    invite_token_id integer,
    questionnaire_id character varying(4) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    organisation character varying(255),
    submitted_at timestamp with time zone DEFAULT now(),
    submission_kind public.submission_kind DEFAULT 'element_humain'::public.submission_kind NOT NULL,
    subject_participant_id integer,
    rater_participant_id integer,
    campaign_id integer,
    rated_participant_id integer
);


--
-- Name: questionnaire_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questionnaire_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questionnaire_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questionnaire_responses_id_seq OWNED BY public.questionnaire_responses.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    subject_type public.refresh_token_subject_type NOT NULL,
    subject_id integer NOT NULL,
    token_hash character varying(64) NOT NULL,
    family_id character varying(36) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    replaced_by_id integer,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scores (
    id integer NOT NULL,
    response_id integer NOT NULL,
    score_key integer NOT NULL,
    value integer NOT NULL
);


--
-- Name: scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scores_id_seq OWNED BY public.scores.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: audit_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events ALTER COLUMN id SET DEFAULT nextval('public.audit_events_id_seq'::regclass);


--
-- Name: campaign_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants ALTER COLUMN id SET DEFAULT nextval('public.campaign_participants_id_seq'::regclass);


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: coaches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches ALTER COLUMN id SET DEFAULT nextval('public.coaches_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: invite_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens ALTER COLUMN id SET DEFAULT nextval('public.invite_tokens_id_seq'::regclass);


--
-- Name: participant_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_progress ALTER COLUMN id SET DEFAULT nextval('public.participant_progress_id_seq'::regclass);


--
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants ALTER COLUMN id SET DEFAULT nextval('public.participants_id_seq'::regclass);


--
-- Name: questionnaire_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses ALTER COLUMN id SET DEFAULT nextval('public.questionnaire_responses_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores ALTER COLUMN id SET DEFAULT nextval('public.scores_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	ff376c333633b242f20dc9ab3447f8e5b5b85e283bf0a914e211e2d43f3ed969	1774462358509
2	f481235f9e694de7bcbbdd2ad598f308d0bc3ab7a4fba9f281a703d18fe844e5	1775250255099
3	6c612e20b53f14d566e5afab38f75f53ea9bdb46ae32285b0cce76542242c24c	1775302115315
4	a73bbea700a267b09fa6628b76cbbea68a18381161be65c596ee9d39284cf7b9	1775486252803
5	35df3e6da142b8eba0c23117fbae1a5293abb31dccec3aa5516a60e042f92ec1	1775491200000
6	1a5b44098844607e7f7602265662e17f75c6e27377bc166ecb5e8aa57606edd7	1775492400000
7	b688ea98eb4b0c2585632fc027d0451d64ad7cf255306e4706320ea03e1e58fb	1775490904564
8	f4dea5506b1f49b3dcf75c73e0841b2ca7b6bbfde7655fa51883f9ad9aa11d1e	1775606400000
9	513eb93efa6366fbcc98bac621332079e387396c3a873add2fe70956887e6354	1775692800000
10	5e7228c07fba7e88b4f9be1bb39d585247599bb38ef69c979fd0942c7856c47f	1775984794983
11	624d7a734753ed88eb78a5bf371cfba0858e268f1a4cc6ba65e3280d208ae68a	1776287187573
12	017f6036be00435dae38d854f87a5554cf3b37db8fb6ff380c0b1efca31af9fe	1776290862456
13	60ac39a5f95d2fb96d6205e20681ff007be7ead78f5ee7299a2410ee861b22db	1776291273021
14	fede7df1e634d871af7c3c35c62fda4ce29cfa83c4c24947841ae6227e1626e4	1777637789217
15	84f093211b6a0d394932e8003b60e6a98e74e9e7c148f4d5f9f0b361248b5f6c	1777640899169
\.


--
-- Data for Name: audit_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_events (id, actor_type, actor_id, action, resource_type, resource_id, payload, ip_address, created_at) FROM stdin;
1	super-admin	\N	admin.login.success	\N	\N	{"scope": "super-admin"}	::1	2026-05-05 16:34:12.261005+00
2	coach	\N	admin.logout	\N	\N	\N	::1	2026-05-05 16:51:31.784455+00
3	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:03:06.551468+00
4	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:10:16.734656+00
5	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:10:45.332653+00
6	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:11:14.152832+00
7	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:11:20.462811+00
8	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:11:39.673037+00
9	super-admin	\N	admin.login.success	\N	\N	{"scope": "super-admin"}	::1	2026-05-05 17:11:46.691362+00
10	coach	\N	admin.logout	\N	\N	\N	::1	2026-05-05 17:13:08.734348+00
11	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:13:14.801188+00
12	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:13:54.243715+00
13	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:14:00.510316+00
14	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:15:22.656594+00
15	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:15:30.513727+00
16	participant	\N	participant.logout	\N	\N	\N	::1	2026-05-05 17:16:11.1148+00
17	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:16:27.024288+00
18	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:16:43.900493+00
19	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:17:01.500566+00
20	super-admin	\N	admin.login.success	\N	\N	{"scope": "super-admin"}	::1	2026-05-05 17:17:38.984583+00
21	coach	\N	admin.logout	\N	\N	\N	::1	2026-05-05 17:20:12.826213+00
22	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:20:23.963381+00
23	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:20:27.851908+00
24	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant082@fixture.example.com"}	::1	2026-05-05 17:21:06.2011+00
25	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant66@fixture.example.com"}	::1	2026-05-05 17:21:17.51899+00
26	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant66@fixture.example.com"}	::1	2026-05-05 17:21:28.155541+00
27	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant66@fixture.example.com"}	::1	2026-05-05 17:21:38.012687+00
28	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant66@fixture.example.com"}	::ffff:127.0.0.1	2026-05-05 17:23:47.286854+00
29	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::ffff:127.0.0.1	2026-05-05 17:24:59.698638+00
30	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant001@fixture.example.com"}	::ffff:127.0.0.1	2026-05-05 17:25:17.962138+00
31	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:25:46.744374+00
32	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:25:53.885833+00
33	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:25:54.719287+00
34	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::1	2026-05-05 17:26:20.092746+00
35	participant	25	participant.login.success	\N	\N	\N	::ffff:127.0.0.1	2026-05-05 17:27:09.379674+00
36	participant	50	participant.login.success	\N	\N	\N	::ffff:127.0.0.1	2026-05-05 17:27:09.824616+00
37	participant	59	participant.login.success	\N	\N	\N	::ffff:127.0.0.1	2026-05-05 17:27:10.217044+00
38	anonymous	\N	participant.login.failure	\N	\N	{"email": "participant066@fixture.example.com"}	::ffff:127.0.0.1	2026-05-05 17:27:10.696774+00
39	participant	80	participant.login.success	\N	\N	\N	::ffff:127.0.0.1	2026-05-05 17:27:11.175938+00
40	participant	82	participant.login.success	\N	\N	\N	::ffff:127.0.0.1	2026-05-05 17:27:11.728344+00
41	participant	66	participant.login.success	\N	\N	\N	::ffff:127.0.0.1	2026-05-05 17:27:55.552682+00
42	participant	66	participant.login.success	\N	\N	\N	::1	2026-05-05 17:28:07.891671+00
\.


--
-- Data for Name: campaign_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campaign_participants (id, campaign_id, participant_id, invited_at, joined_at, created_at, updated_at) FROM stdin;
3	1	50	2026-05-05 16:49:54.171+00	2026-05-05 17:03:06.531+00	2026-05-05 16:49:54.170281+00	2026-05-05 17:03:06.531+00
2	1	80	2026-05-05 16:49:54.151+00	2026-05-05 17:10:45.313+00	2026-05-05 16:49:54.151454+00	2026-05-05 17:10:45.313+00
7	1	82	2026-05-05 17:12:07.791+00	2026-05-05 17:13:14.78+00	2026-05-05 17:12:07.794247+00	2026-05-05 17:13:14.78+00
8	1	25	2026-05-05 17:12:07.803+00	2026-05-05 17:14:00.486+00	2026-05-05 17:12:07.805638+00	2026-05-05 17:14:46.286+00
9	1	59	2026-05-05 17:12:07.814+00	2026-05-05 17:15:30.487+00	2026-05-05 17:12:07.81714+00	2026-05-05 17:16:04.554+00
1	1	66	2026-05-05 16:49:54.128+00	2026-05-05 17:11:20.44+00	2026-05-05 16:49:54.128431+00	2026-05-05 17:36:09.716+00
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.campaigns (id, company_id, name, status, allow_test_without_manual_inputs, starts_at, ends_at, created_at, updated_at, questionnaire_id, coach_id) FROM stdin;
1	1	Test	active	f	\N	\N	2026-05-05 16:49:38.598803+00	2026-05-05 16:49:38.598803+00	B	2
\.


--
-- Data for Name: coaches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coaches (id, username, password, display_name, is_active, created_at, updated_at) FROM stdin;
2	admin	scrypt1$50s2HyMRJF8GhyZZDD__Wg$EiOtnoELyiv8ajS9vl6rqjZ8O6ckvNG-mto7PvdfCb4oRKZ1MYMZSHjYNYNI3Kimb4Q5WgCZpsIDDG-x--rRwA	Admin	t	2026-05-05 16:33:38.311382+00	2026-05-05 16:33:38.311382+00
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, contact_name, contact_email, created_at) FROM stdin;
1	Orange	\N	\N	2026-05-05 16:48:04.552668+00
\.


--
-- Data for Name: invite_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invite_tokens (id, token, participant_id, questionnaire_id, created_at, expires_at, used_at, is_active, campaign_id) FROM stdin;
3	r16nAUfbhiNddn4m_cj1Ld7YFBTA3-cM2dw7U6hNI2o	50	B	2026-05-05 16:49:54.156229+00	2026-06-04 16:49:54.157+00	2026-05-05 17:03:14.779+00	t	1
2	MFBxUdqswRSSTQkyLHHfQoJZQ47ryVXykKF3ibJ9M7Y	80	B	2026-05-05 16:49:54.133865+00	2026-06-04 16:49:54.135+00	2026-05-05 17:10:51.609+00	t	1
1	YU-_Tt_7XzEBP3dORRxfVC1k2iV25NFYr5bmwzd1a5Q	66	B	2026-05-05 16:49:54.106618+00	2026-06-04 16:49:54.106+00	2026-05-05 17:11:27.222+00	t	1
4	ygTzHAemGI8yOjqbQTx-Pt_7FPqUYOzREEfrORTGjUo	82	B	2026-05-05 17:12:07.784381+00	2026-06-04 17:12:07.781+00	2026-05-05 17:13:44.156+00	t	1
5	EoUI013SWUYsj18izIrAo4zV0omwlwdtvYe_6TOYxpM	25	B	2026-05-05 17:12:07.798165+00	2026-06-04 17:12:07.795+00	2026-05-05 17:14:11.672+00	t	1
6	Uz-BYbK7aK8J6HTqkObefa4O0pOsmy8Hv6QspkdPJ0Q	59	B	2026-05-05 17:12:07.808816+00	2026-06-04 17:12:07.806+00	2026-05-05 17:15:41.326+00	t	1
\.


--
-- Data for Name: participant_progress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.participant_progress (id, campaign_id, participant_id, self_rating_status, peer_feedback_status, element_humain_status, results_status, self_rating_completed_at, peer_feedback_completed_at, element_humain_completed_at, results_published_at, created_at, updated_at) FROM stdin;
1	1	25	pending	completed	locked	locked	\N	2026-05-05 17:14:46.286+00	\N	\N	2026-05-05 17:14:46.284582+00	2026-05-05 17:14:46.286+00
2	1	59	pending	completed	locked	locked	\N	2026-05-05 17:16:04.554+00	\N	\N	2026-05-05 17:16:04.557847+00	2026-05-05 17:16:04.554+00
3	1	66	completed	completed	completed	locked	2026-05-05 17:31:40.93+00	2026-05-05 17:28:40.697+00	2026-05-05 17:36:09.716+00	\N	2026-05-05 17:28:40.69591+00	2026-05-05 17:36:09.716+00
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.participants (id, company_id, first_name, last_name, email, created_at, password_hash, organisation, direction, service, function_level, updated_at) FROM stdin;
1	1	Jean	Dubois	participant001@fixture.example.com	2026-05-05 16:48:49.761416+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.761416+00
2	1	Marie	Roux	participant002@fixture.example.com	2026-05-05 16:48:49.772451+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.772451+00
3	1	Pierre	Dupont	participant003@fixture.example.com	2026-05-05 16:48:49.778736+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.778736+00
4	1	Sophie	Roussel	participant004@fixture.example.com	2026-05-05 16:48:49.785554+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.785554+00
5	1	Lucas	Dumont	participant005@fixture.example.com	2026-05-05 16:48:49.791725+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.791725+00
6	1	Emma	Brun	participant006@fixture.example.com	2026-05-05 16:48:49.799458+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.799458+00
7	1	Thomas	Guillaume	participant007@fixture.example.com	2026-05-05 16:48:49.807325+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.807325+00
8	1	Julie	Meunier	participant008@fixture.example.com	2026-05-05 16:48:49.813635+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.813635+00
9	1	Nicolas	Reynaud	participant009@fixture.example.com	2026-05-05 16:48:49.820571+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.820571+00
10	1	Camille	Lemoine	participant010@fixture.example.com	2026-05-05 16:48:49.827808+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.827808+00
11	1	Antoine	Garcia	participant011@fixture.example.com	2026-05-05 16:48:49.834399+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.834399+00
12	1	Léa	Gautier	participant012@fixture.example.com	2026-05-05 16:48:49.840762+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.840762+00
13	1	Julien	Jacquet	participant013@fixture.example.com	2026-05-05 16:48:49.846473+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.846473+00
14	1	Sarah	Jacques	participant014@fixture.example.com	2026-05-05 16:48:49.853418+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.853418+00
15	1	Maxime	Thomas	participant015@fixture.example.com	2026-05-05 16:48:49.859888+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.859888+00
16	1	Claire	Laurent	participant016@fixture.example.com	2026-05-05 16:48:49.868286+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.868286+00
17	1	Arnaud	Bertrand	participant017@fixture.example.com	2026-05-05 16:48:49.876904+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.876904+00
18	1	Pauline	Fontaine	participant018@fixture.example.com	2026-05-05 16:48:49.883432+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.883432+00
19	1	David	Perrot	participant019@fixture.example.com	2026-05-05 16:48:49.889995+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.889995+00
20	1	Laura	Fabre	participant020@fixture.example.com	2026-05-05 16:48:49.895063+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.895063+00
21	1	Florian	Faure	participant021@fixture.example.com	2026-05-05 16:48:49.901118+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.901118+00
22	1	Audrey	Duval	participant022@fixture.example.com	2026-05-05 16:48:49.90704+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.90704+00
23	1	Mathieu	Marchal	participant023@fixture.example.com	2026-05-05 16:48:49.911774+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.911774+00
24	1	Elodie	Huet	participant024@fixture.example.com	2026-05-05 16:48:49.916745+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.916745+00
26	1	Isabelle	Fleury	participant026@fixture.example.com	2026-05-05 16:48:49.927235+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.927235+00
27	1	Christophe	Lemaire	participant027@fixture.example.com	2026-05-05 16:48:49.932483+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.932483+00
28	1	Valérie	Royer	participant028@fixture.example.com	2026-05-05 16:48:49.938603+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.938603+00
29	1	Fabien	Lamy	participant029@fixture.example.com	2026-05-05 16:48:49.943489+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.943489+00
30	1	Nathalie	Robert	participant030@fixture.example.com	2026-05-05 16:48:49.94842+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.94842+00
31	1	Guillaume	Michel	participant031@fixture.example.com	2026-05-05 16:48:49.954356+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.954356+00
32	1	Céline	Fournier	participant032@fixture.example.com	2026-05-05 16:48:49.959189+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.959189+00
33	1	Olivier	Vincent	participant033@fixture.example.com	2026-05-05 16:48:49.963689+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.963689+00
34	1	Sandrine	Mathieu	participant034@fixture.example.com	2026-05-05 16:48:49.969293+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.969293+00
35	1	Sébastien	Guerin	participant035@fixture.example.com	2026-05-05 16:48:49.975668+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.975668+00
36	1	Marion	Picard	participant036@fixture.example.com	2026-05-05 16:48:49.98097+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.98097+00
37	1	Vincent	Colin	participant037@fixture.example.com	2026-05-05 16:48:49.986703+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.986703+00
38	1	Amélie	Roche	participant038@fixture.example.com	2026-05-05 16:48:49.991886+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.991886+00
39	1	Benjamin	Cousin	participant039@fixture.example.com	2026-05-05 16:48:49.996534+00	\N	\N	\N	\N	\N	2026-05-05 16:48:49.996534+00
40	1	Caroline	Rolland	participant040@fixture.example.com	2026-05-05 16:48:50.001299+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.001299+00
41	1	Alexandre	Pons	participant041@fixture.example.com	2026-05-05 16:48:50.006943+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.006943+00
42	1	Jessica	Marty	participant042@fixture.example.com	2026-05-05 16:48:50.011618+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.011618+00
43	1	Laurent	Lacroix	participant043@fixture.example.com	2026-05-05 16:48:50.017133+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.017133+00
44	1	Melanie	Lopez	participant044@fixture.example.com	2026-05-05 16:48:50.022727+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.022727+00
45	1	François	Durand	participant045@fixture.example.com	2026-05-05 16:48:50.027613+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.027613+00
46	1	Stéphanie	Leroy	participant046@fixture.example.com	2026-05-05 16:48:50.032401+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.032401+00
47	1	Eric	Bonnet	participant047@fixture.example.com	2026-05-05 16:48:50.038344+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.038344+00
48	1	Virginie	Henry	participant048@fixture.example.com	2026-05-05 16:48:50.043513+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.043513+00
49	1	Patrick	Gauthier	participant049@fixture.example.com	2026-05-05 16:48:50.049623+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.049623+00
51	1	Damien	Vidal	participant051@fixture.example.com	2026-05-05 16:48:50.06034+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.06034+00
52	1	Christine	Noel	participant052@fixture.example.com	2026-05-05 16:48:50.065186+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.065186+00
53	1	Bruno	Da Silva	participant053@fixture.example.com	2026-05-05 16:48:50.071047+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.071047+00
54	1	Patricia	Carpentier	participant054@fixture.example.com	2026-05-05 16:48:50.075929+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.075929+00
55	1	Michel	Fernandez	participant055@fixture.example.com	2026-05-05 16:48:50.08113+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.08113+00
56	1	Corinne	Joly	participant056@fixture.example.com	2026-05-05 16:48:50.087316+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.087316+00
57	1	Yves	Breton	participant057@fixture.example.com	2026-05-05 16:48:50.092177+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.092177+00
58	1	Annie	Poirier	participant058@fixture.example.com	2026-05-05 16:48:50.096966+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.096966+00
60	1	Isabelle	Moreau	participant060@fixture.example.com	2026-05-05 16:48:50.108233+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.108233+00
61	1	Richard	David	participant061@fixture.example.com	2026-05-05 16:48:50.113592+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.113592+00
62	1	Véronique	Lambert	participant062@fixture.example.com	2026-05-05 16:48:50.119018+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.119018+00
63	1	Denis	Nicolas	participant063@fixture.example.com	2026-05-05 16:48:50.124718+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.124718+00
64	1	Martine	Lopez	participant064@fixture.example.com	2026-05-05 16:48:50.131459+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.131459+00
65	1	Robert	Garnier	participant065@fixture.example.com	2026-05-05 16:48:50.137619+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.137619+00
67	1	Alain	Perrin	participant067@fixture.example.com	2026-05-05 16:48:50.147433+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.147433+00
68	1	Dominique	Caron	participant068@fixture.example.com	2026-05-05 16:48:50.15287+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.15287+00
69	1	Bernard	Giraud	participant069@fixture.example.com	2026-05-05 16:48:50.158114+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.158114+00
70	1	Monique	Munoz	participant070@fixture.example.com	2026-05-05 16:48:50.164414+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.164414+00
71	1	Marc	Poirier	participant071@fixture.example.com	2026-05-05 16:48:50.170143+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.170143+00
25	1	Romain	Benoit	participant025@fixture.example.com	2026-05-05 16:48:49.922187+00	scrypt1$a-K6Lip4l2xBMrF_lNGPwg$B8WLknbhyql9negDIU9uEfdm7sP-z8xlQ_bcTG4cTJh91SXuWv0IxlxS7c9wxcrPlqiJBJvMBS8yPWRtAsscFg	\N	\N	\N	\N	2026-05-05 16:48:49.922187+00
72	1	Sylvie	Pascal	participant072@fixture.example.com	2026-05-05 16:48:50.175638+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.175638+00
73	1	Frédéric	Schneider	participant073@fixture.example.com	2026-05-05 16:48:50.180765+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.180765+00
74	1	Catherine	Petit	participant074@fixture.example.com	2026-05-05 16:48:50.185634+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.185634+00
75	1	Stéphane	Simon	participant075@fixture.example.com	2026-05-05 16:48:50.190405+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.190405+00
76	1	Brigitte	Morel	participant076@fixture.example.com	2026-05-05 16:48:50.195304+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.195304+00
77	1	Gilles	Rousseau	participant077@fixture.example.com	2026-05-05 16:48:50.200435+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.200435+00
78	1	Françoise	Morin	participant078@fixture.example.com	2026-05-05 16:48:50.205804+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.205804+00
79	1	Henri	Blanc	participant079@fixture.example.com	2026-05-05 16:48:50.211871+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.211871+00
81	1	André	Rey	participant081@fixture.example.com	2026-05-05 16:48:50.221774+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.221774+00
83	1	Daniel	Gomez	participant083@fixture.example.com	2026-05-05 16:48:50.231777+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.231777+00
84	1	Chantal	Leclerc	participant084@fixture.example.com	2026-05-05 16:48:50.236762+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.236762+00
85	1	Roger	Renaud	participant085@fixture.example.com	2026-05-05 16:48:50.241651+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.241651+00
86	1	Danielle	Perrot	participant086@fixture.example.com	2026-05-05 16:48:50.246606+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.246606+00
87	1	Jacques	Lamy	participant087@fixture.example.com	2026-05-05 16:48:50.25184+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.25184+00
88	1	Simone	Gonzalez	participant088@fixture.example.com	2026-05-05 16:48:50.256492+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.256492+00
89	1	Louis	Richard	participant089@fixture.example.com	2026-05-05 16:48:50.263368+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.263368+00
90	1	Monique	Lefebvre	participant090@fixture.example.com	2026-05-05 16:48:50.268292+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.268292+00
91	1	Georges	Girard	participant091@fixture.example.com	2026-05-05 16:48:50.273616+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.273616+00
92	1	Janine	Muller	participant092@fixture.example.com	2026-05-05 16:48:50.279033+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.279033+00
93	1	René	Clement	participant093@fixture.example.com	2026-05-05 16:48:50.284076+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.284076+00
94	1	Colette	Meyer	participant094@fixture.example.com	2026-05-05 16:48:50.289035+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.289035+00
95	1	Claude	Marchand	participant095@fixture.example.com	2026-05-05 16:48:50.29402+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.29402+00
96	1	Simone	Meunier	participant096@fixture.example.com	2026-05-05 16:48:50.298848+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.298848+00
97	1	Paul	Legrand	participant097@fixture.example.com	2026-05-05 16:48:50.303865+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.303865+00
98	1	Suzanne	Martinez	participant098@fixture.example.com	2026-05-05 16:48:50.308704+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.308704+00
99	1	Marcel	Hubert	participant099@fixture.example.com	2026-05-05 16:48:50.313437+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.313437+00
100	1	Henriette	Fischer	participant100@fixture.example.com	2026-05-05 16:48:50.318005+00	\N	\N	\N	\N	\N	2026-05-05 16:48:50.318005+00
50	1	Béatrice	Barbier	participant050@fixture.example.com	2026-05-05 16:48:50.055269+00	scrypt1$89RpXACLalZM9kmt2S9CXA$LKiV15ZsN0pJ7m-n6ysBcapgDheWCAEi12VS3TPuEVcXrhNFqFDHg1hzx7QYhNIw6_eCQZMGKOJO-mz4LmUmhA	\N	\N	\N	\N	2026-05-05 16:48:50.055269+00
80	1	Jacqueline	Arnaud	participant080@fixture.example.com	2026-05-05 16:48:50.21688+00	scrypt1$aFmMWZF9DyLev7PBEUJIFQ$4lM8B6REs5sfAW520r6MqQTkneu_IZ9Dou1Vovnz07iE_jtm-01UxsrxZ8pncHPaRTnE0eXSXmKD00uDRhEJvQ	\N	\N	\N	\N	2026-05-05 16:48:50.21688+00
82	1	Madeleine	Baron	participant082@fixture.example.com	2026-05-05 16:48:50.226372+00	scrypt1$tiqCX3h01WZmK7ueBhv0Vw$eqCG_IfC06Shu6zpfDZvuCeGrH1h47xbzX4Mm9wTd30yYkyWwU6Cmja-Y8Lm1y7CXD4f8_EmJ3JPh1STBbNK4g	\N	\N	\N	\N	2026-05-05 16:48:50.226372+00
59	1	Philippe	Bernard	participant059@fixture.example.com	2026-05-05 16:48:50.102313+00	scrypt1$MtzglNWxnoC24OpeOSrGxg$YtUtYAJq45UXEFsReSeRaGIEEGUEOM8wwK0AcuVORjGQ-wrOFAKTHsTDG9OOt_jcRj2FrRcoPh2pcdwfveXTpg	\N	\N	\N	\N	2026-05-05 16:48:50.102313+00
66	1	Nadine	Andre	participant066@fixture.example.com	2026-05-05 16:48:50.142706+00	scrypt1$ZzCQ_HYqrJQFIEO34cWTDg$YHU0zPqA7tfN2qvTXslmyJdBHH13MtFoxSyhCa7QNT7IZpP9nUYxpAWY-l2vof-1CdLestg_P4p9G31MLPeQMQ	\N	\N	\N	\N	2026-05-05 17:27:55.273334+00
\.


--
-- Data for Name: questionnaire_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questionnaire_responses (id, participant_id, invite_token_id, questionnaire_id, name, email, organisation, submitted_at, submission_kind, subject_participant_id, rater_participant_id, campaign_id, rated_participant_id) FROM stdin;
1	25	\N	B	Nadine Andre	participant025@fixture.example.com	Orange	2026-05-05 17:14:46.284582+00	peer_rating	25	\N	1	66
2	59	\N	B	Nadine Andre	participant059@fixture.example.com	Orange	2026-05-05 17:16:04.557847+00	peer_rating	59	\N	1	66
3	66	\N	B	Jacqueline Arnaud	participant066@fixture.example.com	Orange	2026-05-05 17:28:40.69591+00	peer_rating	66	\N	1	80
4	66	\N	B	Nadine Andre	participant066@fixture.example.com	Orange	2026-05-05 17:31:40.929893+00	self_rating	66	66	1	\N
5	66	\N	B	Nadine Andre	participant066@fixture.example.com	Orange	2026-05-05 17:36:09.71907+00	element_humain	66	66	1	\N
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, subject_type, subject_id, token_hash, family_id, expires_at, used_at, replaced_by_id, revoked_at, created_at) FROM stdin;
1	admin	0	c1726686ed4c3b2da85066bdf98917c063171d91377d646311b7a9fd4df6d330	30572db7-f8a9-4c16-ae33-5fc7ef94f7bb	2026-06-04 16:34:12.219+00	2026-05-05 16:49:12.859+00	2	2026-05-05 16:51:31.775+00	2026-05-05 16:34:12.24737+00
2	admin	0	2b285894d6c2740638f11310b2dd8f79cf23242cfe07c6a8ec95a8424d89394d	30572db7-f8a9-4c16-ae33-5fc7ef94f7bb	2026-06-04 16:49:12.859+00	\N	\N	2026-05-05 16:51:31.775+00	2026-05-05 16:49:12.865651+00
3	participant	50	66e1154badf1478586f9059d67ea51ed3b9b3d530cfac617cc13a1c9163742ef	1eabe8bf-95e1-4b7d-878a-0cc9e7953a24	2026-06-04 17:03:14.787+00	\N	\N	2026-05-05 17:10:16.725+00	2026-05-05 17:03:14.795021+00
4	participant	80	4eae186fd7dc9752617386dddc36782a222868763dd10c4534537cb09fd1167a	66b682c0-fb6d-4fbf-bab3-f32e41753beb	2026-06-04 17:10:51.614+00	\N	\N	2026-05-05 17:11:14.143+00	2026-05-05 17:10:51.615298+00
5	participant	66	649e68342e0c7634bf6e3dc0bbdc1746da0acc7f729ecb2ca67ea77df919bf8a	88b28309-1981-488b-86a0-5dd37a9d5e08	2026-06-04 17:11:27.226+00	\N	\N	2026-05-05 17:11:39.665+00	2026-05-05 17:11:27.226934+00
6	admin	0	edb61ebacddd920aafda27fcb6f470f7f50e1b82a3f4604109eb5adbc18f1fe1	33cbf804-d58c-4cfa-a9ff-ce77ca01ec5c	2026-06-04 17:11:46.683+00	\N	\N	2026-05-05 17:13:08.726+00	2026-05-05 17:11:46.686163+00
7	participant	82	ca9c69f30c269abe558e89bae5f190d756cdab208203312c2d4aa8dd0c33914d	66dd8657-a641-491e-97db-08f00dcc6a50	2026-06-04 17:13:44.163+00	\N	\N	2026-05-05 17:13:54.236+00	2026-05-05 17:13:44.166494+00
8	participant	25	054910109c00a323d94749344085d619a85e79729f31327ccc69be22e8d626d1	7c52887f-b05f-4f72-8f38-33444ddc832d	2026-06-04 17:14:11.678+00	\N	\N	2026-05-05 17:15:22.651+00	2026-05-05 17:14:11.681364+00
9	participant	59	59775aaf905e17558ae89a207d8280995b1641e32df6aae5d6f224f30cecb68f	e51e1d28-3beb-464d-b399-875019bdf0d5	2026-06-04 17:15:41.331+00	\N	\N	2026-05-05 17:16:11.1+00	2026-05-05 17:15:41.334473+00
10	admin	0	8c0397f5b5e189f8acede6e5d1ee0c5a6f190911892725a1f142603fad21c3fb	68bf4dfe-e790-4d22-aa1e-eefb8574c6ce	2026-06-04 17:17:38.975+00	\N	\N	2026-05-05 17:20:12.817+00	2026-05-05 17:17:38.98031+00
11	participant	25	8135d5ff60c8a9268ccf72ba531caba9db0427f90e67d04103144f35e6dd7918	084b4ac0-54a3-44df-905d-fdf7db6a8722	2026-06-04 17:27:09.371+00	\N	\N	\N	2026-05-05 17:27:09.37333+00
12	participant	50	cb29efd4e2b3f0cfe25a06af7da9ef56765c3ca5c15f24cd955f4e1f951a10a5	fa9b5be7-9355-43c2-aaa4-d6f251d8fb06	2026-06-04 17:27:09.816+00	\N	\N	\N	2026-05-05 17:27:09.81892+00
13	participant	59	b8931766fd8122cc377397dcdb2a7feac2057db7f1350c8cddb5075a60f31c2b	f9f138e9-a6d8-4c2d-88bc-f8247670daeb	2026-06-04 17:27:10.207+00	\N	\N	\N	2026-05-05 17:27:10.210052+00
14	participant	80	750aabc7d9f805a6720bb81cc4ffa6658562550d7e785d04b7cadd4d539e8c19	397b3b70-a49c-4899-8f57-445b1f35f2a7	2026-06-04 17:27:11.164+00	\N	\N	\N	2026-05-05 17:27:11.167632+00
15	participant	82	bb286b0b561a1152780044fa505ebade611ca5bbca836d214950030cbe8415ca	ef2f5365-05de-4e90-85de-4bb4c0c3af3f	2026-06-04 17:27:11.717+00	\N	\N	\N	2026-05-05 17:27:11.721524+00
16	participant	66	0bb4547e53796a8ee9187da232b88f762a7894b6323b21edbc9b7892d6913caf	648a94bd-4fc3-4ae0-afeb-66d963daf34d	2026-06-04 17:27:55.543+00	\N	\N	\N	2026-05-05 17:27:55.545875+00
17	participant	66	27ab7a01a48f1128065767fac3893309f42d54f1b37590ee4e24fc7ac09a3fca	f089299f-08e0-49cd-800c-e7f16549737e	2026-06-04 17:28:07.883+00	\N	\N	\N	2026-05-05 17:28:07.886355+00
\.


--
-- Data for Name: scores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scores (id, response_id, score_key, value) FROM stdin;
1	1	11	4
2	1	12	6
3	1	13	5
4	1	14	4
5	1	21	7
6	1	22	5
7	1	23	4
8	1	24	6
9	1	31	4
10	1	32	6
11	1	33	5
12	1	34	8
13	2	11	3
14	2	12	6
15	2	13	5
16	2	14	4
17	2	21	4
18	2	22	5
19	2	23	6
20	2	24	7
21	2	31	1
22	2	32	2
23	2	33	3
24	2	34	4
25	3	11	1
26	3	12	2
27	3	13	3
28	3	14	4
29	3	21	5
30	3	22	6
31	3	23	7
32	3	24	8
33	3	31	9
34	3	32	8
35	3	33	7
36	3	34	6
37	4	11	2
38	4	12	3
39	4	13	2
40	4	14	3
41	4	21	2
42	4	22	3
43	4	23	2
44	4	24	3
45	4	31	2
46	4	32	3
47	4	33	2
48	4	34	3
49	5	11	3
50	5	12	1
51	5	13	7
52	5	14	3
53	5	21	7
54	5	22	5
55	5	23	8
56	5	24	7
57	5	31	4
58	5	32	3
59	5	33	5
60	5	34	5
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 15, true);


--
-- Name: audit_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_events_id_seq', 42, true);


--
-- Name: campaign_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.campaign_participants_id_seq', 17, true);


--
-- Name: campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.campaigns_id_seq', 1, true);


--
-- Name: coaches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coaches_id_seq', 2, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.companies_id_seq', 1, true);


--
-- Name: invite_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invite_tokens_id_seq', 6, true);


--
-- Name: participant_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.participant_progress_id_seq', 5, true);


--
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.participants_id_seq', 100, true);


--
-- Name: questionnaire_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questionnaire_responses_id_seq', 5, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 17, true);


--
-- Name: scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scores_id_seq', 60, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_events audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_events
    ADD CONSTRAINT audit_events_pkey PRIMARY KEY (id);


--
-- Name: campaign_participants campaign_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_pkey PRIMARY KEY (id);


--
-- Name: campaign_participants campaign_participants_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_unique UNIQUE (campaign_id, participant_id);


--
-- Name: campaigns campaigns_company_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_company_name_unique UNIQUE (company_id, name);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: coaches coaches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches
    ADD CONSTRAINT coaches_pkey PRIMARY KEY (id);


--
-- Name: coaches coaches_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coaches
    ADD CONSTRAINT coaches_username_unique UNIQUE (username);


--
-- Name: companies companies_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_name_unique UNIQUE (name);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: invite_tokens invite_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_pkey PRIMARY KEY (id);


--
-- Name: invite_tokens invite_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_token_unique UNIQUE (token);


--
-- Name: participant_progress participant_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_progress
    ADD CONSTRAINT participant_progress_pkey PRIMARY KEY (id);


--
-- Name: participant_progress participant_progress_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_progress
    ADD CONSTRAINT participant_progress_unique UNIQUE (campaign_id, participant_id);


--
-- Name: participants participants_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_email_unique UNIQUE (email);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: questionnaire_responses questionnaire_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: scores scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_pkey PRIMARY KEY (id);


--
-- Name: scores scores_response_id_score_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_response_id_score_key_unique UNIQUE (response_id, score_key);


--
-- Name: audit_events_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_action_idx ON public.audit_events USING btree (action);


--
-- Name: audit_events_actor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_actor_idx ON public.audit_events USING btree (actor_type, actor_id);


--
-- Name: audit_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_created_at_idx ON public.audit_events USING btree (created_at);


--
-- Name: audit_events_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_events_resource_idx ON public.audit_events USING btree (resource_type, resource_id);


--
-- Name: campaign_participants_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_participants_campaign_id_idx ON public.campaign_participants USING btree (campaign_id);


--
-- Name: campaign_participants_participant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaign_participants_participant_id_idx ON public.campaign_participants USING btree (participant_id);


--
-- Name: campaigns_coach_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_coach_id_idx ON public.campaigns USING btree (coach_id);


--
-- Name: campaigns_company_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_company_id_idx ON public.campaigns USING btree (company_id);


--
-- Name: campaigns_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX campaigns_status_idx ON public.campaigns USING btree (status);


--
-- Name: coaches_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX coaches_username_idx ON public.coaches USING btree (username);


--
-- Name: invite_tokens_active_campaign_assignment_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invite_tokens_active_campaign_assignment_unique ON public.invite_tokens USING btree (participant_id, campaign_id, questionnaire_id) WHERE ((is_active = true) AND (used_at IS NULL) AND (campaign_id IS NOT NULL));


--
-- Name: invite_tokens_active_standalone_assignment_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invite_tokens_active_standalone_assignment_unique ON public.invite_tokens USING btree (participant_id, questionnaire_id) WHERE ((is_active = true) AND (used_at IS NULL) AND (campaign_id IS NULL));


--
-- Name: invite_tokens_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_tokens_campaign_id_idx ON public.invite_tokens USING btree (campaign_id);


--
-- Name: invite_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invite_tokens_token_idx ON public.invite_tokens USING btree (token);


--
-- Name: participant_progress_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_progress_campaign_id_idx ON public.participant_progress USING btree (campaign_id);


--
-- Name: participant_progress_participant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participant_progress_participant_id_idx ON public.participant_progress USING btree (participant_id);


--
-- Name: participants_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX participants_email_idx ON public.participants USING btree (email);


--
-- Name: questionnaire_responses_campaign_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX questionnaire_responses_campaign_id_idx ON public.questionnaire_responses USING btree (campaign_id);


--
-- Name: questionnaire_responses_questionnaire_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX questionnaire_responses_questionnaire_id_idx ON public.questionnaire_responses USING btree (questionnaire_id);


--
-- Name: questionnaire_responses_rated_participant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX questionnaire_responses_rated_participant_id_idx ON public.questionnaire_responses USING btree (rated_participant_id);


--
-- Name: questionnaire_responses_rater_participant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX questionnaire_responses_rater_participant_id_idx ON public.questionnaire_responses USING btree (rater_participant_id);


--
-- Name: questionnaire_responses_subject_participant_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX questionnaire_responses_subject_participant_id_idx ON public.questionnaire_responses USING btree (subject_participant_id);


--
-- Name: questionnaire_responses_submission_kind_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX questionnaire_responses_submission_kind_idx ON public.questionnaire_responses USING btree (submission_kind);


--
-- Name: questionnaire_responses_unique_element_humain; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX questionnaire_responses_unique_element_humain ON public.questionnaire_responses USING btree (campaign_id, questionnaire_id, subject_participant_id) WHERE ((submission_kind = 'element_humain'::public.submission_kind) AND (campaign_id IS NOT NULL) AND (subject_participant_id IS NOT NULL));


--
-- Name: questionnaire_responses_unique_peer_rating_target; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX questionnaire_responses_unique_peer_rating_target ON public.questionnaire_responses USING btree (campaign_id, questionnaire_id, subject_participant_id, rated_participant_id) WHERE ((submission_kind = 'peer_rating'::public.submission_kind) AND (campaign_id IS NOT NULL) AND (subject_participant_id IS NOT NULL) AND (rated_participant_id IS NOT NULL));


--
-- Name: questionnaire_responses_unique_self_rating; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX questionnaire_responses_unique_self_rating ON public.questionnaire_responses USING btree (campaign_id, questionnaire_id, subject_participant_id) WHERE ((submission_kind = 'self_rating'::public.submission_kind) AND (campaign_id IS NOT NULL) AND (subject_participant_id IS NOT NULL));


--
-- Name: refresh_tokens_family_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_family_idx ON public.refresh_tokens USING btree (family_id);


--
-- Name: refresh_tokens_subject_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_subject_idx ON public.refresh_tokens USING btree (subject_type, subject_id);


--
-- Name: refresh_tokens_token_hash_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_unique ON public.refresh_tokens USING btree (token_hash);


--
-- Name: scores_response_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scores_response_id_idx ON public.scores USING btree (response_id);


--
-- Name: campaign_participants campaign_participants_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_participants campaign_participants_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaign_participants
    ADD CONSTRAINT campaign_participants_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: campaigns campaigns_coach_id_coaches_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_coach_id_coaches_id_fk FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE RESTRICT;


--
-- Name: campaigns campaigns_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invite_tokens invite_tokens_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;


--
-- Name: invite_tokens invite_tokens_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_tokens
    ADD CONSTRAINT invite_tokens_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: participant_progress participant_progress_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_progress
    ADD CONSTRAINT participant_progress_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: participant_progress participant_progress_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participant_progress
    ADD CONSTRAINT participant_progress_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;


--
-- Name: participants participants_company_id_companies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: questionnaire_responses questionnaire_responses_campaign_id_campaigns_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_campaign_id_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;


--
-- Name: questionnaire_responses questionnaire_responses_invite_token_id_invite_tokens_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_invite_token_id_invite_tokens_id_fk FOREIGN KEY (invite_token_id) REFERENCES public.invite_tokens(id);


--
-- Name: questionnaire_responses questionnaire_responses_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: questionnaire_responses questionnaire_responses_rated_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_rated_participant_id_participants_id_fk FOREIGN KEY (rated_participant_id) REFERENCES public.participants(id);


--
-- Name: questionnaire_responses questionnaire_responses_rater_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_rater_participant_id_participants_id_fk FOREIGN KEY (rater_participant_id) REFERENCES public.participants(id);


--
-- Name: questionnaire_responses questionnaire_responses_subject_participant_id_participants_id_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionnaire_responses
    ADD CONSTRAINT questionnaire_responses_subject_participant_id_participants_id_ FOREIGN KEY (subject_participant_id) REFERENCES public.participants(id);


--
-- Name: refresh_tokens refresh_tokens_replaced_by_id_refresh_tokens_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_replaced_by_id_refresh_tokens_id_fk FOREIGN KEY (replaced_by_id) REFERENCES public.refresh_tokens(id) ON DELETE SET NULL;


--
-- Name: scores scores_response_id_questionnaire_responses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scores
    ADD CONSTRAINT scores_response_id_questionnaire_responses_id_fk FOREIGN KEY (response_id) REFERENCES public.questionnaire_responses(id);


--
-- PostgreSQL database dump complete
--

\unrestrict bbS0hL4NbR17a5FnFNOaoY5XZ6GjiYMRIJ1jdgo4GpWwyGtQbkXkeQN32HEq0WV

