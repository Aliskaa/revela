# Revela V1 framing gap analysis

**Date:** 2026-04-06

This document compares the current implementation with the framing expectations from **"Cadrage du besoin V1 — Projet Revela"** and turns the analysis into actionable delivery steps.

## Scope and intent

- Input baseline: `[Cadrage projet Revela v1.pdf](file:///c:/Users/kevin/Downloads/Cadrage%20projet%20Revela%20v1.pdf)`.
- Codebase baseline: participant and admin flows implemented in this repository.
- Goal: identify what is already compliant, what is partially covered, and what remains to build.

## Compliance matrix

### 1) Product vision and value proposition


| Framing expectation                                                             | Current implementation                                                                                                                                                                                                                                                                                                                  | Gap level | What remains                                                                                                   |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| Dedicated ICO/Schutz-oriented platform experience                               | Dedicated participant shell and Revela-themed journey are implemented in `[applications/frontend/src/components/revela/ParticipantRevelaShell.tsx](../../applications/frontend/src/components/revela/ParticipantRevelaShell.tsx)` and `[applications/frontend/src/routes/index.tsx](../../applications/frontend/src/routes/index.tsx)`. | Partial   | Align naming and branding consistently across all admin/public screens and communications.                     |
| Digital coaching process with reusable data over time                           | Responses are persisted and queryable; participant matrix combines self/peer/scientific data in `[applications/backend/src/application/participant/get-participant-questionnaire-matrix.usecase.ts](../../applications/backend/src/application/participant/get-participant-questionnaire-matrix.usecase.ts)`.                                       | Partial   | Add explicit longitudinal views (evolution over time), not only latest-state matrix snapshots.                 |
| Analytical value focused on "gaps" (self vs peer vs test; expressed vs desired) | Matrix data exists and questionnaire structure supports dual-series scoring.                                                                                                                                                                                                                                                            | Partial   | Add first-class "gap" UX and domain-level metrics (including explicit zero-gap presentation where needed).     |
| Non-judgmental positioning (no "good/bad score" framing)                        | Participant copy already explains non-judgmental interpretation on home cards in `[applications/frontend/src/routes/index.tsx](../../applications/frontend/src/routes/index.tsx)`.                                                                                                                                                      | Partial   | Revisit semantic color usage (for example, success-green completion markers) if strict neutrality is required. |


### 2) Questionnaires and scoring model


| Framing expectation                            | Current implementation                                                                                                                                          | Gap level | What remains                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Questionnaire passation: 54 questions x2       | Implemented in catalog `B` with two 54-question series in `[packages/aor-questionnaires/src/catalog.json](../../packages/aor-questionnaires/src/catalog.json)`. | Done      | Keep as reference baseline.                                                                         |
| Three dimensions aligned with framing language | Three dimensions are present in catalog.                                                                                                                        | Partial   | Harmonize naming ("Ouverture" in framing vs "Affection" in catalog) and ensure UI copy consistency. |
| Access to user-facing questionnaires only      | User-facing filtering exists via `[packages/aor-questionnaires/src/index.ts](../../packages/aor-questionnaires/src/index.ts)`.                                  | Done      | Keep exclusions synchronized with product decisions.                                                |


### 3) User profiles and access boundaries


| Framing expectation                                                             | Current implementation                                                                                                                                         | Gap level | What remains                                                                                                   |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| Four distinct profiles (participant, cabinet/super-admin, campaign admin, etc.) | JWT currently distinguishes only `admin` and `participant` (see `[docs/architecture/application-routes-and-api-map.md](./application-routes-and-api-map.md)`). | High      | Introduce role model extension and permission boundaries (super-admin, campaign admin, optionally coach role). |
| Strict data-space separation by profile                                         | Admin and participant guard separation exists.                                                                                                                 | Partial   | Add campaign-level and tenant-like data isolation rules once campaign domain exists.                           |


### 4) Operational journey and onboarding flow


| Framing expectation                                                                           | Current implementation                                                                                                                                                                        | Gap level | What remains                                                                                                               |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Invitation email link to platform                                                             | Public invite flow and activation path exist in `[applications/frontend/src/routes/invite.$token.tsx](../../applications/frontend/src/routes/invite.$token.tsx)` and related invitation APIs. | Done      | Keep activation and auth UX polished.                                                                                      |
| Prefilled participant fields (name, email, organisation, direction, service, function levels) | Core identity fields are present in participant payloads.                                                                                                                                     | High      | Extend participant model and CSV ingestion to include direction, service, function-level hierarchy, and campaign metadata. |
| CSV import by admin with campaign context                                                     | CSV import exists in `[applications/backend/src/application/admin/participants/import-participants-csv.usecase.ts](../../applications/backend/src/application/admin/participants/import-participants-csv.usecase.ts)`.  | High      | Add campaign-aware import schema and lifecycle linkage (campaign name/id, dates, settings).                                |


### 5) Step gating and peer feedback requirements


| Framing expectation                      | Current implementation                                                                                                                                                                                                                         | Gap level | What remains                                                                                                                                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test locked until self + peer completion | Gating logic is implemented in participant home cards in `[applications/frontend/src/routes/index.tsx](../../applications/frontend/src/routes/index.tsx)`.                                                                                     | Partial   | Move gating settings from hardcoded UI values to configurable campaign/questionnaire policy.                                                                                                                               |
| Up to 5 peer feedback columns            | Backend matrix keeps up to 5 peer records in `[applications/backend/src/application/participant/get-participant-questionnaire-matrix.usecase.ts](../../applications/backend/src/application/participant/get-participant-questionnaire-matrix.usecase.ts)`. | Partial   | Frontend peer input currently uses 3 fixed tabs in `[applications/frontend/src/routes/questionnaire.$qid.tsx](../../applications/frontend/src/routes/questionnaire.$qid.tsx)`; align UI with max-5 requirement and policy. |
| Admin-selectable prerequisite policy     | Not implemented as domain configuration.                                                                                                                                                                                                       | High      | Introduce admin-configurable prerequisite strategy per campaign (or per questionnaire assignment).                                                                                                                         |


