# Stitch Prompt — Révéla, Participant Space

## Product context

Révéla is a SaaS platform used by professional coaches to administer scientific psychometric questionnaires (FIRO-B / Will Schutz's Element B) to employees in client companies. Participants take a self-assessment, invite peers for 360° feedback, and later read a personalized debrief written by their coach.

This is **not** a casual personality quiz. It is a serious clinical-grade tool used in executive coaching. Participants may feel vulnerable when taking the test and reading their results. The UI must inspire **trust, calm, respect, and emotional safety**.

## Target user

A mid-to-senior employee (manager, executive, team lead) invited by their coach. Not always tech-savvy. Reads their results in private. Needs to feel **respected, never judged**, and to clearly understand what is happening at each step.

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

## Mood adaptation for the participant space

Within the strict brand palette above:
- **Mood**: introspective, calm, premium. Halfway between a high-end SaaS product (Linear, Notion) and a reassuring institutional tool. The bleu smalt provides gravitas; the jaune brings warmth; large white space and Tenorite body type keep it human.
- **Background strategy**: predominantly white / off-white. Bleu smalt reserved for headers, key CTAs, and the navigation bar. Jaune used sparingly as accent (active state, key highlight, progress fill).
- **Secondary colors** (vert d'eau, bleu azurin, vert pistache): reserved for data visualization (one color per FIRO dimension) and section differentiation. Never for plain UI chrome.
- **Density**: generous whitespace. Long-form reading sections (results, debrief) must feel like an article.
- **Iconography**: thin-stroke, geometric, in bleu smalt. No emojis, no playful illustrations.
- **Tone of microcopy**: warm, second-person ("Take your time", "Your coach will get back to you"), never gamified.
- **Motion**: subtle fades and easing. Never bouncy.

## Layout

- Minimal top navigation bar (logo left, profile menu right). No left sidebar — the participant space stays uncluttered.
- Centered content column, max width ~720px for reading screens, wider for dashboards.
- Mobile-first responsive — many participants take the test from their phone in the evening.

## Screens to design

### 1. Invitation landing page
Accessed via a tokenized link from an email. Public (no login yet).
- Warm welcome headline with the coach's name and company.
- Plain-language explanation of what Révéla is, what they will do (3 steps), and how long it takes (~15 min for self-assessment).
- GDPR / privacy block: who sees what, where data is stored, right to erasure.
- "Create your account" CTA → password creation form (password, confirm, accept terms).
- Reassurance footer: "Your individual answers will never be shared with your employer."

### 2. Login screen
Minimal. Email + password. "Forgot password" link. Subtle illustration or quote on the side.

### 3. Participant dashboard (home)
The first screen after login. Shows the **current state** of their journey.
- Greeting with first name.
- One **primary card** per active campaign, each showing:
  - Campaign name and coach name.
  - **Segmented progress bar** with 4 steps: Invited → Self-assessment → Peer feedback → Results.
  - The next action highlighted as a CTA ("Continue your self-assessment", "Invite your peers", "Read your debrief").
- Past / completed campaigns in a secondary, collapsed section.
- Empty state if no active campaign: gentle message, contact info for the coach.

### 4. Self-assessment screen
The questionnaire itself. ~50 Likert-scale questions.
- **One question at a time**, large readable type, lots of breathing room.
- 6-point Likert scale rendered as large pill buttons (from "Never" to "Always", or "Strongly disagree" to "Strongly agree").
- Sticky thin **progress bar** at the top (question N of M).
- "Previous" and "Next" buttons at the bottom. "Next" enabled only once an answer is selected.
- Auto-save indicator ("Saved" with a small check).
- "Pause and resume later" link — clicking returns to dashboard, progress kept.
- Confirmation modal on submission: "Once submitted, you cannot change your answers. Continue?"

### 5. Peer invitation screen
Where the participant invites 3 to 8 colleagues for 360° feedback.
- Short explainer at the top: why peer feedback matters, who to choose (managers, peers, direct reports), how anonymity works.
- Form with dynamic rows: First name, Last name, Email, Relationship (dropdown: manager / peer / direct report).
- "+ Add another peer" button. Min 3, max 8.
- Live counter ("3 of 8 peers added — minimum reached").
- Preview pane: "This is the email they will receive" — shows a realistic email card.
- Sent peers list below, with status per peer (Invited / Reminded / Responded / Declined) and a "Send reminder" action.

### 6. Results page (the emotional centerpiece)
The participant's personalized debrief. Must feel like opening a thoughtful letter, not a dashboard.
- Header with participant name and campaign title in serif.
- **FIRO Radar chart** with 6 axes (Inclusion-Expressed, Inclusion-Wanted, Control-Expressed, Control-Wanted, Affection-Expressed, Affection-Wanted). Two overlaid layers: their self-assessment vs the average of peer ratings.
- **Per-dimension cards** (Inclusion, Control, Affection): score gauge, short interpretation paragraph, side-by-side self vs peers comparison.
- **"A word from your coach" section**: rich Markdown-rendered text written by the coach. Distinct visual treatment — slightly inset, serif font, signed with coach name and date. If empty, show a gentle placeholder: "Your coach is preparing your debrief."
- **Reflective questions** at the bottom (3-5 open questions the coach wants the participant to think about before their next session).
- Download PDF button, discreet.

### 7. Profile / Settings
- Personal info (read-only name and email, since they come from the import).
- Change password.
- Notification preferences (email frequency).
- **Delete my account** (GDPR) — destructive button with confirmation flow.

## Key flows to render

1. **First-time activation**: invitation email → landing page → account creation → dashboard → start first questionnaire.
2. **Resume mid-questionnaire**: login → dashboard shows "Continue self-assessment (32 of 50)" → returns to exact question.
3. **Reading the debrief**: dashboard → "Read your debrief" → results page scrolls smoothly through radar → dimensions → coach letter → reflective questions.

## Reusable components

- Segmented progress bar (4 steps with labels and active/done/upcoming states).
- Likert pill scale (6 options, selected state).
- FIRO radar chart (2 overlaid datasets).
- Score gauge per dimension.
- Coach letter card (serif, signed, dated).
- Peer status row (status pill, reminder action).
- Reassurance / GDPR info card.
- Empty states (no campaign, no peers yet, no results yet) — illustrated softly, not childishly.

## Constraints

- Fully responsive, mobile-first.
- WCAG AA accessibility: high contrast, visible focus states, full keyboard navigation, screen-reader-friendly chart alternatives.
- French UI copy (but keep label lengths short and translatable).
- Never display competitive elements, scores out of 100, badges, or any gamification.
