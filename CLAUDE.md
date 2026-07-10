# CLAUDE.md — working rules for this repo

> **Auto-loaded each session.** This is the living rules/restrictions file — **append new
> rules, patterns, and gotchas as they emerge.** For current status & next steps see
> `HANDOFF.md`. Full plan: `~/.claude/plans/i-am-building-a-tender-rivest.md`.

## What this is
Website for **Luka Rajhl** (beat producer, Skopje) — the user's first client — built as the
first instance of a **reusable client-site template**. Public site first; analytics/AI admin
dashboard is Phase 2. The reusable *process* lives in the Obsidian vault (see Knowledge
system, below).

## Stack & conventions
- **Next.js 16 (App Router) + TypeScript**, **Tailwind + shadcn/ui**, **Payload 3** (CMS,
  embedded, `/admin`), **Supabase** (Postgres + Storage), **Vercel**. Package manager
  **pnpm**.
- ESLint + Prettier, conventional commits, Playwright smoke tests, typed env, `.env.example`.
- `src/` dir; import alias `@/*`.

## Hard rules / restrictions (learned)

### Knowledge system (Obsidian vault)
- Vault knowledge is **Markdown, script-managed**. **NEVER hand-edit** note frontmatter
  (`updated`, `tags`, `related`) or `Index.md` — use the scripts: `create_note.py`,
  `update_note.py`, `update_index.py`, `backlink_notes.py`, `archive_note.py`. Run them with
  `~/Dev/knowledge-system/.venv/bin/python`.
- **Search before writing** (`search_notes.py`); **ask before creating/registering/
  scaffolding**. Propose an update to an existing note rather than duplicating.
- Filling a note's body **is** done with the Edit tool (that's expected); only the
  frontmatter/index bookkeeping must go through scripts.
- Don't touch the vault's `Main/` or `tags/` folders — this system owns `Projects/` only.
- This repo ↔ vault project **"Luka Rajhl"**; the reusable playbook ↔ **"Client Delivery"**.

### Product / domain
- **Do NOT rebuild commerce/licensing.** BeatStars owns checkout, leases (MP3/WAV/exclusive),
  contracts, and payouts. We only **embed / deep-link**.
- **BeatStars has NO public API.** Dashboard sales data = **CSV import / manual only**. Do not
  scrape (ToS + fragility).
- **Instagram Graph API** needs a **Business/Creator account + linked Facebook Page + Meta app
  review**. Treat as conditional; manual fallback. (Instagram Basic Display was deprecated.)
- **YouTube:** public stats via Data API v3 (API key); private metrics (watch time, revenue)
  need channel-owner **OAuth**.
- **Telegram:** rich channel analytics aren't available via API — treat as a link.

### Design
- **Palette is fixed:** dark charcoal + muted violet. **Do not** drift to light themes.
- **Chosen concept (client-approved): Retro 2016 media-player.** A desktop-window UI —
  beveled 3D chrome, violet gradient title bar, notched folder **tabs**
  (Beats / Kits / Channels / About), Winamp-style transport bar, marquee ticker, CRT
  scanlines, a faint vaporwave grid, **monospace** type. A **design-only invite form**
  (username + email → private Telegram group) sits in a second window. Reference artifacts:
  retro `8e0fc421-7392-46e8-adbe-de4eaf824fee`; elegant thin-serif alternate (shelved, not
  deleted) `a19ea157-c06f-4c43-a62b-3d2136cfe6c6`. Source mockups in `scratchpad/`.
- Tokens: bg `#0B0B0D` · surface `#141317` · elevated `#1C1B21` · text `#EDECEF` / muted
  `#9A98A3` · accent `#8B7CC8` · deep `#5B4B8A` · glow `#A594E0` · hairline
  `rgba(255,255,255,.08)`. Retro extras: bevel-light `rgba(255,255,255,.13)`, bevel-dark
  `rgba(0,0,0,.62)`, line `#050506`, well `#101014`.
- **Retro accent pass (2026-07-10, user-approved):** phosphor-amber `#E6B45A` for LED-style
  readouts (marquee, visitor counter, transport time), vaporwave magenta `#A66FB5` as the
  titlebar-gradient tail + a faint bottom "horizon" glow, LED green tokenized as `--led`
  `#7FE0A4`. Amber/magenta are *readout/tint* colors only — violet stays the primary accent;
  still no light themes.
