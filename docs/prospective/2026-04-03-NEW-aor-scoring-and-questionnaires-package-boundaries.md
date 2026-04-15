# Prospective: `@aor/scoring` and `@aor/questionnaires` package boundaries

**Status:** NEW  
**Date:** 2026-04-03  

## Context

The monorepo rules in `[.cursor/rules/monorepo-structure.instructions.mdc](../../.cursor/rules/monorepo-structure.instructions.mdc)` describe a preferred bounded-context layout under `./packages/{bc}/types`, `write`, and `read`, with `[@aor/integration](../../packages/aor-integration/README.md)` as the only package allowed to compose multiple BCs.

In this repository, questionnaire catalog data and scoring logic are published as two flat workspace packages:


| Path                                                               | Package name          | Role (today)                                                                                                                                                                                  |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[packages/aor-scoring](../../packages/aor-scoring)`               | `@aor/scoring`        | Pure scoring engine (`calculateScores`, etc.); depends only on `[@aor/types](../../packages/aor-common/types)`.                                                                               |
| `[packages/aor-questionnaires](../../packages/aor-questionnaires)` | `@aor/questionnaires` | Loads `catalog.json`, exposes `QUESTIONNAIRE_CATALOG`, `getQuestionnaireEntry`, `listQuestionnairesSummary`, and catalog TypeScript types; no runtime dependency on other workspace packages. |


The backend application `[@aor/backend-api](../../applications/backend)` imports both packages from application use cases (for example submission flows that validate against the catalog and then score answers).

## Open questions

1. **Bounded context identity:** Are “questionnaires” and “scoring” two separate BCs, one BC with two libraries, or shared “platform domain” libraries that are not BC-scoped?
2. **Alignment with `{bc}/types` | `read` | `write`:** Should these packages be renamed or split to match the preferred family, or is the current `aor-`* naming an intentional simplification for this product?
3. **Cross-cutting composition:** Today, orchestration that uses both catalog and scoring lives in the backend (e.g. `[submit-questionnaire.usecase](../../applications/backend/src/application/responses/submit-questionnaire.usecase.ts)`). If another runnable app needs the same orchestration, should that move behind `[@aor/integration](../../packages/aor-integration)` or stay duplicated at the application layer?
4. **Contract ownership:** DTOs and Zod schemas for API payloads live in `[@aor/types](../../packages/aor-common/types)`. The catalog types in `@aor/questionnaires` overlap conceptually with questionnaire definitions. Should catalog shapes be derived from or validated by the same schemas as `@aor/types`, or remain a separate source (JSON catalog) with explicit mapping at the boundary?
5. **Frontend parity:** If the frontend must reproduce scoring or catalog summaries, either package is a natural dependency; rules should state whether UI may depend on `@aor/questionnaires` / `@aor/scoring` directly or only on `@aor/types` plus API responses.

## Dependency facts (verified)

- `@aor/scoring` → `@aor/types` only (`[packages/aor-scoring/package.json](../../packages/aor-scoring/package.json)`).
- `@aor/questionnaires` → no workspace dependencies (`[packages/aor-questionnaires/package.json](../../packages/aor-questionnaires/package.json)`).
- No import from `applications/` into `packages/` (matches [dependency rules](../../.cursor/rules/dependency-rules.instructions.mdc)).

## Candidate directions (for decision)

- **A — Keep as-is:** Document these two packages as “shared domain libraries” for the questionnaire product, not full BC slices; accept deviation from `packages/{bc}/types|read|write` until the domain grows.
- **B — BC-shaped packages:** Introduce something like `packages/questionnaire-platform/types`, `read`, `write` (names illustrative) and migrate exports; higher churn, clearer alignment with monorepo conventions.
- **C — Integration-owned orchestration:** Extract “submit + score” (and similar) into `@aor/integration` if a second consumer appears; keep `@aor/scoring` and `@aor/questionnaires` as pure libraries.

## Next steps

- Decide BC vs shared-library classification and record it in an ADR or update the monorepo structure doc.
- If classification is “two BCs,” confirm that neither package imports the other (already true) and that cross-BC orchestration stays in apps or `@aor/integration`.
- If classification is “one BC,” plan a merge or a single `{bc}-core` style package to reduce cognitive load.

## Related code references

- Backend use of scoring: `[calculate-scoring.usecase](../../applications/backend/src/application/scoring/calculate-scoring.usecase.ts)`.
- Backend use of catalog: `[get-questionnaire-detail.usecase](../../applications/backend/src/application/questionnaires/get-questionnaire-detail.usecase.ts)`, `[submit-questionnaire.usecase](../../applications/backend/src/application/responses/submit-questionnaire.usecase.ts)`.

