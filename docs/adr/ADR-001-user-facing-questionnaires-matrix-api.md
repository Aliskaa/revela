# ADR-001: User-facing questionnaires and participant score matrix API

## Status

Accepted

## Date

2026-04-03

## Context

The product distinguishes three submission kinds for the same questionnaire catalog keys (`short_labels` / score keys): scientific test (`element_humain`), self-rating (`self_rating`), and peer feedback (`peer_rating`). Operators need a single read model to compare columns (self, up to five peers, scientific) per subject. Questionnaire **C** must remain in the catalog for legacy or tooling but must not appear in public flows or new invitations.

## Decision

1. **Catalog helpers** ([`packages/aor-questionnaires/src/index.ts`](../../packages/aor-questionnaires/src/index.ts)): export `QUESTIONNAIRE_IDS_EXCLUDED_FROM_USER_FLOWS`, `isQuestionnaireUserFacing`, and `listQuestionnairesSummaryForUserApp()` to centralise which questionnaires appear in participant-facing APIs.
2. **Public API**: `GET /api/questionnaires` and `GET /api/questionnaires/:qid` use the user-facing list and reject non-user-facing ids (e.g. **C**) with the same not-found behaviour as unknown ids. Anonymous `POST .../submit` rejects non-user-facing questionnaires. Admin invite creation and CSV import invitations use `isQuestionnaireUserFacing`; existing invite tokens for **C** may still be consumed.
3. **Matrix read model**: `GET /api/admin/participants/:participantId/matrix?qid=` (authenticated) returns a denormalised DTO: rows keyed by `score_key`, columns for latest `self_rating`, latest `element_humain`, and up to five most recent `peer_rating` responses for that subject and questionnaire. Implementation: [`GetParticipantQuestionnaireMatrixUseCase`](../../applications/backend/src/application/participant/get-participant-questionnaire-matrix.usecase.ts) and [`listForSubjectQuestionnaireMatrix`](../../applications/backend/src/infrastructure/database/repositories/drizzle-responses.repository.ts).
4. **Admin UI**: A dedicated route renders a container with **table** and **chart** modes fed by the same DTO ([`ParticipantQuestionnaireMatrix`](../../applications/frontend/src/components/matrix/ParticipantQuestionnaireMatrix.tsx)).

## Consequences

- **Easier reporting**: One endpoint supports spreadsheet-style and graphic views without duplicating merge logic in the client.
- **Clear boundary**: Hiding **C** is policy-driven in `@aor/questionnaires`; new exclusions are a one-line catalog change.
- **Peer ordering**: The matrix uses the five most recent peer submissions (chronological columns); changing ordering rules is a use-case change only.

## Alternatives Considered

- **Client-side merge only**: Rejected — would require loading all responses and duplicating business rules in the frontend.
- **Remove C from `catalog.json`**: Rejected — would break scoring types and historical data expectations; exclusion list preserves compatibility.

## References

- Prior exploration (closed): [2026-04-03-DONE-user-study-profile-matrix-and-data-model.md](../prospective/2026-04-03-DONE-user-study-profile-matrix-and-data-model.md)
- Package boundaries (still open): [2026-04-03-NEW-aor-scoring-and-questionnaires-package-boundaries.md](../prospective/2026-04-03-NEW-aor-scoring-and-questionnaires-package-boundaries.md)
