# backend-api

NestJS API currently migrating from the legacy Flask backend (`backend/`).
All business routes are exposed under the global `/api` prefix, while health checks stay outside the prefix.

## Scripts

- `pnpm --filter @aor/backend-api build`
- `pnpm --filter @aor/backend-api start`
- `pnpm --filter @aor/backend-api test`

## Runtime Environment

- `DATABASE_URL` - PostgreSQL connection string (shared schema/client from `@aor/drizzle`)
- `JWT_SECRET` - admin JWT signing secret (required outside local dev)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - admin login credentials (default: `admin` / `admin`)
- `FRONTEND_URL` - base URL used to generate invitation links (default: `http://localhost:5173`)
- Optional SMTP: `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`

## Health Endpoint

- `GET /health` -> `{ "status": "ok" }`

## Main Route Groups (Flask parity)

- Public: `GET/POST /api/questionnaires/...`, `POST /api/questionnaires/:qid/submit`, `GET /api/responses/:id`, `GET/POST /api/invite/:token/...`
- Admin (Bearer JWT): `POST /api/admin/auth/login`, dashboard, participants, invitations, companies, targeted erasure, CSV exports, `GET /api/admin/cutover-strategy`
- Scoring: `POST /api/scoring/calculate`

## Python -> TypeScript Cutover

Use `AOR_API_CUTOVER_MODE` (`typescript` by default) and the authenticated endpoint `GET /api/admin/cutover-strategy` as the operational checklist.
At cutover time, route `/api` traffic to this Nest service and keep the legacy Flask port (`LEGACY_PYTHON_API_PORT`, default `5000`) documented as rollback fallback.
