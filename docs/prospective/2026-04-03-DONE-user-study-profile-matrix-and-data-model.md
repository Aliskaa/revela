# Prospective (closed): User study profile — matrix summary and data model

**Status:** DONE  
**Date:** 2026-04-03  

## Outcome

Decisions and implementation for this topic are **recorded in** [ADR-001: User-facing questionnaires and participant score matrix API](../adr/ADR-001-user-facing-questionnaires-matrix-api.md).

Use that ADR as the authoritative reference for:

- Submission kinds and matrix DTO shape
- Questionnaire **C** exclusion from user-facing flows
- Admin matrix endpoint and UI (table / chart modes)

The sections below preserve **what was agreed in working sessions** (product intent and modelling), so the narrative is not only in the ADR.

---

## Discussion record (working sessions, 2026-04-03)

### Study shape (three tracks)

A participant’s study has three complementary tracks:

1. **Self-training (auto-formation)** — Direct ratings on the twelve **short labels** of each relevant questionnaire (same keys as in [`catalog.json`](../../packages/aor-questionnaires/src/catalog.json), e.g. `11`–`34` for questionnaire **B**), typically on a **0–9** agree–disagree style scale (as on the paper feedback grid).
2. **Peer feedback** — Same twelve dimensions, same scale, filled by peers about the subject. **At most five** peer returns per subject (column cap in the matrix).
3. **Scientific questionnaire (Élément humain)** — **2 × 54** item responses (0–5 per item in the current engine), then **derived** scores on the **same score keys** via [`calculateScores`](../../packages/aor-scoring/src/scoring-engine.ts). These values are **not** the same measurement process as direct 0–9 judgments; reports must label sources clearly (e.g. “Mon Élément B” vs “How I see myself”).

Questionnaires **B**, **F**, and **S** remain in scope for the battery; **C** is **not** offered on public listing, anonymous submit, or **new** invites (catalog may still contain **C** for legacy or tooling — see ADR-001).

### Access pattern

The subject opens a **profile link** and can complete **one of the three** tracks (ordering and gating are product choices). Invitations for the scientific test continue to use the existing invite-token flow for user-facing questionnaires.

### Matrix / “one line per dimension”

For reporting, the desired **read model** is a **table**: **one row per `score_key`** (short label), **columns** for:

- **Self**
- **Up to five peers** (stable column order: five most recent peer submissions, displayed chronologically left-to-right)
- **Scientific** (latest `element_humain` submission for that subject and questionnaire)

The **same DTO** should feed a **tabular** view and a **more graphical** view (e.g. bars per column, optional grouping by `result_dims` for interpretation). **Gap (“écart”)** copy for the scientific profile can align with catalog **`diff_pairs`**; for self vs peer columns, rules should be explicit if gaps are shown (avoid silent reuse of scientific-only semantics).

### Persistence intent (aligned with implementation)

- Store rows in **`questionnaire_responses`** with **`submission_kind`**: `element_humain` | `self_rating` | `peer_rating`, plus **`subject_participant_id`** and **`rater_participant_id`** where applicable (see Drizzle schema and ADR-001).
- **Scores** remain `(response_id, score_key, value)`; validation differs by submission kind (Likert vs derived counts).
- Optional later: persist raw **108** answers if audit or recomputation is required (not in the first slice).

### Open product clarifications (not all implemented)

- Whether **F** and **S** get the same matrix UX as **B** everywhere.
- Exact **gap** rules for self and peer columns.
- Whether legacy **anonymous** rows without `subject_participant_id` should appear in subject matrices (fallback on `participant_id` for `element_humain` was kept for migration compatibility).

---

## Related (still open)

- [2026-04-03-NEW-aor-scoring-and-questionnaires-package-boundaries.md](./2026-04-03-NEW-aor-scoring-and-questionnaires-package-boundaries.md) — BC / package layout for `@aor/questionnaires` and `@aor/scoring`.
