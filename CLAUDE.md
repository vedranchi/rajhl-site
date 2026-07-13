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
- **BeatStars has NO *documented* public API.** Sales/analytics data = **CSV import / manual
  only**. **Never scrape at runtime** (ToS + fragility) — the live site must make zero calls
  to BeatStars.
- **Catalogue deep-links + popularity (done 2026-07-10):** there IS an undocumented but
  public, unauthenticated read path — their **Algolia search index** (app `NMMGZJQ6QI`, index
  `public_prod_inventory_track_index` / `…_soundkit_index`, filter `memberId:MR1947497`,
  `Referer: https://www.beatstars.com/` required, **caps at 100 hits/page → paginate**) plus
  the **v2 read API** (`https://main.v2.beatstars.com/track?id=` / `…/soundkit?id=`) for
  canonical URLs. Each Algolia hit carries `activities.{play,sale,like}` — **popularity =
  `activities.play`**. `scripts/fetch-beatstars.mjs` pages through all items, ranks by plays,
  and bakes the **top 10** beats + up to 10 kits into `src/data/beatstars-catalogue.json`
  (real `/beat/<slug>` + `/sound-kits/<slug>` links, duration, price, play count). Re-run to
  refresh; commit the JSON. **Never** call these endpoints from the app at request time.
  Gotchas: the `bsta.rs/k/<id>/` kit short-link redirects to a *private* pro-page — use the
  v2 `relative_uri` (`/sound-kits/<slug>`) instead; Algolia rejects requests without the
  Referer header.
- **Auto-refresh:** `.github/workflows/refresh-catalogue.yml` runs the fetch script every 6h
  (+ manual dispatch), commits the JSON if it changed, and pushes to `test-prod` → Vercel
  redeploys. This is how the top-10 re-ranks automatically as plays change / new kits appear.
  **Scheduled workflows only fire from the DEFAULT branch's copy of the file** — it activates
  once `test-prod` merges to `main`; until then use *Run workflow*. Update `BRANCH` when the
  Vercel production branch is finalised. The UI shows only the top 10; a **"Browse all N on
  BeatStars" CTA** (`.browseall`) links out for the rest — this is the "clean hand-off."
- **Browser audio = the most-popular beat.** The stable redirect endpoint
  `https://main.v2.beatstars.com/stream?id=<numericId>&return=audio` 302s to a fresh signed
  S3 mp3 each request (so it never expires). The transport plays it as **plain opaque
  cross-origin media — do NOT set `crossOrigin`** (the S3 leg has no CORS headers; requiring
  CORS would break playback). This one client-side call to BeatStars is embed-like (a preview,
  like the Spotify iframe), the sole exception to "the site never calls BeatStars." The
  synthesized loop is the **fallback** if the stream errors.
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
  (`open.spotify.com/embed/playlist/<id>`) in its own **`SpotifyWindow`** that sits **beside
  the invite form** in a `.bottomrow` flex row (client asked for it next to the form, not a
  tab) — no API key needed, works with Spotify's CSP. Don't proxy or scrape Spotify.
- **Transport player is real:** `src/components/retro/Player.tsx` (client) drives an
  `<audio>` element with live seek/elapsed, and plays a short synthesized **Web Audio**
  "retro blip" on every control press (square-wave chiptune, no asset). Source = the
  most-popular BeatStars beat (streamed, see above); the 15s synthesized loop at
  `public/audio/placeholder-loop.wav` is the fallback. The **File/Play menu** can drive it
  via the `lr:toggle-play` window CustomEvent.
- **Menu bar is interactive** (`src/components/retro/MenuBar.tsx`, client): File (open
  store/Spotify), Edit (copy links → toast), View (toggle CRT scanlines / vaporwave grid via
  `body.no-scanlines` / `body.no-grid` classes), Play (drive transport), Help (retro About
  modal). The scanlines/grid are togglable because the grid moved to `body::before` and
  scanlines stay on `body::after`. Hidden on mobile.
- **Beats table:** no BPM/Key columns (client asked to drop them); shows rank · title ·
  **play count** · time · license, top-10 only.
- **React 19 lint is strict:** `react-hooks/refs` forbids reading a `ref.current` in any
  function reachable from render (even handlers) — use effects/state instead;
  `react-hooks/purity` forbids `Date.now()`/`new Date()` in render — hoist to module scope.

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
- **`pnpm generate:types` / `pnpm generate:importmap` FIXED (2026-07-12).** Root cause
  (confirmed against upstream `payloadcms/payload#15701` and `#15875`): the Payload CLI's bin
  scripts load `payload.config.ts` via `tsx`'s CJS `require()` hook; without
  `"type": "module"` in `package.json`, that hook falls through to `require()` for ESM
  dependencies in the graph (`@payloadcms/richtext-lexical`, top-level await), which Node's
  synchronous `require(esm)` interop explicitly refuses (`ERR_REQUIRE_ASYNC_MODULE` — by
  design, not a bug, and **not Node-v25-specific** — it applies on any Node ≥22.12). **Fix:**
  added `"type": "module"` to `package.json`; the CLI now uses `import()` instead. Both
  `pnpm generate:types` (writes `src/payload-types.ts`) and `pnpm generate:importmap` (fixed
  the `PayloadComponent not found: @payloadcms/next/rsc#CollectionCards` admin warning) now
  succeed and are regenerated/committed. Re-run either after changing collections. Dead end
  for reference: `NODE_OPTIONS=--no-experimental-require-module` does **not** fix this — it
  just trades `ERR_REQUIRE_ASYNC_MODULE` for an earlier `ERR_REQUIRE_ESM` on
  `@payloadcms/db-postgres`'s own ESM build. Don't retry that route.
