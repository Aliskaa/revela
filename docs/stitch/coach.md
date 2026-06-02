# Stitch Prompt — Révéla, Coach Space

## Product context

Révéla is a SaaS platform used by professional coaches to administer scientific psychometric questionnaires (FIRO-B / Will Schutz's Element B) to employees in client companies. The coach is the **central operator** of the product: they monitor their participants' progress, write the personalized debrief, and approve it before it reaches the participant.

In v2, the coach is assisted by an **AI harness** (Claude Opus 4.7) that generates a draft debrief from the data. The coach edits it in Markdown, must clear a **blocking validator** (length, forbidden phrasing, required 5-section structure, 3-5 reflective questions), and only then can approve and release it to the participant.

## Target user

A certified professional coach. Accompanies 5 to 30 participants in parallel across several client companies. Power user, comfortable with productivity tools (Notion, Linear). Needs **clarity at a glance** ("who is where in the journey") and a **focused writing environment** for the debrief.

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

## Mood adaptation for the coach space

Within the strict brand palette above:
- **Mood**: focused, professional, editorial. Tool-for-craftspeople vibe — Linear meets Notion, but in AOR colors.
- **Background strategy**: white / off-white for content panes. Bleu smalt for the left sidebar, top bar, and primary CTAs. Jaune for active states, "Generate AI draft" button, and key highlights. The Markdown preview pane uses pure white with bleu smalt text for serious-document feel.
- **Secondary colors**: vert d'eau / bleu azurin / vert pistache reserved for FIRO dimension differentiation and validator status pills (vert d'eau = passing rule). Never for plain UI chrome.
- **Density**: medium-high — tables, lists, sidebars are welcome, but never cramped.
- **Typography in the Markdown preview**: Tenorite at slightly larger size with relaxed line-height — the debrief must read like a polished AOR document.
- **Iconography**: thin-stroke, geometric, in bleu smalt.
- **Tone of microcopy**: clear and competent, second-person but professional ("Review the draft", "Approve and send to participant"). No corporate jargon.

## Layout

- **Persistent left sidebar** with: Dashboard, Companies, Campaigns, Participants, Settings.
- Top bar with breadcrumbs, search, profile menu.
- Main content area with generous max-width for tables and a focused mode for the editor.
- Desktop-first; should remain usable on tablet.

## Screens to design

### 1. Coach dashboard (home)
The "where do I need to act" screen.
- Greeting and today's date.
- **KPI strip**: active campaigns, participants in progress, debriefs to write, debriefs to validate.
- **"Needs your attention" list** (the most important block): each row is a participant requiring action, with reason ("Self-assessment completed — debrief to draft", "Peer feedback stalled at 2 of 5", "Validator errors on debrief"), severity color, and a one-click jump to the relevant screen.
- **Upcoming sessions** (if calendar wired).
- Small activity feed (recent participant completions).

### 2. Companies list
- Table of client companies this coach is assigned to.
- Columns: Name, Active participants, Active campaigns, Last activity.
- Search and filter. Click a row → company detail.

### 3. Company detail
- Header with company name, logo placeholder, contact person.
- Tabs: Participants, Campaigns, Activity.
- Same look as admin company detail but **scoped** to this coach's data only.

### 4. Campaigns list
- Table with: Campaign name, Company, Status, Participants (e.g. 12/15 completed), Start date, End date.
- Status pill: Draft / Active / Closed.
- Filters: company, status, date range.

### 5. Campaign detail
- Overview tile: completion rate (large donut chart), counts per stage (invited / in self-assessment / awaiting peers / debrief ready / debrief sent).
- **Participant table** scoped to this campaign with columns: Name, Stage, Peer feedback progress, Debrief status (Not started / Draft / Validator failing / Approved / Sent).
- Bulk actions (send reminder to all stalled peers).

### 6. Participants list
- Full table of all participants this coach owns across all companies / campaigns.
- Filters: company, campaign, stage, debrief status.
- Sortable columns. Pagination.

