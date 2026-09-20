# Changelog

## 2026-09-20 — ci pipeline ~40s faster

- Registry snapshot validation runs via `uvx awescholar verify --agentx`
  (uv provided by `astral-sh/setup-uv`, ~4s) instead of a two-step
  `pipx install` + run — the pipx install alone took ~23s per run.
  (First attempt assumed uv ships on the runner image; it does not —
  `uvx: command not found` — fixed by the setup action.)
- The deploy job installs the pinned Vercel CLI into a `~/.vercel-cli`
  prefix cached by `actions/cache` keyed on the pinned version, skipping
  the ~19s global `npm install` on every cache hit.

## 2026-09-20 — deployment docs match the CI deploy

- Production has shipped by push since a63a33a (2026-09-19): the `deploy`
  job in `ci.yml` runs `vercel deploy --prod --yes` once `verify` (lint,
  tests, snapshot validation, type check, build) is green on pushes to
  `main`. AGENTS.md and docs/DEVSETUP.md still described the pre-CI flow
  ("website code ships by manual `vercel --prod`", "pushing to main does
  **not** deploy the code") — both now describe the CI pipeline, with the
  manual CLI deploy kept as the documented hotfix path, and the DEVSETUP
  CI checklist now mentions the snapshot-validation and deploy steps it
  was missing.

## 2026-09-20 — the site URL is in the README, and AI surfaces link back

- Both READMEs now lead with the live site (website badge + a
  `https://agentx.webioinfo.top/` line in the intro) and link the
  feature paths (`/agents`, `/compare`, `/reports`, `/samename`) to the
  deployed pages, so readers — human or model — land on the site from
  GitHub.
- The "Public API and skills" section states the base URL once and lists
  every read-only endpoint as an absolute URL, newly including
  `/llms-full.txt`; the endpoints were bare paths before, unusable as-is
  by an AI reading the README on GitHub.
- `llms.txt` / `llms-full.txt` gained Graveyard and registry-source
  links (the full index also got the same-name groups link it was
  missing), and the homepage Organization JSON-LD now carries
  `sameAs` → the GitHub repository. `/graveyard` is in the sitemap.

## 2026-09-19 — registry badges follow the snapshot

- README agent, category, paper-backed, and update-month badges are now
  generated from `data/agents-snapshot.json` by the refresh and paper-enrichment
  workflows, with a Vitest drift guard for manual snapshot changes.
- Corrected the stale registry counts in both language versions, removed the
  obsolete closed-mode `src/proxy.ts.disabled` file, and cleaned the ignored
  local Prisma development database.

## 2026-09-19 — curation commands are awescholar-native again

- **The `agentx add/enrich/backfill/validate` aliases are gone** (removed
  in awescholar v0.3.2). Registry curation now runs through awescholar's
  native commands everywhere: `awescholar updater add/enrich/backfill
  --agentx` and `awescholar verify --agentx`. Workflows (`refresh.yml`,
  `papers.yml`, `ci.yml`), DEVSETUP/CONTRIBUTING/README and the contribute
  page all use the native spellings.
- **Hub operations moved to the reborn npm CLI.** `agentx-hub-cli` v0.2.0
  (`agentx sync | moderate | mirror`) wraps this repo's own scripts and
  workflows: local `db:apply-snapshot`/`reviews:moderate`, or dispatch of
  `sync-db`/`sync-public`. The `agentx` command name now belongs to that
  package alone.

## 2026-09-19 — snapshot-apply reconciles with minimal writes

- **`applySnapshot` no longer does two DB round trips per agent.** It read
  the full table once, diffs each snapshot row against the in-memory copy,
  and writes only rows that actually drifted; review counts for deletion
  candidates (superseded paper stubs, orphans) come from one `groupBy`.
  An idle sync-db run drops from ~8.5 minutes (≈500 sequential round trips
  to Neon) to a handful of queries.
- **Full-table reconcile semantics are unchanged:** the snapshot is still
  the only write path, row-level drift (re-seeds, manual fixes) is still
  detected on every run — unchanged rows are simply not rewritten.
- **`githubFetchedAt` now means "when apply last changed this row"** (it
  used to be stamped on every apply, even no-op ones). Same for the row's
  `updatedAt`. `created`/`updated` in apply logs are now exact counts.

## 2026-09-18 — `agentx`: the hub's command name is back

- Registry commands across docs, workflows and the contribute page now use the short `agentx` CLI — `agentx add | enrich | backfill | validate` — shipped by the `awescholar` Python package (v0.3.0+) as a pure alias over the same `updater … --agentx` / `verify --agentx` commands. Identical behavior, gates and defaults; `refresh.yml`, `papers.yml` and the CI validate step now invoke it.

## 2026-09-18 — awescholar is the sole registry CLI; TS data scripts retired

- **`pnpm snapshot` / `agent:add` / `validate` / `agentx` / `enrich:papers` /
  `refresh:citations` removed, along with the seven one-off backfills and
  `scripts/lib/`.** Every one duplicated a native awescholar command
  (`updater add/enrich/backfill --agentx`, `verify --agentx`) — the TS
  lifecycle pass in `snapshot.ts` was a second implementation of the exact
  policy that already lives in `awescholar/agentx/transform.py`. Remaining
  `pnpm` scripts (`db:apply-snapshot`, `db:seed:demo`, `db:studio`,
  `reviews:moderate`) are site/DB operations, not registry operations.
- **CI runs awescholar directly.** `refresh.yml` (daily metrics + lifecycle)
  and `papers.yml` (weekly paper-meta + citations backfill) dropped the
  pnpm/node setup entirely — the daily job no longer installs 400 npm
  packages to run a Python CLI.
- **`/contribute` maintainer instructions now show the awescholar command**
  instead of the removed `pnpm agent:add`.

## 2026-09-18 — one `agentx` skill; public docs tell the truth

- **`agentx-search` / `agentx-recommend` / `agentx-compare` merge into one
  `agentx` skill.** They were three thin wrappers over the same read-only
  API, with a triplicated setup section and a compare→search dependency
  baked in; one skill keeps a single setup, one signals guide, and covers
  all three trigger families. Install:
  `npx skills add webioinfo01/agentx-hub -g -y`, or with
  [aweskill](https://github.com/wehuman01/aweskill):
  `aweskill store install Webioinfo01/agentx-hub --all`.
- **`docs/API.md` added.** The full public API reference now lives in this
  repository (synced to the public hub) instead of only the private site
  repo; `/developers` renders the same content.
- **CONTRIBUTING.md rewritten for what this repository actually is.**
  The public doc now covers the registry pipeline (awescholar on any
  checkout), the skill, and the honest repo layout; the site development
  setup moved to `docs/DEVSETUP.md` (private repo only, not synced). The
  License section no longer claims `src/` / `scripts/` / `prisma/` trees
  that are not published here.
- `sync-public.yml` allowlist extended with `docs/API.md`.

## 2026-09-17 — snapshot-apply drops superseded paper placeholders

- **`hemaguide` / `hemaguide-2` was a false duplicate.** An import first
  wrote a no-repo stub (`repo=nature.com/s41591-026-04494-4`); the same
  paper later arrived with a real GitHub repo. Upsert-by-repo treated the
  migration as a new agent and suffixed the slug to `hemaguide-2`, leaving
  the review-free stub forever (prune only targeted `source: "snapshot"`).
- **`applySnapshot` now self-heals this class.** Before upserting, any
  `status: "no-repo"` stub whose paper matches a snapshot entry under a
  *different* repo is deleted when it has no reviews, so the real entry
  claims the original slug. Reviewed stubs are left alone.
- **Local `dev.db` cleaned for the existing pair:** paper stub removed,
  `hemaguide-2` renamed to `hemaguide` to match the snapshot.

## 2026-09-17 — `agentx` goes standalone: agentx-hub-cli

- **The operator verbs now install with npm.** `add`, `validate`,
  `snapshot`, `enrich-papers` and `refresh-citations` ship as the
  open-source [Webioinfo01/agentx-hub-cli](https://github.com/Webioinfo01/agentx-hub-cli)
  package (`npm i -g agentx-hub-cli`; the scoped `@webioinfo/agentx-cli`
  spelling was renamed away the same day). `agentx <verb> --root <dir>`
  maintains any checkout of `data/agents-snapshot.json` without this repo's
  scripts; pointed at this repo, its `validate` returns the same verdict as
  the CI gate (208-agent snapshot: identical output).
- **This repo keeps `pnpm agentx` unchanged**, plus the DB-bound `apply` and
  `moderate`, which stay site-only (Prisma).
- **Registry policy is now mirrored in two places.** Categories, the tag
  registry, venue aliases and the status rules live in both repos; a policy
  change must land in both in the same change until the website consumes the
  published package (see docs/CONTRIBUTING.md).

## 2026-09-16 — `pnpm agentx` operator CLI + offline snapshot validation

- **One stable name for the operator commands.** `pnpm agentx <verb>` maps
  short verbs (`add`, `snapshot`, `validate`, `apply`, `enrich-papers`,
  `refresh-citations`, `moderate`) onto the existing pnpm scripts — the
  scripts stay the single source of truth, the CLI only adds the unified
  spelling and a `--help` listing.
- **"Never hand-edited" is now a check, not a comment.** New
  `pnpm agentx validate` (wired into CI) re-derives the writer invariants
  offline — no network, no DB: snapshot shape, `counts.total` against the
  agents list, stable slug order and uniqueness, unique repos, registered
  categories and tags (incl. the tag policy), githubUrl/repo agreement
  (`null`, or exactly `https://github.com/${repo}`),
  status vocabulary, retirement metadata on graveyard records only, and
  paperMeta field types. First run against the live snapshot: clean.
- **Three rule calibrations documented in code**: `paperMeta.citations: null`
  is legal (papers Semantic Scholar does not index), slug underscores
  are grandfathered (the legacy transform slugify kept them; current
  writers never emit them), and githubUrl checks shape-blind agreement —
  a host-shaped identity like `anthropic.com/claude-science` is
  string-indistinguishable from a dotted GitHub owner, so "null or the
  canonical GitHub URL" is the only rule writers actually guarantee.

## 2026-09-15 — Citations on cards and a paper-only "Top cited" sort

- **Citation counts join the card footer.** Paper-backed agents now show their
  Semantic Scholar citation count right beside the star count (graduation-cap
  glyph, same k-formatting); agents without a paper render nothing extra.
- **"Top cited" is a paper-backed view.** The new order dropdown entry shows
  only agents with a companion paper, ranked by citation count (records
  without a count yet rank last, ties by stars); agents without a paper leave
  the list entirely, and every other sort still shows the full directory.

## 2026-09-15 — Paper citation counts (Semantic Scholar)

## 2026-09-15 — Paper citation counts (Semantic Scholar)

- **Agent paper records now carry a citation count.** `paperMeta` gains a
  `citations` field taken from Semantic Scholar's citationCount (via
  awescholar ≥ 0.2.2, which now returns it from `updater search`); the
  companion-paper card shows it in a "Citations" row next to the year, and
  the Google Scholar link stays for the full list. Records the API does not
  index (bionemo-framework's blueprint doc, STELLA) simply render no row.
- **New `pnpm refresh:citations` script** re-queries every agent that already
  has a `paperMeta` record — DOI-first, stored-title fallback — and updates
  only the `citations` field, so counts can drift-refresh without a full
  `--force` re-enrichment that would clobber backfilled fields. First run
  filled 53 of 55 paper-backed agents.
- **`awescholarSearch` moved to `scripts/lib/scholar.ts`** and now chunks
  queries (10 per CLI call): the shared rate-limited pool resolves one
  identifier per request at ~10s, so a 53-query batch reliably blew the
  per-call timeout before chunking.

## 2026-09-15 — UX pass: compare quick-add, staged browsing, honest empty states

- **Add-to-compare from any agent card.** Cards now use a stretched link so a
  real "add to compare" button can live inside them; the selection persists in
  localStorage, `/compare` restores it when the URL carries no `?ids=`, and
  every change on the compare page writes back. Deep links still win.
- **`/compare` empty state starts from a field** — chips link straight to the
  most-starred trio overall and each category's top three, so nobody has to
  know agent names before comparing.
- **`/agents` renders in batches** — first 30 cards, then "Show more" (30 per
  click, reset on every filter change) instead of mounting 139 cards at once.
- **Mobile filters collapse**: tag chips and the language/venue/status selects
  fold behind a "Filters (n)" toggle on small screens; desktop is unchanged.
- **Search now covers the companion paper** — paper title and enriched venue
  join name/repo/description/tags in `matchesAgentFilters`.
- **Empty search results offer "Clear all filters" in place**, not only in the
  toolbar.
- **Hero stat card swaps "community reviews" for "repos pushed this month"** —
  a number the registry can stand behind while review volume grows.
- **Home search gained example chips** (drug discovery · RNA-seq · literature ·
  protein); the showcase row is retitled "Explore by field".
- **Agent records close the loop**: a "More in <field>" row of same-category
  cards at the bottom, plus a "GitHub metrics refresh daily — last fetched …"
  line on the identity card.
- **Review form validates live**: a checklist (evidence URL · ratings n/5 ·
  review length) tracks the server-side rules, submit enables only when they
  pass, the body shows a character counter, and each rating dimension carries
  a hover hint explaining what it asks.
- **Report stat labels pluralize correctly** — "1 review this month" instead
  of "1 reviews this month" (`pluralize` in `lib/format.ts`).

## 2026-09-15 — Facet counts follow the other active filters

- **Category, tag, language, status, and venue counts on `/agents` now
  respect every other active filter** (query, category, tag, language,
  status, venue). Selecting `language=Rust` shrinks the tag chips and
  category pills to what Rust agents still carry; selecting a status
  updates the rest the same way. Previously only tag counts followed
  category, so a chip could advertise agents that language/status had
  already filtered out.
- **Shared matcher in `lib/picker.ts`**: `matchesAgentFilters` (with
  `except` so each facet counts over the remainder set), `countFacet`,
  and `countVenueFilters` are the single source of truth for both the
  result list and the facet UI. Language/venue option lists stay fixed
  but now show live counts; a selected category/status/tag stays visible
  even when its count drops to 0.
- **Server first-draw of tag chips** on `/agents` deep links uses the same
  scoped counts, so hydration matches a URL like
  `?tag=Digital-Discovery&status=stale`.

## 2026-09-15 — README re-scoped to site usage; technical detail moves to docs/CONTRIBUTING.md

- **New docs/CONTRIBUTING.md** — contributor-facing: engineering taste,
  development setup with the env-var table, snapshot-as-source-of-truth
  architecture, the full maintainer add pipeline (command, categories, tag
  policy), awescholar paper enrichment with the weekly workflow, GitHub
  metrics and license fallback, scripts, testing/CI, changelog and project
  layout conventions.
- **README.md / README_cn.md slimmed to "how to use the website"**:
  browse / compare / review / reports / samename, review rules, the public
  suggest-an-agent route (maintainer pipeline now a one-line pointer to
  CONTRIBUTING), API + skills, roadmap. Stack, setup and scripts tables
  moved to CONTRIBUTING.
- **Data sources section lists the three references prominently**:
  claw4science.org (historical import), Awesome AI Meets Biology (curated
  bio-agent import) and awescholar (maintenance tool, Semantic Scholar
  paper metadata), plus the daily GitHub API refresh.

## 2026-09-15 — Bilingual README with an expanded Adding-an-agent section

- **README rewritten as a bilingual pair.** Centered hero block (icon,
  tagline, language toggle, badges) modeled on the awescholar READMEs;
  `README_cn.md` mirrors it in Chinese. Agent count now reads "160+"
  instead of a number that goes stale with every add.
- **Adding an agent is now a full section**, covering both routes: the
  public issue channel (criteria, what happens next) and the maintainer
  pipeline (`pnpm agent:add` with all flags, the 9-category table, tag
  policy, `GITHUB_TOKEN` note).
- **awescholar named as one of the site's maintenance tools** in the data
  section (paper metadata via Semantic Scholar), alongside the GitHub API
  and the historical imports.
- **About and data-sources pages aligned with the README.** About drops
  "invocation" from the positioning (sandbox is roadmap) and the shipped
  "Public API" roadmap item, and adds awescholar to data provenance.
  Data-sources gains an awescholar source card (weekly retry workflow) and
  the NOASSERTION license fallback in the GitHub API card.

## 2026-09-15 — Bugfixes: 404 metadata, public-API CORS, external-link rel, small-field showcase

- **Invalid report months and missing agents publish a real 404 title.**
  `generateMetadata` on `/agents/[slug]` and `/reports/[month]` now calls
  `notFound()` instead of returning a success-shaped metadata object, so a
  hand-edited URL never ships a title like “not-a-month report”.
- **Public review API is CORS-enabled.** `GET /api/agents/[slug]/reviews`
  now sends `Access-Control-Allow-Origin: *`, matching the other read-only
  endpoints documented on `/developers`. Agent detail 404s carry the same
  header so cross-origin clients can read the error body.
- **`target="_blank"` links get `rel="noopener noreferrer"`.** Applied on
  the agent record, compare paper link, paper card, review evidence link,
  and contribute GitHub links.
- **Homepage field draw no longer hides small categories.** Selecting a
  field with 1–2 agents now lists them (with a short note) instead of
  replacing the grid with an empty-state message; lucky draw stays disabled
  below three.
- Backfill script logs how many updated paper records still lack team/DOI
  (clears an unused-variable lint warning).

## 2026-09-15 — Discovery surfaces: llms.txt, JSON-LD, public API v1.0, reports, same-name pages, contribute, skills

Learned from how claw4science.org operates its directory, this adds the
"found by machines and returning visitors" layer the registry was missing:

- **`/llms.txt`** (`src/app/llms.txt/route.ts`): the whole registry as a
  plain-text index grouped by category, following the llms.txt convention.
  Generated live from the database, one line per agent with repo, language,
  stars, status and paper venue.
- **JSON-LD structured data**: the homepage now emits WebSite (with
  SearchAction), Organization, and CollectionPage/ItemList (top 10
  representatives); agent record pages emit SoftwareApplication with
  aggregateRating when approved verified-run ratings exist. `<` is escaped
  per the Next.js JSON-LD guide.
- **Public API v1.0** (`/developers` documents it): `GET /api/agents`
  gains `q` / `category` / `status` / `limit` filters, echoes them in meta,
  and is CORS-enabled; new `GET /api/agents/[slug]` returns one record
  with its rating summary. Read-only, no auth.
- **🔥 New badge**: agents added within the last 7 days (Agent.createdAt)
  carry a badge on cards; `isNewArrival` in `src/lib/format.ts` with
  `NEW_ARRIVAL_DAYS = 7`, auto-expiring like claw4science's.
- **Homepage FAQ** (`src/components/home-faq.tsx`): native details/summary
  accordion answering the operational questions — status labels, why our
  timestamps differ from GitHub, verified-run reviews, the New badge,
  listing, data provenance.
- **Monthly ecosystem reports** (`/reports`, `/reports/[month]`): computed
  live from registry data via `src/lib/reports.ts` (pure, tested). Per-month
  facts are what timestamps can prove (agents added, reviews written, repos
  pushed); totals and distributions are honestly labeled as current-state.
  Month URLs are in the sitemap.
- **Same-name disambiguation** (`/samename`): 11 curated groups
  (`src/lib/samename.ts`, tested — no slug in two groups, groups need ≥2
  live members, compare URL capped at 4) for the ScienceClaw ×4,
  MedClaw ×3, autoresearch ×4, ResearchClaw ×4 and other name collisions,
  each linking to a preloaded compare view.
- **Contribute pipeline** (`/contribute`): listing criteria (research
  purpose, public repo or paper, objective facts), GitHub-issue submission
  channel, what happens after (validated `pnpm agent:add` → New badge),
  and the maintainer workflow.
- **Coding-agent skills** (`skills/`): `agentx-search`, `agentx-recommend`
  and `agentx-compare` wrap the public API for Claude Code / Codex /
  Cursor-style agents — the directory becomes callable, not just browsable.
- Nav gains Reports and Contribute; sitemap covers all new pages; README
  updated.

## 2026-09-15 — /agents filters survive the round trip through an agent page

Filter state already lived in the URL (shareable, back-button friendly), but
returning to /agents through a plain link — the header "Agents" nav, the home
CTA — dropped the query string and with it every active filter. The last
active view now also lives in sessionStorage and is restored on arrival:

- `applyFilters` mirrors every change into URL (as before) and session
  storage (new), via `mirrorFilters` in agents-browser.tsx. Storage is best
  effort: privacy modes or quota errors never break filtering itself.
- On mount, a bare `/agents` (no query string) restores the remembered
  state after hydration and rewrites the URL, so the restored view stays
  shareable and back-button friendly. An explicit query string — deep link
  or browser back — always wins over what was remembered.
- "Clear all" clears the memory too, so a cleared list stays cleared.
- `parseAgentsQuery` in src/lib/picker.ts is the tested inverse of
  `serializeAgentsQuery` (unknown venue/stage/sort values fall back to
  defaults); it also replaces the component-local sort normalization.

## 2026-09-14 — Snapshot auto-apply: JSON and database stay in sync by construction

The Agent table is a materialized view of data/agents-snapshot.json; until
now the sync step (`pnpm db:apply-snapshot`) was manual, so editing the
snapshot while a server was running served stale pages until someone
remembered to re-run it. Sync now happens at system boundaries and never
depends on memory:

- New `SnapshotState` table (single row) records the sha256 of the last
  applied snapshot file, so unchanged boots/requests cost one fs.stat and
  a hash compare instead of 165 upserts.
- `ensureSnapshotApplied()` in src/lib/snapshot-apply.ts is the guarded,
  single-flight entry point; `applySnapshot()` (same file) is the shared
  idempotent apply core that scripts also call. Never touches review data,
  never throws on the request path (logs and serves previous data).
- Boot boundary: src/instrumentation.ts applies the snapshot before the
  server accepts requests (skipped during `next build` — CI builds with a
  throwaway database).
- Request boundary: every curated-data reader (home, /agents list and
  detail, /compare, /api/agents, the reviews routes, sitemap) awaits the
  guard before querying, so editing the snapshot JSON takes effect on the
  next request with no restart.
- The snapshot read contract (path, types, readSnapshot) moved to
  src/lib/snapshot.ts so the runtime never imports from scripts/;
  scripts/lib/snapshot.ts keeps the writers and re-exports the read API.
  SNAPSHOT_PATH is now a plain string path (bundler fs shims in dev reject
  URL objects, and instanceof URL is unreliable across bundler realms).
- `pnpm db:apply-snapshot` remains as the manual escape hatch, now calling
  the same core.
- Tests (src/lib/__tests__/snapshot-apply.test.ts) run against a temp
  SQLite via `prisma db push`: apply idempotence, stat-cache skip, rev
  guard on identical rewrite, re-apply on content change, and
  single-flight under concurrency.

## 2026-09-14 — Renamed to AgentX

Project-wide rename SciAgentX → AgentX: site constants (src/lib/site.ts),
header, footer, page copy and metadata descriptions, API `source` field,
README, Prisma schema header, design study title and a historical plan doc.
Tests updated to match. No behavior, data or URL structure changed.

## 2026-09-14 — Paper metadata enrichment via awescholar

New offline pipeline step `pnpm enrich:papers` (scripts/enrich-papers.ts):
resolves each snapshot agent's paper through the awescholar CLI
(`updater search`, backed by Semantic Scholar) and stores the record as
`paperMeta` (title, venue, year, team, DOI, paperUrl) — pure functions in
src/lib/papers.ts, tested in __tests__/papers.test.ts. Design choices:

- Only precise clues are resolved: a DOI or arXiv ID in the paper/homepage
  URL, an arXiv mention, or a verbatim quoted title in the description.
  No fuzzy guessing from agent names — wrong paper metadata is worse
  than none.
- Three fallback tiers when the DOI lookup misses (S2's DOI and title
  endpoints are separate pools; one being rate-limited does not imply the
  other is): arXiv IDs resolve their title via the arXiv API (with backoff —
  it burst-limits), DOI clues try a quoted title from the description, and
  as a strictly-gated last resort the whole description itself — for
  paper-first repos it IS the title, accepted only at ≥0.9 token cover
  (vs 0.7 for verbatim clues; queries under 3 tokens are rejected outright).
- Existing paper links are never overwritten; missing ones are filled from
  the clue's canonical URL (3 filled).
- Agents with paperMeta are skipped on re-run; misses are retried and
  reported. Real runs without an API key: 30/36 clue-bearing agents
  enriched, 6 unresolved (anonymous rate limits — set SEMANTICSCHOLAR_API_KEY;
  autoba resolved via the description fallback, protagents was merged from
  a rate-limited probe of the same pipeline).
- Zero changes to awescholar itself — it is used as an external CLI
  dependency, and the website never calls it at runtime.

Prisma: Agent.paperMeta (JSON string) added; apply-snapshot persists it;
the public /api/agents projection intentionally omits it until it is exposed
in the UI. README, .env.example updated.

## 2026-09-14 — Team tags + institution backfill; /agents shows institutions only

Fourth tag family: team — the person behind the agent (lead repo maintainer
or paper senior author), mirroring the Awesome-AI-Meets-Biology Team column.
Karpathy moved from institution to team. 23 Awesome-matched agents got team
tags, each tied to a verified identity (repo owner = paper author, README
citation, or OpenAlex authorships), e.g. Biomni→Jure-Leskovec,
AutoBA→Juexiao-Zhou, CASSIA→Elliot-Xie, mLLMCelltype→Jun-Chen.

Institutions backfilled the same way where the Awesome row lacked them:
AutoBA→KAUST, BioMaster→HKUST, scExtract→Peking-University, CASSIA→
UW-Madison, mLLMCelltype→Texas-A&M+Mayo-Clinic, GPTBioInsightor→
Candiolo-Cancer-Institute. DrugPilot's affiliation was unverifiable
(OpenAlex has none) so it keeps only its venue tag.

/agents page narrowing: chips and cards now carry institution tags only;
team/venue/tech remain on the agent record page, which gained a Team row.
sortTagsByType became dead code (snapshot is written pre-sorted) and was
removed along with its tests.

## 2026-09-14 — Backfill tags from Awesome-AI-Meets-Biology

Cross-referenced the snapshot against the Awesome-AI-Meets-Biology table
(matched by repo URL and paper title): 15 agents gained missing
institution/venue tags. Every venue was re-verified against Semantic
Scholar or the paper page before writing. Verification notes:

- BioDiscoveryAgent is a published ICLR paper, not an arXiv preprint
- The Virtual Lab's nanobody paper appeared in Nature (2025), not just
  bioRxiv
- AI-Scientist-v2 stayed arXiv — the "ICLR 2025" in the source refers to
  the workshop its generated manuscripts were sent to, not the paper
- bio-xyz/BioAgents is a same-name product by bio.xyz, not Microsoft's
  BioAgents paper — no tags added

New registry entries: institutions Medical-University-of-Vienna and
GENTEL-Lab; venues Nature and Advanced-Science.

## 2026-09-14 — Tags typed into institution / venue / tech

The tag layer mixed seven implicit types in one flat dimension (institutions,
venues, frameworks, generic infra, hardware, methodologies, people). It now
carries exactly three attribution families, each with distinct filter
semantics, tracked in a TAG_TYPE registry in src/lib/tags.ts:

- institution — who is behind it (university, lab, company, person;
  Karpathy folds in here, companion products map to their owner org:
  BioOS→GBA-BI, AI4Chem→InternScience)
- venue — where it was published (journal, conference, preprint server;
  arxiv/arXiv and "Nature Methods" normalized)
- tech — agent-relevant framework/protocol whitelist: MCP, LangGraph,
  LangChain, Claude-Code

Dropped as zero-selectivity noise: generic infra (Docker, Kubernetes, LaTeX,
FastAPI, Homebrew, jupyter-notebook), hardware (ESP32, RISC-V, MCU,
Apple-Silicon), domain tools (PyMOL, PubMed, CRISPR, MLX, …), methodology
(PRISMA), vague venues (Nature-paper) — they belong in the description.
83 distinct tags → 57; agent record page lists the three types as fields
next to Category ("–" when empty) and cards order tags institution-first.
The /agents chip row is unchanged
apart from InternScience joining it (alias merge). agent:add rejects
unregistered tags, and snapshot tests assert data and registry stay in sync.

## 2026-09-14 — Single source of truth: extras queue removed, `pnpm agent:add`

`data/agents-extra.json` was an append queue for new agents that the daily
snapshot consumed but never emptied — after the merge it kept holding stale
copies of records already in the snapshot, so the same facts lived in two
files with nothing keeping them consistent. The queue concept is gone:

- New agents enter through `pnpm agent:add owner/repo --category <slug>`:
  validates the category, the repo's existence on GitHub and the tag policy,
  fetches live metrics once, and appends to the snapshot directly
- `data/agents-extra.json` deleted (all 14 entries were already merged)
- `scripts/snapshot.ts` is now purely a metrics refresh; shared plumbing
  (snapshot read/write, GitHub fetch, slug rules) moved to `scripts/lib/`
- Tag policy codified in `src/lib/tags.ts` (generic capability/domain
  descriptors, count-based marketing and status words are rejected) and
  enforced by tests over the committed snapshot, so external imports can't
  reintroduce the claw4science tag layer

## 2026-09-14 — Status taxonomy simplified to active / stale / removed / no-repo

The old seven-value ladder carried three invisible distinctions: stale and
dormant rendered the identical amber pill, archived duplicated signal the
GitHub API gives for free, and "stable" was a human-set status with no
setting UI and zero entries. The set is now four statuses, each machine
assignable:

- `active` / `stale`: freshness only, single 120-day threshold (was 90/180);
  stale reactivates on a fresh push
- `removed`: GitHub returns 404 (deleted repo/account, made private) —
  assigned live by snapshot and refresh-github, unchanged behavior
- `no-repo`: reserved for entries without a GitHub repository, where
  freshness cannot be tracked; nothing writes it yet
- GitHub `archived: true` no longer creates a status of its own: such repos
  never push again, so refresh pins them to `stale` (unarchiving plus a fresh
  push reactivates them)
- The two snapshot entries that were `archived` (BioAgents, ResearchClaw)
  reclassified to `stale`
- `data/agents-snapshot.json` recomputed with the new rule: 71 stale,
  94 active; dead `deriveStatus` emoji/tag mapper (leftover from the removed
  claw4science seed pipeline) deleted from transform.ts

## 2026-09-14 — Tags pruned to objective attributions

The capability/scenario tags from the taxonomy migration (multi-agent,
self-evolving, bioinformatics, local-first, …) duplicated the category axis
and — for the initial claw4science import batch — carried that site's tag
wording over verbatim. Tags now carry objective proper-noun attributions
only: institution, publication venue, companion product and named technology
(Stanford, Nature-Biotechnology, MCP, …). Capabilities and scenarios stay in
the category and the description.

- `data/agents-snapshot.json` / `data/agents-extra.json`: 733 tags → 135
  across 83 distinct values (73 agents keep none; the card and filter render
  fine without tags)
- Fixed `TAG_VOCABULARY` removed; the `/agents` filter chips are derived
  from the data (tags with 3+ entries), so they can never drift from reality
- `/data-sources` wording updated to describe the tag policy

## 2026-09 — Taxonomy migration (12 → 9 user-intent categories)

The primary category axis now answers one question: what does a user open the
repo for. Capabilities and scenarios (self-evolving, education, materials, …)
became tags. The claw4science sync was removed; the committed snapshot is the
source of truth and new agents enter via `data/agents-extra.json`.

### Category mapping (old slug → new slug)

| Old | New |
|---|---|
| `general-research` | `autonomous-research` |
| `paper-tools` | `literature-writing` |
| `bio-omics` | `bio-omics` (unchanged) |
| `drug-molecular` | `chem-drug` |
| `science` | `clinical-health` |
| `specialized` | `workbenches` |
| `core` | `platforms` |
| `team` | `orchestration` |
| `benchmark` | `evaluation-safety` |
| `security` | `evaluation-safety` |
| `skill-evolution` | `platforms` (+ `self-evolving` tag) |
| `education` | split (`orchestration` / `workbenches`, + `education` tag) |

`GET /api/agents` returns the new slugs in `category`. Old query-param values
on `/agents` are no longer remapped.

### Other changes in this batch

- Tag filter on `/agents` (`?tag=`) with a recommended vocabulary
  (`TAG_VOCABULARY` in `src/lib/categories.ts`)
- Pruned 6 empty PaperClaw clones; `apply-snapshot` now self-heals by deleting
  snapshot-sourced agents that left the snapshot and have no reviews
- Filled 17 missing agent descriptions from repo READMEs and published papers
- New `/data-sources` page documenting claw4science, Awesome AI Meets Biology
  and GitHub API provenance
- `scripts/seed.ts` removed (claw4science importer)