- **Remaining Node v25 / Turbopack-dev-only symptom (still open, 2026-07-12):**
  `/api/graphql` **500s under `pnpm dev`** — Turbopack's own external `require()` of ESM
  `graphql@17` hits the same kind of `require(esm)` race (`ERR_INTERNAL_ASSERTION: … not yet
  fully loaded`), a **different code path** than the CLI fix above (this is Turbopack's dev
  bundler, not `tsx`), so `"type": "module"` does not resolve it. **Production is
  unaffected** — reverified 2026-07-12 via `pnpm build` + `pnpm start`:
  `POST /api/graphql` returns real data (`{"data":{"__typename":"Query"}}`). Test GraphQL
  against a prod server, don't chase the dev 500.
- **Invite-requests access control VERIFIED (2026-07-11 local prod build; re-verified against
  DEPLOYED Production 2026-07-13):** anonymous `GET`/`POST /api/invite-requests` → 403
  (`"You are not allowed to perform this action."`), `PATCH`/`DELETE` → 400 (missing-id, no
  unauthorized write); GraphQL `createInviteRequest` → 403-in-envelope. `/admin` and `/` both
  200. The `create: () => false` keystone works; server-action writes go through the Local API
  (`overrideAccess` default). See §12/§14 of
  `docs/plans/private-group-invite-payload-plan.md`. **Not yet exercised end-to-end on the
  deployed site:** live form submit → row + Resend email, dedupe, and rate-limit — these run
  through a React-dispatched server action (no plain REST/curl path) and need a real browser
  submission or an authorized prod-DB read to confirm.
- **Supabase project is live and wired to Vercel (done 2026-07-11):** project ref
  `dgaiclbbmmqylvtajetc`, connected via the Vercel↔Supabase marketplace integration under
  Vercel project `vedran-chichov/rajhl-site`. This auto-injected `POSTGRES_*` / `SUPABASE_*`
  env vars into Vercel scoped to **Production only** (not Preview/Development) — pull them
  with `vercel env pull .env.local --environment=production` if a fresh machine needs them
  (this is a real secrets pull; don't run it without the user asking). Local `.env`
  `DATABASE_URL` is hand-set to the **pooler** URI (`aws-0-eu-central-1.pooler.supabase.com:6543`,
  username `postgres.dgaiclbbmmqylvtajetc`) — the same one used in prod, so **local `pnpm dev`
  now pushes schema against the live production DB**, there's no separate dev database yet.
  First Payload admin user was created via the browser at `/admin`. Revisit whether
  dev/preview need their own DB before this matters (e.g. before seeding test data at volume).
- **Payload prod-DB connection GOTCHAS (fixed 2026-07-13, PRs #3–#5) — production `/admin` +
  `/api/*` had 500'd since first deploy; three chained causes, all in `src/payload.config.ts`:**
  1. **`PAYLOAD_SECRET` was never set on Vercel Production** (only local `.env`) → Payload
     `init` threw `missing secret key`. Added it to Vercel Prod, **reusing the exact local
     value** so it matches the secret that signed the existing admin user's JWT. `secret:`
     still reads `process.env.PAYLOAD_SECRET || ""` — the `|| ""` masks a missing secret as a
     deep runtime error instead of a loud boot failure; harden later.
  2. **The config read `process.env.DATABASE_URL`, which does NOT exist on Vercel.** The
     Supabase↔Vercel integration injects **`POSTGRES_URL`** (+ `POSTGRES_URL_NON_POOLING`,
     etc.), never `DATABASE_URL` — that name only exists because local `.env` sets it by hand.
     Fix: `connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || ""` (local
     still wins locally; prod falls through to the integration-managed var → survives credential
     rotation, no duplicate pinned secret).
  3. **Supabase's cert is self-signed AND `POSTGRES_URL` carries `sslmode=require`.** Recent
     node-postgres coerces `require`→`verify-full`, so it rejects the chain
     (`self-signed certificate in certificate chain`). **Setting `ssl: { rejectUnauthorized:
     false }` alone did NOT fix it** — the `sslmode` string param **overrides** the explicit
     `ssl` option. Fix: a `pgConnectionString()` helper that **strips `sslmode`/`ssl` from the
     URL** so the explicit `ssl` option applies (TLS stays on; only the chain check is skipped).
     Verified against the live DB: `require`-only and `require`+`ssl`-object both fail;
     stripped+`ssl`-object connects (`select 1` → ok). Local `DATABASE_URL` (pooler, no
     `sslmode`) never hit this. Hardened alternative if full verification is wanted later:
     bundle Supabase's CA and pass `ssl: { ca }`.

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
