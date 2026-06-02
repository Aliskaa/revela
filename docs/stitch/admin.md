# Stitch Prompt — Révéla, Admin Space (AOR Conseil internal)

## Product context

Révéla is a SaaS platform used by professional coaches to administer scientific psychometric questionnaires (FIRO-B / Will Schutz's Element B) to employees in client companies. The **admin space** is the internal back-office used by **AOR Conseil** (the consulting firm operating the platform) to manage the entire catalog: client companies, coaches, campaigns, participants, questionnaires, business settings, and audit logs.

This is a **power-user back-office**, not a customer-facing UI. Density and efficiency matter more than warmth.

## Target user

Internal AOR Conseil staff (operations, account managers, super-admins). Comfortable with dense tables, keyboard shortcuts, bulk actions. Want to **get things done fast** and **find anything quickly**.

## Brand identity — AOR Conseil (mandatory)

Révéla is operated by AOR Conseil. The UI **must** follow the AOR brand charter.

**Color palette** (use these exact values):

| Role | Name | HEX | RGB |
|---|---|---|---|
| Primary | Bleu smalt | `#0F1898` | 15, 24, 152 |
| Accent | Jaune | `#FFCC00` | 255, 204, 0 |
| Secondary 1 | Vert d'eau | `#8BD7B7` | 139, 215, 183 |
| Secondary 2 | Bleu azurin | `#83D8F5` | 131, 216, 245 |
| Secondary 3 | Vert pistache | `#D3D800` | 211, 216, 0 |
| Background | White / off-white | `#FFFFFF` / `#FAFAFA` | — |
| Text | Bleu smalt or near-black | `#0F1898` / `#1A1A1A` | — |

**Typography** (mandatory):
- **Headings**: Outfit (the AOR print typeface). Bold for H1/H2, semibold for H3.
- **Body and UI**: Tenorite (the AOR office/web typeface). Regular for body, medium for labels.
- No serif fonts. No third typeface.

**Logo**: AOR CONSEIL logotype — wordmark with a yellow stylized "O" overlapping the A and R. Two approved variants: dark logo on light background, white logo on bleu smalt background. Never deform, never recolor, never use on a busy background.

**Semantic colors** (for status, validation, alerts) — must stay within or complement the palette:
- Success: vert d'eau (`#8BD7B7`).
- Info: bleu azurin (`#83D8F5`).
- Warning: jaune (`#FFCC00`).
- Danger / destructive: a deep red used sparingly — only for destructive confirmation modals.

## Mood adaptation for the admin space

Within the strict brand palette above:
- **Mood**: precise, efficient, structured. Linear meets Stripe Dashboard, but in AOR colors.
- **Background strategy**: white / off-white for tables and content. **Bleu smalt for the left sidebar and top bar** — this is the brand "frame" wrapping every admin page. Jaune for primary CTAs and active row/tab indicators only.
- **Tables**: white background, bleu smalt header text, subtle off-white row hover, jaune left-border accent on the selected row.
- **Status pills**: use secondary colors — vert d'eau for "Active / Completed", bleu azurin for "Draft / In progress", jaune for "Pending action", grey for "Archived / Closed".
- **Density**: high. Tables can show 20-50 rows.
- **Typography**: Tenorite throughout. Slightly smaller body type than other spaces — admins read tables more than prose.
- **Iconography**: thin-stroke, geometric, in bleu smalt.
- **Tone of microcopy**: terse and operational ("12 participants imported", "Export ready", "3 rows have errors").
- **Environment badge** in the top bar uses jaune in dev, bleu azurin in staging, and a distinct red in production.

## Layout

- **Persistent left sidebar** with grouped sections:
  - Overview: Dashboard, Audit log
  - Catalog: Companies, Coaches, Participants, Questionnaires
  - Operations: Campaigns, Imports, Exports
  - System: Settings
- Top bar with global search, environment indicator (dev/staging/prod badge), user menu.
- Main area: page header (title, breadcrumbs, primary actions on the right) + content.
- Desktop-only, optimized for 1440-1920px.

## Screens to design

### 1. Admin dashboard (home)
- **KPI grid** (6-8 tiles): active companies, active coaches, active campaigns, participants total, completion rate (campaigns), responses this month, debriefs sent this month, peer responses this month. Each tile shows a number, a label, and a trend arrow.
- **Activity timeline** (right column): chronological feed of important events — new participant imported, campaign created, coach assigned, debrief approved, GDPR deletion executed.
- **Charts**: line chart of responses over the last 90 days, breakdown by company.

### 2. Companies (CRUD)
- **List page**: dense table with columns Name, Active coach(es), Active campaigns, Participants, Created on, Status. Sortable, filterable, paginated. Top-right primary "+ New company".
- **Detail page**: header with company name and edit action; tabs Overview / Coaches / Campaigns / Participants / Settings. Each tab embeds a scoped table.
- **Create / Edit modal**: form fields (name, contact, billing info, notes).

### 3. Coaches (CRUD)
- **List**: table with Name, Email, Companies assigned, Active participants, Last login.
- **Detail**: profile, assigned companies (assignable from a multi-select), permissions, activity log.

### 4. Participants
- **List page**: very dense table — Name, Email, Company, Coach, Campaign, Stage, Last activity. Filters at the top (company, coach, campaign, stage). Bulk actions (resend invitation, archive).
- **Detail page**: identity, GDPR consents, full timeline of actions, raw data export, manual stage override (admin override with audit trail), deletion (GDPR).
- **CSV import flow** (key screen — design carefully):
  - Drag-and-drop zone with example CSV format displayed.
  - After upload: **preview table** showing parsed rows, with per-row validation (green check, yellow warning, red error).
  - Summary bar at top: "X valid rows, Y warnings, Z errors. Errors will be skipped on import."
  - Errors expandable inline (which column, which rule violated).
  - "Import N valid rows" primary button at the bottom.

### 5. Campaigns
- **List**: Campaign name, Company, Coach, Questionnaire, Status (Draft/Active/Closed), Participants count, Completion %, Start date, End date.
- **Detail**: overview with completion donut, participant table, settings.
- **Create wizard**: 3 steps — Company + coach selection, Questionnaire pick, Participants assignment + dates. Stepper at the top.

### 6. Questionnaires catalog
- List of available questionnaire types (FIRO-B, derivatives). Version, status, last updated.
- Detail: question list (read-only — questionnaires are defined in code), scoring rules summary, sample report preview.

### 7. Audit log
- Reverse-chronological feed of all sensitive actions: GDPR access, deletions, exports, role changes, settings changes.
- Filters: actor, action type, target entity, date range.
- Each row expandable to show full diff (before/after) for changes.
- Export to CSV.

### 8. Settings (admin)
**This is critical — all business-tunable parameters live here, not in environment files.**
- Tabbed settings page:
  - **General**: app name, default language, support email.
  - **Email templates**: editable templates for invitation, peer invitation, reminder, debrief-ready notification. Markdown editor + live preview + variable picker ({{participant.firstName}}, {{coach.name}}, etc.).
  - **Scoring thresholds**: editable numerical thresholds per FIRO dimension.
  - **AI harness**: model selection, prompt version selection, validator rules tuning (min/max length, forbidden phrases list).
  - **Security**: password policy, JWT TTL, session timeout.
  - **GDPR**: data retention period, default consent text.

### 9. Exports
- Page to trigger and download CSV exports of responses, participants, audit log.
- History of past exports (date, by whom, file).

## Key flows to render

1. **Onboard a new client company**: Companies → "+ New company" → fill form → in detail page, assign a coach → create a campaign → import participants via CSV → activate campaign.
2. **Handle a CSV with errors**: Imports → drag CSV → preview shows 3 errors → admin fixes them inline or proceeds with valid rows only → success summary.
3. **Tune the AI harness**: Settings → AI harness tab → switch to a newer prompt version → adjust validator rules → save → confirmation banner.
4. **Audit a GDPR deletion**: Audit log → filter by action type "DELETE_PARTICIPANT" → click row → see full record snapshot pre-deletion.

## Reusable components

- KPI tile with trend.
- Dense data table with: sortable headers, per-column filters, row checkboxes for bulk actions, sticky header, pagination footer.
- Wizard stepper.
- CSV preview table with per-row validation states.
- Tabbed detail page header.
- Filter bar (chip-based filters that can be removed individually).
- Status pills (Active / Draft / Closed / Archived).
- Diff viewer for audit log rows.
- Modal forms for create/edit.
- Markdown editor with variable picker (for email templates).
- Environment badge (dev / staging / prod) in top bar.

## Constraints

- Desktop-only, 1440-1920px. No mobile concerns.
- WCAG AA accessibility (admins use keyboard heavily — keyboard navigation is critical).
- French UI copy (keep labels short and translatable).
- Destructive actions (delete company, delete participant, regenerate AI prompt) require a typed-name confirmation modal.
- The environment badge must be visually unmissable when in production.
- Settings changes must always trigger a confirmation toast and an audit log entry.