- **Spotify:** playlist embedded via the official iframe
  (`open.spotify.com/embed/playlist/<id>`) in a dedicated "♫ Playlist" tab — no API key
  needed, works with Spotify's CSP. Don't proxy or scrape Spotify.

### Build / ops
- **Payload on Vercel is serverless — no local disk.** Use the Postgres adapter (Supabase) +
  an **S3/Supabase Storage adapter** for uploads. If the CMS gets heavy, host Payload on a
  Node platform (Railway/Fly) and keep the marketing site on Vercel.
- **Secrets never committed.** Env in Vercel/Supabase stores; `.env.example` documents keys.
- **Client owns the accounts** (domain, hosting, analytics, social/API). We take delegated
  access only — never park the client's business on personal accounts.
- **Git:** don't commit or push unless asked. Branch off `main` first. Commit footer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **create-next-app note:** `CLAUDE.md` + `HANDOFF.md` already live at repo root. When
  scaffolding, run `create-next-app .` in place; if it refuses because the dir isn't empty,
  scaffold in a temp dir and merge back, **preserving these two files**.
- **pnpm build gotcha (Next 16 + pnpm 11):** pnpm's `verify-deps-before-run` runs an install
  before `pnpm build`; it exits 1 while the `sharp` / `unrs-resolver` build scripts are
  unapproved. Fix (done): set `allowBuilds: { sharp: true, unrs-resolver: true }` in
  `pnpm-workspace.yaml`, then run `pnpm install` once so the scripts execute.

### Artifacts / design previews
- Artifact CSP **blocks external fonts/images/scripts** — inline everything (data URIs). For
  local macOS previews of the "elegant thin serif," system **Didot / Bodoni 72 / Hoefler
  Text** render well. Load the **artifact-design** skill before building an Artifact; the
  **dataviz** skill before any chart.

## Build order (phasing)
1. **Marketing/retro site first** — Next.js 15 + Tailwind, no CMS/DB. Port the retro mockup
   into React components; polish later (client said "polish will come later").
2. **Add Payload 3 + Supabase later** — additive, once the client provides a Supabase project
   (`DATABASE_URL` + keys). Don't block the site build on it.
3. **Invite form is design-only for now.** Later: a Next.js **server action** emails
   submissions to the client (Resend/Postmark — client flagged "sent to the client's email")
   and optionally returns the private Telegram invite link + stores the lead in Supabase.
4. **Fonts:** retro currently uses **system monospace**. Consider a retro face via `next/font`
   (e.g. IBM Plex Mono / VT323 / Press Start 2P) as polish — never a CDN `<link>`.

## Environment
- node **v25.6.1**, npm **11.9.0**, **pnpm 11.11.0** (installed via `npm i -g pnpm`; corepack
  absent), git **2.50.1**, Docker **29.2.1**. **psql** not installed → use Docker Postgres
  locally or Supabase.
- Scaffolded on **Next.js 16 + React 19 + Tailwind v4** (CSS-first `@theme`, no
  `tailwind.config.js`). Retro theme lives in `src/app/globals.css`; components in
  `src/components/retro/`; placeholder data in `src/data/content.ts`.
- Repo: `/Users/vchichovv/Dev/clients/rajhl/personal-website` (greenfield; not yet git-init'd).

## Process
- Interview before big decisions; **prototype the landing page and get sign-off before the
  full build** (per the delivery playbook).
- After meaningful work, capture durable knowledge: rules/gotchas → here; engineering notes →
  the vault (scripts).

## Commands
```bash
# Knowledge system
KS=~/Dev/knowledge-system; PY="$KS/.venv/bin/python"
"$PY" "$KS/scripts/detect_project.py" --json                       # which vault project is this repo
"$PY" "$KS/scripts/search_notes.py" "terms" --project "Luka Rajhl" --json
"$PY" "$KS/scripts/create_note.py" "Title" --project "Luka Rajhl" --category Architecture --tags a,b --related slug
"$PY" "$KS/scripts/validate_documents.py" --project "Luka Rajhl"
# App commands (added once scaffolded): pnpm dev · pnpm build · pnpm test
```
