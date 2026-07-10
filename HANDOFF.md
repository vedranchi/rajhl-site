# HANDOFF — Luka Rajhl website & reusable client-delivery system

> Living session-handoff doc. **In a fresh session, read this first**, then `CLAUDE.md`
> (auto-loaded), then the approved plan.
> Last updated: **2026-07-10**

## TL;DR — where we are
- **Milestone 1 (DONE):** the reusable client-delivery *system* is captured in the Obsidian
  vault (4 notes) and the vault projects are wired up. This was the user's explicit "step 1."
- **Design direction (2 concepts for client to pick — awaiting sign-off):** both keep the
  charcoal + violet palette.
  - **A — Elegant/editorial:** thin-serif (Didot) wordmark, ambient waveform →
    `https://claude.ai/code/artifact/a19ea157-c06f-4c43-a62b-3d2136cfe6c6` (`scratchpad/luka-landing.html`).
  - **B — Retro 2016 nostalgia:** media-player window, clickable retro tabs, Winamp transport,
    marquee, visitor counter → `https://claude.ai/code/artifact/8e0fc421-7392-46e8-adbe-de4eaf824fee`
    (`scratchpad/luka-landing-retro.html`). **Client chose B (retro).**
- **Build (DONE):** the retro landing is a real **Next.js 16 + React 19 + Tailwind v4** app —
  media-player window (Beats/Kits/Channels/About tabs + Winamp transport) + Telegram
  invite-form window. `pnpm build` / `pnpm dev` / `pnpm lint` all pass; SSR HTML verified.
  Placeholder content still (`src/data/content.ts`).
