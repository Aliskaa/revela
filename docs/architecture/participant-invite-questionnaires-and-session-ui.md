# Participant session: questionnaires from invites and home UI

**Date (implementation snapshot):** 2026-04-04  

This note records **what was implemented** so future changes do not lose context. Product intent: questionnaires available to a logged-in participant are those **attached to invitation tokens** for that participant (admin chooses the questionnaire per invite). Participants may have **multiple** distinct questionnaires when several invites exist.

## Behaviour summary

| Area | Rule |
|------|------|
| **Source of truth** | Rows in [`invite_tokens`](../../packages/aor-drizzle/src/schema/invite-token.schema.ts) for the participant’s `participant_id`. |
| **Listed questionnaires** | Distinct `questionnaire_id` values, ordered by **latest activity per questionnaire**: `max(created_at, used_at)` descending (see repository below). |
| **`GET /api/participant/me`** | Returns `assigned_questionnaire_ids: string[]` (snake_case JSON). |
| **`GET /api/participant/matrix`** | Query `qid` optional when only one assigned questionnaire; otherwise must be one of the allowed ids. Reuses the same matrix DTO as admin ([ADR-001](../adr/ADR-001-user-facing-questionnaires-matrix-api.md)). Invalid `qid` → **403** ([`ParticipantQuestionnaireNotAllowedError`](../../applications/backend/src/domain/participant/participant-session.errors.ts)). No invites → **404** ([`ParticipantAssignedQuestionnaireMissingError`](../../applications/backend/src/domain/participant/participant-session.errors.ts)). |
| **`POST /api/participant/questionnaires/:qid/submit`** | If the participant has **at least one** invite-derived questionnaire id, `qid` must match **one** of them; otherwise **400** ([`SubmitParticipantQuestionnaireUseCase`](../../applications/backend/src/application/responses/submit-participant-questionnaire.usecase.ts)). If there are **no** invite rows, submission is not restricted by this list (legacy path). |
| **Participant home (`/`)** | One card per assigned questionnaire; matrix section with a **selector** when more than one id exists. |
| **Questionnaire route** | If `assigned_questionnaire_ids` is non-empty and the URL `qid` is not in the list, redirect to the **first** allowed id. |

## Backend pointers

| Concern | Location |
|---------|----------|
| List distinct questionnaire ids from invites | [`listQuestionnaireIdsFromInvitesForParticipant`](../../applications/backend/src/infrastructure/database/repositories/drizzle-participants.repository.ts) on [`IParticipantsRepositoryPort`](../../applications/backend/src/interfaces/participants/IParticipantsRepository.port.ts) |
| Session payload | [`GetParticipantMeUseCase`](../../applications/backend/src/application/participant/get-participant-me.usecase.ts) |
| Matrix for self | [`GetParticipantSessionQuestionnaireMatrixUseCase`](../../applications/backend/src/application/participant/get-participant-session-questionnaire-matrix.usecase.ts) |
| HTTP | [`ParticipantController`](../../applications/backend/src/presentation/participant/participant.controller.ts) (`me`, `matrix`, `submit`) |
| Exception mapping for `me` / `matrix` | [`ParticipantSessionExceptionFilter`](../../applications/backend/src/presentation/participant/participant-session-exception.filter.ts) |
| DI (matrix use case shared logic with admin) | [`ParticipantModule`](../../applications/backend/src/presentation/participant/participant.module.ts) provides [`GetParticipantQuestionnaireMatrixUseCase`](../../applications/backend/src/application/participant/get-participant-questionnaire-matrix.usecase.ts) via [`GET_PARTICIPANT_QUESTIONNAIRE_MATRIX_USE_CASE_SYMBOL`](../../applications/backend/src/presentation/admin/admin.tokens.ts) |

## Frontend pointers

| Concern | Location |
|---------|----------|
| Types | [`ParticipantMe`](../../applications/frontend/src/api/types.ts) (`assigned_questionnaire_ids`) |
| API hooks | [`participantSession.ts`](../../applications/frontend/src/api/participantSession.ts) (`useParticipantMe`, `useParticipantSessionMatrix` with `qid`) |
| Home UI | [`routes/index.tsx`](../../applications/frontend/src/routes/index.tsx) |
| Questionnaire guard | [`routes/questionnaire.$qid.tsx`](../../applications/frontend/src/routes/questionnaire.$qid.tsx) |
| Matrix display reuse | [`QuestionnaireMatrixDisplay`](../../applications/frontend/src/components/matrix/QuestionnaireMatrixDisplay.tsx) |
| Cache invalidation after login / invite activation | [`participantAuth.ts`](../../applications/frontend/src/api/participantAuth.ts), [`invitations.ts`](../../applications/frontend/src/api/invitations.ts) → `participantSessionKeys.matrixRoot` |

## Living references to keep in sync

- [Application routes and API map](./application-routes-and-api-map.md) — endpoint table and diagram.
- [ADR-001: User-facing questionnaires and participant score matrix API](../adr/ADR-001-user-facing-questionnaires-matrix-api.md) — matrix DTO and exclusions (e.g. questionnaire **C**).
- [Prospective: participant invitation token and mandatory auth](../prospective/2026-04-04-NEW-participant-invitation-token-and-mandatory-auth.md) — broader product and gaps.

When you change invite semantics, questionnaire eligibility, or participant home behaviour, update **this file** and the **application routes map** as needed.
