-- V1 hardening: normalize legacy data for campaign-aware flow without regressions.

-- 1) Backfill response campaign from invite token when missing.
UPDATE "questionnaire_responses" qr
SET "campaign_id" = it."campaign_id"
FROM "invite_tokens" it
WHERE qr."invite_token_id" = it."id"
  AND qr."campaign_id" IS NULL
  AND it."campaign_id" IS NOT NULL;

-- 2) Backfill invite token campaign from existing responses when missing.
WITH response_campaign_by_token AS (
  SELECT DISTINCT ON (qr."invite_token_id")
    qr."invite_token_id" AS token_id,
    qr."campaign_id" AS campaign_id
  FROM "questionnaire_responses" qr
  WHERE qr."invite_token_id" IS NOT NULL
    AND qr."campaign_id" IS NOT NULL
  ORDER BY qr."invite_token_id", qr."submitted_at" DESC NULLS LAST, qr."id" DESC
)
UPDATE "invite_tokens" it
SET "campaign_id" = rcbt."campaign_id"
FROM response_campaign_by_token rcbt
WHERE it."id" = rcbt.token_id
  AND it."campaign_id" IS NULL;

-- 3) Ensure participant-campaign links exist from invites and responses.
INSERT INTO "campaign_participants" ("campaign_id", "participant_id", "invited_at", "joined_at", "created_at", "updated_at")
SELECT
  it."campaign_id",
  it."participant_id",
  it."created_at",
  CASE WHEN it."used_at" IS NOT NULL THEN it."used_at" ELSE NULL END,
  now(),
  now()
FROM "invite_tokens" it
WHERE it."campaign_id" IS NOT NULL
ON CONFLICT ("campaign_id", "participant_id") DO UPDATE
SET
  "invited_at" = COALESCE("campaign_participants"."invited_at", EXCLUDED."invited_at"),
  "joined_at" = COALESCE("campaign_participants"."joined_at", EXCLUDED."joined_at"),
  "updated_at" = now();

INSERT INTO "campaign_participants" ("campaign_id", "participant_id", "joined_at", "created_at", "updated_at")
SELECT DISTINCT
  qr."campaign_id",
  qr."participant_id",
  qr."submitted_at",
  now(),
  now()
FROM "questionnaire_responses" qr
WHERE qr."campaign_id" IS NOT NULL
  AND qr."participant_id" IS NOT NULL
ON CONFLICT ("campaign_id", "participant_id") DO UPDATE
SET
  "joined_at" = COALESCE("campaign_participants"."joined_at", EXCLUDED."joined_at"),
  "updated_at" = now();

-- 4) Initialize and reconcile participant progression from existing submissions.
WITH response_flags AS (
  SELECT
    qr."campaign_id",
    qr."participant_id",
    bool_or(qr."submission_kind" = 'self_rating') AS has_self_rating,
    bool_or(qr."submission_kind" = 'peer_rating') AS has_peer_rating,
    bool_or(qr."submission_kind" = 'element_humain') AS has_element_humain,
    max(CASE WHEN qr."submission_kind" = 'self_rating' THEN qr."submitted_at" ELSE NULL END) AS self_rating_completed_at,
    max(CASE WHEN qr."submission_kind" = 'peer_rating' THEN qr."submitted_at" ELSE NULL END) AS peer_feedback_completed_at,
    max(CASE WHEN qr."submission_kind" = 'element_humain' THEN qr."submitted_at" ELSE NULL END) AS element_humain_completed_at
  FROM "questionnaire_responses" qr
  WHERE qr."campaign_id" IS NOT NULL
    AND qr."participant_id" IS NOT NULL
  GROUP BY qr."campaign_id", qr."participant_id"
)
INSERT INTO "participant_progress" (
  "campaign_id",
  "participant_id",
  "self_rating_status",
  "peer_feedback_status",
  "element_humain_status",
  "results_status",
  "self_rating_completed_at",
  "peer_feedback_completed_at",
  "element_humain_completed_at",
  "created_at",
  "updated_at"
)
SELECT
  cp."campaign_id",
  cp."participant_id",
  CASE WHEN rf.has_self_rating THEN 'completed'::"participant_step_status" ELSE 'pending'::"participant_step_status" END,
  CASE WHEN rf.has_peer_rating THEN 'completed'::"participant_step_status" ELSE 'pending'::"participant_step_status" END,
  CASE
    WHEN rf.has_element_humain THEN 'completed'::"participant_step_status"
    WHEN COALESCE(rf.has_self_rating, false) AND COALESCE(rf.has_peer_rating, false) THEN 'pending'::"participant_step_status"
    ELSE 'locked'::"participant_step_status"
  END,
  'locked'::"participant_step_status",
  rf.self_rating_completed_at,
  rf.peer_feedback_completed_at,
  rf.element_humain_completed_at,
  now(),
  now()
FROM "campaign_participants" cp
LEFT JOIN response_flags rf
  ON rf."campaign_id" = cp."campaign_id"
 AND rf."participant_id" = cp."participant_id"
ON CONFLICT ("campaign_id", "participant_id") DO UPDATE
SET
  "self_rating_status" = CASE
    WHEN COALESCE(EXCLUDED."self_rating_status", "participant_progress"."self_rating_status") = 'completed'::"participant_step_status"
      THEN 'completed'::"participant_step_status"
    ELSE "participant_progress"."self_rating_status"
  END,
  "peer_feedback_status" = CASE
    WHEN COALESCE(EXCLUDED."peer_feedback_status", "participant_progress"."peer_feedback_status") = 'completed'::"participant_step_status"
      THEN 'completed'::"participant_step_status"
    ELSE "participant_progress"."peer_feedback_status"
  END,
  "element_humain_status" = CASE
    WHEN COALESCE(EXCLUDED."element_humain_status", "participant_progress"."element_humain_status") = 'completed'::"participant_step_status"
      THEN 'completed'::"participant_step_status"
    WHEN "participant_progress"."element_humain_status" = 'locked'::"participant_step_status"
      AND COALESCE(EXCLUDED."self_rating_status", "participant_progress"."self_rating_status") = 'completed'::"participant_step_status"
      AND COALESCE(EXCLUDED."peer_feedback_status", "participant_progress"."peer_feedback_status") = 'completed'::"participant_step_status"
      THEN 'pending'::"participant_step_status"
    ELSE "participant_progress"."element_humain_status"
  END,
  "self_rating_completed_at" = COALESCE("participant_progress"."self_rating_completed_at", EXCLUDED."self_rating_completed_at"),
  "peer_feedback_completed_at" = COALESCE("participant_progress"."peer_feedback_completed_at", EXCLUDED."peer_feedback_completed_at"),
  "element_humain_completed_at" = COALESCE("participant_progress"."element_humain_completed_at", EXCLUDED."element_humain_completed_at"),
  "updated_at" = now();