- **Next up:** deploy a Vercel preview for sign-off → swap in Luka's real content → add
  Payload + Supabase (needs the client's Supabase project).
- **Blocked on:** client inputs (domain, brand assets, copy, BeatStars/social URLs, Supabase
  project, Claude API key) — see **Inputs needed**.

## Who / what
- **User:** freelance developer (vchichovv@gmail.com), macOS. Building their *first* client
  website and, from it, a repeatable system for all future clients. Uses an Obsidian
  "knowledge-system" (Python-automated vault).
- **Client:** **Luka Rajhl** — young beat maker/producer, Skopje, Macedonia. Sells beats on
  **BeatStars**; growing **YouTube** + **Instagram**; has **Telegram**.
- **Two deliverables:** (A) the reusable delivery system → Obsidian; (B) the Luka site
  (public site now; admin analytics/AI dashboard as Phase 2).

## Decisions locked (from the interview — do not re-litigate)
| Topic | Decision |
|---|---|
| Commerce | Custom-branded UI, but **checkout/licensing/payouts stay on BeatStars** (embed + deep-link). Don't rebuild licensing. |
| Stack | **Next.js 16 (App Router) + TS + Tailwind v4 + shadcn/ui + Payload 3 (CMS) + Supabase + Vercel.** Reusable client template. (Scaffold installed Next 16, not 15.) |
| CMS engine | **Payload 3**, embedded in Next, content in Supabase Postgres; its auth/admin becomes the Phase-2 dashboard base. (User had never used a CMS; deferred the choice to me.) |
| Dashboard | **Phased** — ship the public site first (~3–4 wks); analytics/AI dashboard is Phase 2. |
| Analytics sources | Automate where APIs exist (**YouTube**; **Instagram only if Business/Creator**). **BeatStars = CSV/manual (NO public API).** AI ideas via **Claude API**. |
| Design | **Dark, moody, minimal.** Charcoal + muted violet, generous space, thin type. |
| Wordmark | **Elegant thin serif** (Italiana / Cormorant). |
| Language | **English only.** |
| Timeline | Polished MVP ~**3–4 weeks**. |
| Vault structure | New **"Client Delivery"** project holds the reusable playbook; this repo is its own **"Luka Rajhl"** project. |

**Design tokens (agreed):** bg `#0B0B0D` · surface `#141317` · elevated `#1C1B21` · text
`#EDECEF` / muted `#9A98A3` · violet accent `#8B7CC8` · deep `#5B4B8A` · hover-glow `#A594E0`
· hairline `rgba(255,255,255,0.08)`.

## Environment facts
- **Repo:** `/Users/vchichovv/Dev/clients/rajhl/personal-website` — currently **empty**
  (greenfield) apart from these docs; **not a git repo yet**.
- **Toolchain:** node **v25.6.1**, npm **11.9.0**, git **2.50.1**, Docker **29.2.1** present.
  **pnpm NOT installed** (enable via `corepack enable pnpm`). **psql NOT installed** (use
  Docker Postgres or Supabase).
- **Knowledge-system:** automation repo `~/Dev/knowledge-system` (run scripts with
  `~/Dev/knowledge-system/.venv/bin/python`). Vault at
  `/Users/vchichovv/Library/CloudStorage/GoogleDrive-vchichovv@gmail.com/My Drive/Obsidian Vault`.
  This repo now **detects to vault project "Luka Rajhl"** (`detect_project.py` → matched).

## Done (Milestone 1)
1. Registered two repo→vault mappings in `~/Dev/knowledge-system/config/settings.yaml`:
   `~/Dev/clients/rajhl` → **Luka Rajhl**, `~/Dev/clients` → **Client Delivery** (fallback for
   future clients; longest-prefix match).
2. Scaffolded both vault projects (`initialize_project.py`).
3. Created + wrote 4 notes under **Client Delivery** (via `create_note.py` + Edit):
   - `Tutorials/client-website-delivery-playbook.md` — full lifecycle playbook.
   - `Decisions/standard-client-web-stack.md` — the reusable stack + rationale.
   - `Resources/client-intake-questionnaire.md` — reusable discovery template.
   - `Resources/pre-launch-checklist.md` — reusable go-live gate.
4. Verified: `backlink_notes.py` (all reciprocal), `validate_documents.py`
   (**exit 0, no issues**), all 4 linked in `Index.md`.
- Approved plan: `/Users/vchichovv/.claude/plans/i-am-building-a-tender-rivest.md`.

## To do (next sessions)
**Milestone 2 — public site scaffold + landing prototype**
- [x] **Landing-page design prototype** (Artifact) — dark/moody/purple, elegant thin serif
  "Luka Rajhl", ambient waveform, social hub, Beats/Kits, placeholder catalogue. Published
  at `https://claude.ai/code/artifact/a19ea157-c06f-4c43-a62b-3d2136cfe6c6` (source
  `scratchpad/luka-landing.html`). **→ needs user sign-off before porting to Next.js.**
- [x] Scaffolded **Next.js 16 + React 19 + Tailwind v4** (pnpm via `npm i -g pnpm`), merged
  into the repo preserving the root docs. Fixed the pnpm `allowBuilds` gotcha (see CLAUDE.md).
- [x] Retro design system in `src/app/globals.css` (tokens, bevels, scanlines, grid); fonts
  via `next/font` (IBM Plex Mono + VT323). Components in `src/components/retro/`.
- [x] Landing `/` built as the media-player window (Beats/Kits/Channels/About tabs, transport,
  status bar) + Telegram invite window. Builds / runs / lints clean.
- [ ] Deploy a Vercel preview for sign-off + swap in Luka's real content.

**Milestone 3 — Beats/Kits + CMS**
- [ ] Add Payload 3 (Postgres adapter → Supabase; Supabase Storage adapter for uploads);
  admin at `/admin`.
- [ ] Collections: `beats`, `kits`, `media`, `users`; global `siteSettings` (bio, tagline,
  socials, SEO).
- [ ] `/beats` custom browser (cover, BPM, key, tags, audio preview, "License on BeatStars"
  deep-link) + optional BeatStars embed. `/kits` (cover, demo, contents, price, buy link).
- [ ] SEO plumbing: metadata, OG images (`next/og`), sitemap, robots, schema.org.

**Launch**
- [ ] QA via the `pre-launch-checklist` note; Lighthouse ≥ 90; a11y; deploy to Vercel;
  custom domain + HTTPS; analytics; Sentry; DB backups.

**Phase 2 — admin dashboard** (after the site launches)
- [ ] `/dashboard` gated by Payload auth. Tables: `metrics_snapshots`, `ideas`, `imports`.
- [ ] Integrations: YouTube Data/Analytics API (channel OAuth), Instagram Graph API (if
  business acct), BeatStars CSV import, a trending source. Vercel Cron for periodic pulls.
- [ ] AI **Ideas Generator** (Claude API) — beat titles, video concepts, hooks, tags,
  posting schedule. Use the `dataviz` skill for charts.

## Inputs needed (unblock the build)
- **Domain** (own `lukarajhl.com`? registrar access) or buy one.
- **Brand assets:** logo, photos, reference sites, any color tweaks.
- **Copy:** bio/artist statement, tagline, genre descriptors.
- **Links:** BeatStars store (+ per-beat URLs), where kits are sold, YouTube channel,
  Instagram handle, Telegram channel.
- **Supabase project** (create → `DATABASE_URL` + keys) for Payload/DB.
- **Phase 2:** Instagram account type (Business/Creator?), YouTube OAuth willingness,
  BeatStars CSV export, **Claude API key** + budget.
- Confirm **free-tier hosting** (Vercel Hobby, Supabase Free) to start.

## How to resume in a fresh session
1. Run `~/Dev/knowledge-system/.venv/bin/python ~/Dev/knowledge-system/scripts/detect_project.py --json`
   → confirms vault project "Luka Rajhl"; read its `.claude/*` context.
2. Read this `HANDOFF.md`, then `CLAUDE.md` (auto-loaded), then the plan file.
3. Check the task list; pick up at the first unchecked **To do** item. If blocked, request
   the **Inputs needed**.
4. When you learn something durable: rules/gotchas → append to `CLAUDE.md`; engineering
   knowledge → a vault note via the knowledge-system scripts (search first; never hand-edit
   frontmatter/Index).

## Key locations
- Plan: `/Users/vchichovv/.claude/plans/i-am-building-a-tender-rivest.md`
- Vault notes: `…/Obsidian Vault/Projects/Client Delivery/{Tutorials,Decisions,Resources}/`
- KS scripts: `~/Dev/knowledge-system/scripts/` (venv `~/Dev/knowledge-system/.venv/bin/python`)
- This handoff + rules: repo root `HANDOFF.md`, `CLAUDE.md`.
