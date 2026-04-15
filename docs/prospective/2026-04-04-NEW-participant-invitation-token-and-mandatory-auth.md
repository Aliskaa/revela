# Prospective: Mandatory participant authentication and single-use invitation tokens

**Status:** IN PROGRESS  
**Date:** 2026-04-04  
**Implementation snapshot:** Aligned with repository state as of 2026-04-04 (refresh this section when merging material changes).

## Context

The REVELA platform distinguishes administrative profiles (for example **Cabinet** / super-admin and **campaign admin**) from **participants**, who complete questionnaires. **Historically**, questionnaire flows were reachable without participant authentication; **a first MVP now enforces a logged-in participant** for the main participant SPA (home, questionnaire, results), while **onboarding** still uses a **public invitation link** and **public questionnaire detail** for that flow.

Product intent remains to **require an authenticated participant** for questionnaire access where it matters for confidentiality; invitation-based onboarding aligns participants with records prepared by administrators.

For a concise map of routes and APIs, see [Application routes and API map](../architecture/application-routes-and-api-map.md).

## Target behaviour (product requirements)

1. **No anonymous questionnaire access:** Passing a questionnaire requires a logged-in participant account (exact scope of “logged in” for every step—e.g. landing vs submit—remains to be specified in an ADR).
2. **First access via invitation token:** An administrator creates an invitation. **Delivery channel is the admin’s choice:** optionally **send by email** from the platform (using the available **SMTP** server), or **copy the token / invitation link** and transmit it through any channel the admin prefers (manual distribution).
3. **Token resolves invitee identity:** On first use, the token is associated with **first name**, **last name**, **company**, and **email** supplied when the invitation was created (or derived from it).
4. **Password on first successful connection:** During the first login flow, the participant **sets a password**; subsequent sessions use **email + password** (or an equivalent credential strategy).
5. **Single-use invitation token:** The token is **valid only once**. It is **consumed / invalidated when the password is set and the participant account is created** (not on a mere page view). After that, access is **email + password** only.

## Recorded decisions

| Topic | Decision |
| --- | --- |
| **Token consumption boundary** | Invalidate the invitation token when **password is set and the account is created** (activation complete). |
| **Time-based expiry** | Default **30 days** validity from creation; **per-invitation configurability** at creation time (same field or policy knob—implementation detail), so operators can shorten or extend without code changes. |
| **Forgot password** | Provide a standard **forgot-password** flow for participants (reset via email, using SMTP). |
| **Public surface** | **No page remains public without authentication**; legacy bookmarks or shared URLs must redirect or show an unauthenticated error and a path to sign-in / request a new invitation as appropriate. |
| **Token delivery** | **Admin-controlled:** per invitation, the admin may **trigger platform email** (SMTP) **or** **copy** the token / link and deliver it themselves. **Forgot-password** remains email-based via SMTP when the participant initiates reset. |

## Recommendation: email verification (question 4)

**Suggested default for an MVP:** treat **possession of the one-time invitation token or link** plus **password set on that flow** as sufficient: you do **not** need a separate “confirm your email” step. When the admin sends via platform email, that channel aligns with the stored address; when the admin copies the token, **correct delivery to the intended participant remains the admin’s responsibility** (same as manual distribution of any secret).

Add a **separate** email-verification step only if you need **higher assurance** (e.g. regulated contexts, or if admins sometimes enter a wrong address and you want a second check). That adds UX cost and more mail volume; it can be a later iteration.

If you adopt the MVP approach, document clearly that **correct recipient email is the admin’s responsibility** and that the invitation token must stay confidential until use.

## Implementation status (snapshot)

### Implemented (MVP-aligned)

| Topic | Pointers |
| --- | --- |
| Participant session (JWT) and protected SPA routes | [`auth.ts`](../../applications/frontend/src/lib/auth.ts) (`participantAuth`), [`routes/index.tsx`](../../applications/frontend/src/routes/index.tsx), [`routes/questionnaire.$qid.tsx`](../../applications/frontend/src/routes/questionnaire.$qid.tsx), [`routes/results.$qid.$responseId.tsx`](../../applications/frontend/src/routes/results.$qid.$responseId.tsx) |
| Participant login (email + password) | [`routes/login.tsx`](../../applications/frontend/src/routes/login.tsx), [`api/participantAuth.ts`](../../applications/frontend/src/api/participantAuth.ts), [`participant.controller.ts`](../../applications/backend/src/presentation/participant/participant.controller.ts) (`POST …/participant/auth/login`) |
| Invitation preview, activation (set password), invite-based submit | [`invitations-public.controller.ts`](../../applications/backend/src/presentation/invitations/invitations-public.controller.ts), [`api/invitations.ts`](../../applications/frontend/src/api/invitations.ts), [`routes/invite.$token.tsx`](../../applications/frontend/src/routes/invite.$token.tsx) |
| Token consumed on activation (not on page view) | [`drizzle-invite-activation.repository.ts`](../../applications/backend/src/infrastructure/database/repositories/drizzle-invite-activation.repository.ts) (`usedAt` on invite row with password hash) |
| Participant questionnaire list + submit (authenticated) | [`questionnaires.controller.ts`](../../applications/backend/src/presentation/questionnaires/questionnaires.controller.ts) (list guarded), [`participant.controller.ts`](../../applications/backend/src/presentation/participant/participant.controller.ts) (`POST …/participant/questionnaires/:qid/submit`) |
| Admin: create invitation, optional SMTP, copy URL/token in API response | [`create-participant-invite.usecase.ts`](../../applications/backend/src/application/admin/create-participant-invite.usecase.ts) |
| Time-based expiry check | [`invite-token-validation.usecase.ts`](../../applications/backend/src/application/invitations/invite-token-validation.usecase.ts) |
| Default 30-day expiry at creation | Same use case (`expiresAt` set to 30 days from creation) |