### 7. Participant detail — the core screen (highest priority for Stitch)

This is **the screen the coach spends the most time on**. It must be excellent.

**Layout**: three-pane.
- **Left pane (collapsible)**: participant info — name, company, role, contact, campaign, timeline of events (invited on, self-assessment completed on, peer N/M responded on, debrief drafted on).
- **Center pane**: tabbed.
  - Tab 1 — **Debrief editor** (default tab when self-assessment is done).
  - Tab 2 — Raw results (FIRO scores, peer breakdown, radar chart).
  - Tab 3 — Peer feedback details (anonymized).
- **Right pane (collapsible)**: AI assistant + validator.

**Debrief editor (Tab 1)** — the centerpiece:
- Top toolbar: "Generate AI draft" button (primary, with a small sparkle icon), "Save draft", "Approve and send to participant" (disabled while validator fails).
- **Two-column layout**: Markdown editor on the left, rendered preview on the right (serif font, exactly as the participant will see it).
- Section markers in the editor (the 5 required sections of the debrief — soft headers as guides).
- Live word count and reading-time estimate at the bottom.

**Right pane — AI + Validator**:
- AI status card: model used (Claude Opus 4.7), prompt version, last generation timestamp, "Regenerate" button (with confirmation — overwrites current draft).
- **Validator panel** with a checklist of rules, each with a green check or a red error:
  - Length within bounds (X to Y words)
  - All 5 sections present (Introduction, Per-dimension reading, Self vs peers gap, Hypotheses, Reflective questions)
  - 3 to 5 reflective questions in the final section
  - No forbidden phrasing (list of flagged phrases with a "Find in editor" link)
  - Cited dimensions ⊆ dimensions selected by the harness
- Failed rules expand with explanation and a jump-to-line link.
- Banner at the top: green "Ready to approve" or red "X validator errors must be resolved before sending."

**Raw results (Tab 2)**:
- FIRO radar chart (self vs peers overlay).
- Per-dimension cards with numerical scores and short interpretations.
- Downloadable raw data (CSV).

**Peer feedback (Tab 3)**:
- Anonymized list of responses (no peer names, only relationship type and date).
- Aggregate stats per question.

### 8. Settings (coach)
- Profile, photo, bio (shown to participants in their welcome email).
- Email signature used in auto-sent emails.
- Notification preferences.

## Key flows to render

1. **Triage**: login → dashboard → click an item in "Needs your attention" → land on the right participant tab.
2. **AI-assisted debrief**:
   - Open participant detail → click "Generate AI draft" → loading state with progress indicator (LLM call takes ~20-40s) → draft appears in editor, preview updates, validator panel populates → coach edits → validator errors clear one by one → "Approve and send" becomes enabled → confirmation modal → success toast → participant timeline updates.
3. **Validator blocking**:
   - Coach clicks "Approve and send" while errors remain → button stays disabled with tooltip "Resolve N validator errors first" → right pane errors pulse briefly to draw attention.

## Reusable components

- "Needs attention" row with severity color, reason, jump action.
- KPI tile (big number, small label, optional trend).
- Stage pill (Invited / In self-assessment / Awaiting peers / Debrief ready / Sent).
- Markdown editor with section guides.
- Validator checklist item (rule name, status, expand for detail).
- AI generation status card.
- Two-pane editor + preview layout.
- Three-pane participant layout with collapsible left/right.
- Donut chart for campaign completion.
- FIRO radar chart (self vs peers).
- Anonymized peer response row.

## Constraints

- Desktop-first (1440px+), graceful tablet support, no need for mobile-first.
- WCAG AA accessibility.
- French UI copy (keep labels short and translatable).
- The AI generation step is **asynchronous and can fail** — design loading, error, and retry states explicitly.
- The "Approve and send" action is **irreversible from the coach UI** — design a clear confirmation modal.