### 6) Results experience and reporting


| Framing expectation                                | Current implementation                                                                                                                                                                                  | Gap level | What remains                                                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| Result visualization for 3 dimensions and key gaps | Generic matrix table/chart exists via `[applications/frontend/src/components/matrix/QuestionnaireMatrixDisplay.tsx](../../applications/frontend/src/components/matrix/QuestionnaireMatrixDisplay.tsx)`. | Partial   | Add framing-specific result layouts: dimensional gap overview and comparative panes as described in framing. |
| Explicit "gap 0" and comparative columns semantics | Data can support this but dedicated UX semantics are not implemented.                                                                                                                                   | High      | Build explicit derived metrics and labels in the presentation layer (and API DTO if needed).                 |
| PDF export of participant results                  | Not currently present in participant flow.                                                                                                                                                              | High      | Add export endpoint and rendering pipeline (server or client), with stable visual template.                  |
| Blue/yellow brand color guidance                   | Revela tokens already define blue/yellow palette in `[applications/frontend/src/lib/revelaTokens.ts](../../applications/frontend/src/lib/revelaTokens.ts)`.                                             | Partial   | Finalize with official AOR brand chart and remove contradictory semantic colors where required.              |


### 7) AI-assisted analysis with coach approval


| Framing expectation                                 | Current implementation                                                                                                                                                                                          | Gap level | What remains                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| AI-based interpretation and questioning suggestions | Placeholder blocks only in `[applications/frontend/src/components/revela/RevelaAiPlaceholder.tsx](../../applications/frontend/src/components/revela/RevelaAiPlaceholder.tsx)` and usage in questionnaire route. | High      | Implement real inference pipeline, prompt strategy, safety policy, and evidence traceability.         |
| Coach can edit/approve before participant delivery  | No explicit review workflow in domain/app layers.                                                                                                                                                               | High      | Add moderation workflow states (`draft`, `reviewed`, `approved`, `sent`) and dedicated coach tooling. |


### 8) Admin dashboard and campaign management


| Framing expectation                             | Current implementation                                                                                                                                                                   | Gap level | What remains                                                                                                                       |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard with global + per-campaign visibility | Admin dashboard exists in `[applications/frontend/src/routes/admin/index.tsx](../../applications/frontend/src/routes/admin/index.tsx)`, with global KPIs and questionnaire distribution. | Partial   | Introduce campaign entity and campaign-scoped KPIs (in progress/completed campaigns, participants per campaign, completion rates). |
| Launch and configure new campaigns              | Not implemented as a first-class concept.                                                                                                                                                | High      | Build campaign CRUD, launch lifecycle, assignment, and policy configuration UI/API.                                                |


## Delivery roadmap (recommended order)

### Phase 1 - Domain foundations (highest leverage)

1. Add a campaign domain model and persistence contracts (campaign lifecycle, ownership, status).
2. Extend participant profile schema to include direction/service/function hierarchy and campaign linkage.
3. Introduce role expansion and access policy model (super-admin, campaign admin, optional coach).

### Phase 2 - Flow alignment with framing

1. Make gating and peer requirements configurable through admin policy (remove hardcoded thresholds).
2. Align peer input UX to max-5 feedback workflow.
3. Add framing-aligned result screens focused on gaps and comparative interpretation.

### Phase 3 - Reporting and AI workflow

1. Add PDF export for participant result views.
2. Replace AI placeholders with a real analysis service.
3. Add coach review and approval workflow before participant delivery.

### Phase 4 - Operational maturity

1. Campaign-level admin analytics and monitoring.
2. Longitudinal analytics for evolution tracking.
3. Product hardening: auditability, governance, and quality gates for AI outputs.

## Risks and dependencies

- **Product ambiguity risk:** framing language and current catalog naming diverge; this should be resolved before KPI/reporting implementation.
- **Architecture risk:** introducing campaigns and roles late will create rework in routes, DTOs, and guards; prioritize early.
- **UX consistency risk:** hardcoded frontend thresholds and backend max-peer assumptions may drift without a shared policy source.
- **Compliance risk (AI):** no governance pipeline yet for generated insights; must be designed before production rollout.

## Definition of done for framing alignment

The implementation can be considered aligned with Revela V1 framing when all the following are true:

1. Campaign is a first-class domain concept used across import, assignment, access, and reporting.
2. Role model supports at least participant, super-admin, and campaign admin with enforced boundaries.
3. Participant onboarding supports full framed prefilled identity/organization fields.
4. Gating policy is configurable and consistently applied in backend and frontend.
5. Result experience includes explicit gap-centric visualizations and PDF export.
6. AI analysis is operational with coach validation workflow and auditable state transitions.

## Related living documents

- [Application routes and API map](./application-routes-and-api-map.md)
- [Participant session: questionnaires from invites and home UI](./participant-invite-questionnaires-and-session-ui.md)
- [ADR-001: User-facing questionnaires and participant score matrix API](../adr/ADR-001-user-facing-questionnaires-matrix-api.md)