### Partially implemented

| Topic | Gap vs recorded decision |
| --- | --- |
| **Public surface** | SPA routes [`/login`](../../applications/frontend/src/routes/login.tsx), [`/forgot-password`](../../applications/frontend/src/routes/forgot-password.tsx), and [`/invite/$token`](../../applications/frontend/src/routes/invite.$token.tsx) remain reachable without a participant session. API remains public for [`GET /api/questionnaires/:qid`](../../applications/backend/src/presentation/questionnaires/questionnaires.controller.ts) and [`/api/invite/...`](../../applications/backend/src/presentation/invitations/invitations-public.controller.ts). This matches onboarding but is **stricter than a literal reading** of “no public pages.” |
| **Per-invitation TTL** | Only a **fixed 30-day** TTL is applied in code; **no operator-configurable** field at creation time yet. |
| **Forgot password** | UI placeholder only: [`forgot-password.tsx`](../../applications/frontend/src/routes/forgot-password.tsx). No participant reset-via-email flow in backend (SMTP) yet. |
| **SMTP** | Used for **optional** invitation email on create; **not** yet for password reset. |
| **UX messaging** | Expired/consumed tokens: rely on API errors and admin-facing status; no full product copy audit documented here. |

### Not implemented / still open

| Topic | Notes |
| --- | --- |
| **ADR** for participant identity boundaries, HTTP surface, configurable TTL | Still recommended; [ADR-001](../adr/ADR-001-user-facing-questionnaires-matrix-api.md) does not replace this. |
| **Admin scope** (who may invite; campaign/company linkage on invitation vs participant) | Unchanged from [Remaining open questions](#remaining-open-questions). |
| **Strict zero-public-page product interpretation** | Would require redesign (e.g. gated invite delivery only) if adopted literally. |

## Remaining open questions

1. **Admin scope:** Which roles may create invitations (Cabinet only, campaign admin per campaign, both)? How are **company** and **campaign** linkage stored on the invitation and on the participant account?
2. **Where to implement in code (plain-language version of “API and BC boundaries”):** The earlier question was only about **code organization**—*which parts of the backend* should own “create invitation,” “redeem token + set password,” “login,” and “session,” so the monorepo stays maintainable and does not blur admin vs participant domains. This is **not** a product rule; it is settled when you write the **ADR** (which modules, routes, and persistence). [ADR-001](../adr/ADR-001-user-facing-questionnaires-matrix-api.md) covers matrix/questionnaire APIs today; participant identity will likely need **new** use cases and tables alongside those flows.

## Candidate directions (for decision)

- **A — Token as opaque credential, redemption endpoint:** Short-lived or one-time secret exchanged server-side for a session after password set; minimal exposure of PII in URLs (prefer server-side lookup by token id).
- **B — Magic link + password set:** Email contains a signed URL; first visit binds browser session and forces password creation before any questionnaire access.
- **C — OIDC / external IdP later:** Implement local email+password first; keep ports clear for future SSO without rewriting participant onboarding.

## Next steps

- Decide **admin scope** (roles + campaign/company linkage) with product.
- Add an **ADR** for persistence (invitations, participants, sessions), HTTP routes, and **configurable invitation TTL** (default 30 days); reference this prospective doc.
- Implement **participant password reset** end-to-end (token or magic link + **SMTP**), and replace the [`forgot-password`](../../applications/frontend/src/routes/forgot-password.tsx) placeholder.
- Either **relax the written “no public pages” rule** in this doc to match invite + questionnaire-detail reality, or **change product/UX** to match the strict interpretation.
- Harden **messaging** for expired/consumed invitations and document **re-invite** operator paths (creation of a new invitation is already available to admins).

## Related documents

- [Application routes and API map](../architecture/application-routes-and-api-map.md) — SPA routes, `/api` endpoints, JWT roles.
- [ADR-001: User-facing questionnaires and participant score matrix API](../adr/ADR-001-user-facing-questionnaires-matrix-api.md) — current user-facing questionnaire and matrix decisions.
- [2026-04-03-DONE-user-study-profile-matrix-and-data-model.md](./2026-04-03-DONE-user-study-profile-matrix-and-data-model.md) — closed prospective; points to ADR-001 for matrix scope.

