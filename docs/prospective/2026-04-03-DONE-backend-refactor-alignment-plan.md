# Backend refactor alignment plan (Cursor rules)

**Status:** DONE  
**Date:** 2026-04-03  

## Progress

- **2026-04-03:** Phases **1**, **2**, **3**, and **5** applied (`infrastructure/scoring`, `I*.port.ts`, `*.usecase.ts`, Nest DI tokens `*_SYMBOL` including [`@aor/drizzle`](../../packages/aor-drizzle) pool/db symbols).
- **2026-04-03:** **Phase 4** closed without migration — documented under Phase 4 below.

## Goal

Bring [`applications/backend`](../../applications/backend) closer to [backend NestJS rules](../../.cursor/rules/backend-nestjs.instructions.mdc), [architecture patterns](../../.cursor/rules/architecture-patterns.instructions.mdc), and [TypeScript port naming](../../.cursor/rules/typescript-language.instructions.mdc), without a big-bang rewrite to `modules/<feature>/` (optional later phase).

## Phase 1 — Infrastructure folder consistency (completed)

- **Issue:** `infrastructures/scoring` vs [`infrastructure/`](../../applications/backend/src/infrastructure).
- **Action:** Move scoring noop adapter under `src/infrastructure/scoring/` and delete `src/infrastructures/`.
- **Risk:** Low (single import site in [`ScoringModule`](../../applications/backend/src/presentation/scoring/ScoringModule.ts)).

## Phase 2 — Port files and `I*` contracts (completed)

- **Issue:** Ports lived in `*.port.ts` without the mandated `I*.port.ts` filename; interfaces omitted the `I` prefix (e.g. `MailPort`).
- **Action:** Rename each port module to `I{Name}.port.ts` and rename the primary port interface to `I…Port` (command/query `type` exports unchanged; DI symbol names were aligned to `*_SYMBOL` in phase 5).
- **Mapping:**

| Old path | New path | Interface rename |
|----------|----------|------------------|
| `admin/invite-url-config.port.ts` | `admin/IInviteUrlConfig.port.ts` | `InviteUrlConfigPort` → `IInviteUrlConfigPort` |
| `admin/admin-auth-config.port.ts` | `admin/IAdminAuthConfig.port.ts` | `AdminAuthConfigPort` → `IAdminAuthConfigPort` |
| `admin/admin-token-signer.port.ts` | `admin/IAdminTokenSigner.port.ts` | `AdminTokenSignerPort` → `IAdminTokenSignerPort` |
| `admin/cutover-strategy-config.port.ts` | `admin/ICutoverStrategyConfig.port.ts` | `CutoverStrategyConfigPort` → `ICutoverStrategyConfigPort` |
| `invitations/mail.port.ts` | `invitations/IMail.port.ts` | `MailPort` → `IMailPort` |
| `invitations/invitations-repository.port.ts` | `invitations/IInvitationsRepository.port.ts` | `InvitationsRepositoryPort` → `IInvitationsRepositoryPort` |
| `companies/companies-repository.port.ts` | `companies/ICompaniesRepository.port.ts` | `CompaniesRepositoryPort` → `ICompaniesRepositoryPort` |
| `participants/participants-repository.port.ts` | `participants/IParticipantsRepository.port.ts` | `ParticipantsRepositoryPort` → `IParticipantsRepositoryPort` |
| `responses/responses-repository.port.ts` | `responses/IResponsesRepository.port.ts` | `ResponsesRepositoryPort` → `IResponsesRepositoryPort` |
| `scoring/score-persistence.port.ts` | `scoring/IScorePersistence.port.ts` | `ScorePersistencePort` → `IScorePersistencePort` |
| `scoring/calculate-scoring-use-case.port.ts` | `scoring/ICalculateScoringUseCase.port.ts` | `CalculateScoringUseCasePort` → `ICalculateScoringUseCasePort` |

- **Risk:** Medium (many imports). Mitigation: `pnpm --filter @aor/backend-api run typecheck` after changes.

## Phase 3 — Use case file naming (`*.usecase.ts`) (completed)

- **Issue:** Rules expect `<Name>.usecase.ts` (e.g. `CreateCronjobK8s.usecase.ts`); backend used `PascalCaseUseCase.ts`.
- **Action:** Renamed 22 use case modules to kebab-case `.usecase.ts`, updated Nest and cross-layer imports; scoring unit spec renamed to `calculate-scoring.usecase.spec.ts` (class names such as `SubmitQuestionnaireUseCase` unchanged).
- **Risk:** Mitigated by `typecheck`, `test`, and `lint` on `@aor/backend-api`.

## Phase 4 — Feature-first `modules/<feature>/` layout (decided not to migrate)

- **Issue:** [Backend NestJS rules](../../.cursor/rules/backend-nestjs.instructions.mdc) describe `modules/<feature>/application|domain|infrastructure|…`; this app uses layer-first folders (`presentation`, `application`, `domain`, `infrastructure`, `interfaces`).
- **Decision:** Keep the current layer-first layout. Rationale: single developer on the project — vertical feature folders add migration cost without ownership or parallel-work benefits; layer-first navigation stays sufficient.
- **Revisit if:** Additional developers join with stable feature ownership, or a feature is targeted for extraction into a separate package or service.
- **When to prefer `modules/<feature>/` (historical criteria):** Several contributors own different features, you want vertical slices for ownership/tests, or you plan to extract a feature — then migrate **one** feature as a pilot before moving the rest.

## Phase 5 — DI token suffix (`*_SYMBOL`) (completed)

- **Issue:** [Dependency-injection rule](../../.cursor/rules/dependency-injection.instructions.mdc) requires exported `…_SYMBOL` and `@Inject(…_SYMBOL)`.
- **Action:** Renamed all Nest DI symbols in the backend (use-case tokens under `presentation/*/*.tokens.ts`, repository/config/score persistence tokens in `interfaces/**`, wiring in modules/controllers). [`@aor/drizzle`](../../packages/aor-drizzle) exports `DATABASE_POOL_SYMBOL` and `DRIZZLE_DB_SYMBOL` (replacing `DATABASE_POOL` / `DRIZZLE_DB`). `process.env.MAIL_PORT` in [`nodemailer-mail.adapter.ts`](../../applications/backend/src/infrastructure/mail/nodemailer-mail.adapter.ts) is unchanged (SMTP env var, not DI).

## Verification

```bash
pnpm --filter @aor/drizzle run build
pnpm --filter @aor/backend-api run typecheck
pnpm --filter @aor/backend-api run test
pnpm --filter @aor/backend-api run lint
```
