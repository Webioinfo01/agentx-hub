# Contributing to AgentX

Two contributions need no code: suggest an agent for the registry (see
[Adding an agent](#adding-an-agent-maintainer-pipeline) below, or the
`/contribute` page on the site), and review agents you have actually run —
a verified-run review with logs linked does more for the next researcher
than any listing. For code, read on.

## Engineering Taste

- **Simple:** make the smallest change that solves the real problem.
- **Clear:** optimize for the next reader, not for cleverness.
- **Decoupled:** keep boundaries clean, but don't add abstractions without a real need.
- **Honest:** make complexity, state, side effects, assumptions, and failure modes visible; don't hide complexity and don't create extra complexity.
- **Focused:** preserve boundaries between modules, and keep top-level convenience commands minimal.
- **Durable:** choose behavior that is easy to maintain, test, and extend.
- **First principles:** identify the real problem, hard constraints, and known facts before reaching for patterns, abstractions, or prior solutions.

## Development setup

```bash
pnpm install
cp .env.example .env

# Database: Neon Postgres (see .env.example) — DATABASE_URL is the pooled
# connection the app uses, DIRECT_URL the direct one migrations run through.
pnpm exec prisma migrate deploy  # apply the committed baseline

# Auth (optional for browsing; required to post reviews)
# create at github.com/settings/developers, callback:
#   http://localhost:3000/api/auth/callback/github
echo 'AUTH_SECRET=$(openssl rand -base64 32)' >> .env
echo 'AUTH_GITHUB_ID=…' >> .env
echo 'AUTH_GITHUB_SECRET=…' >> .env

pnpm db:apply-snapshot         # load the committed agent snapshot
pnpm snapshot                  # optional: refresh live metrics now
pnpm db:seed:demo              # optional: seed demo reviews (marked as seed)
pnpm dev
```

Environment variables (see `.env.example` for the full annotated list):

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` / `DIRECT_URL` | yes | Neon Postgres: pooled connection at runtime, direct connection for migrations |
| `AUTH_SECRET` / `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | to sign in | GitHub OAuth, JWT sessions (next-auth v5) |
| `AUTH_TRUST_HOST` | outside Vercel | Trust the host header |
| `GITHUB_TOKEN` | optional | GitHub API 60 req/h anonymous vs 5,000 with a token |
| `SEMANTICSCHOLAR_API_KEY` | optional | Semantic Scholar 100 req/5min shared pool vs 1 req/s; persistent "not found" misses are usually anonymous rate limits |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical URLs, social metadata, sitemap, robots |
| `NEXT_PUBLIC_REPO_URL` | optional | Repo links on the site; defaults to this repository |

## The snapshot is the source of truth

- `data/agents-snapshot.json` is the only write path for curated agent
  fields. It is never hand-edited; `awescholar updater add --agentx` is the
  only supported entry point for new records. `awescholar verify --agentx`
  (run in CI) enforces
  the writer invariants — shape, slug order and uniqueness, registered
  categories/tags, consistent counts — so a hand edit fails loudly.
- The database `Agent` table is a materialized view of the snapshot: the
  snapshot writes, pages read the database. It is auto-applied at server
  boot (`src/instrumentation.ts`) and lazily at request time
  (`src/lib/snapshot-apply.ts`), so consistency never depends on someone
  remembering to run a command. The apply is idempotent (upserts by repo)
  and never touches review data.
- Reviews live only in the database, written through the site by signed-in
  users. Demo seeds are marked as seed.
- `pnpm db:apply-snapshot` forces a manual apply; you normally don't need
  it locally because of the auto-apply.

## Adding an agent (maintainer pipeline)

```sh
awescholar updater add --agentx owner/repo --category <slug> \
  [--name "Foo"] [--tags "Stanford,Nature-Biotechnology"] \
  [--paper URL] [--homepage URL] [--description "one line"]
```

The command validates the category, the repo (must exist on GitHub) and the
tag policy, fetches live metrics once, then appends to the snapshot in
stable slug order. Follow up:

```sh
awescholar verify --agentx  # offline check of the writer invariants
pnpm db:apply-snapshot      # load the snapshot into the DB
git add data/agents-snapshot.json && git commit
```

Categories (defined in `src/lib/categories.ts`):

| Slug | Category |
|---|---|
| `autonomous-research` | Autonomous Research |
| `literature-writing` | Literature & Scientific Writing |
| `bio-omics` | Bioinformatics & Omics |
| `chem-drug` | Chemistry & Drug Discovery |
| `clinical-health` | Clinical & Healthcare |
| `platforms` | Platforms & Infrastructure |
| `orchestration` | Multi-Agent Orchestration |
| `benchmarks` | Benchmarks |
| `safety-security` | Safety & Security |
| `others` | Others |

The tag policy (objective proper-noun attributions only — institution,
venue, companion product, named tech; never capability or marketing
descriptors) lives in `src/lib/tags.ts` and is enforced by tests.
`GITHUB_TOKEN` is optional — the script makes one request per invocation,
so the unauthenticated limit is fine.

The same operations (`add`, `validate`, `snapshot`, `enrich-papers`,
`refresh-citations`) ship as the Python
[`awescholar`](https://github.com/wehuman01/awescholar) CLI:
`awescholar updater add/enrich/backfill --agentx` and
`awescholar verify --agentx` operate on any checkout of this repo
without these scripts. The registry policy (categories, tag registry, venue
aliases, status rules) is mirrored in both places — a policy change must
land in both in the same change; running `awescholar verify --agentx` here is
the drift detector. The DB-bound verbs (`apply`, `moderate`) stay site-only.

## Paper enrichment (awescholar)

`pnpm enrich:papers` fills each agent's `paperMeta` (title, venue, year,
team, DOI) through the [awescholar](https://github.com/Webioinfo01/awescholar)
CLI querying Semantic Scholar — one of the site's maintenance tools. It
requires the CLI on PATH (`pip install awescholar`). Enrichment starts
from precise clues in the snapshot (DOI, arXiv ID, quoted title); agents
without a resolvable clue are left untouched. The weekly workflow
(`.github/workflows/papers.yml`, Sundays 04:29 UTC) retries the misses and
commits what it resolves.

## GitHub metrics and licenses

`pnpm snapshot` refreshes stars, last-push time, language, license and
repo descriptions from the GitHub REST API; the daily workflow
(`refresh.yml`, 03:17 UTC) does the same in CI. The bulk field refresh is
delegated to the [awescholar](https://github.com/Webioinfo01/awescholar)
CLI (`updater enrich --agentx`); this script then re-reads the snapshot,
applies the local lifecycle policy, and detects 404 repos via a
lightweight HEAD so deleted GitHub projects move to the graveyard.
Licenses use the SPDX metadata GitHub reports; when it returns
`NOASSERTION`, the repository's LICENSE file is read and standard
Creative Commons titles are recognized (`scripts/lib/github.ts`).

Statuses are derived from activity during the refresh: a repo archived by
its owner or deleted from GitHub (404) moves to the graveyard (`gone`) in
the same refresh (the archived flag is persisted by awescholar's pass), a
repo idle past its tier's patience — 180 days under the nursery star line,
3 years above it (`src/lib/categories.ts`) — is classified as `archived`,
and a fresh push restores it. "Stable" is sticky once set: granted by
manual verdict or automatically by the paper rule (a peer-reviewed
companion paper at any star count, or a preprint with 1k+ stars), with
`autoStableExempt` as the curator's veto against the automatic path. See
the site's `/data-sources` page for the reader-facing wording.

## Review moderation

Verified-run reviews whose evidence is hosted outside the reviewer's own
GitHub account land in `pending` (`src/lib/review-policy.ts` decides).
A maintainer then checks the linked evidence by hand:

```bash
pnpm reviews:moderate                 # list pending reviews (id, agent, proof URL)
pnpm reviews:moderate --approve <id>  # evidence checks out → counts toward scores
pnpm reviews:moderate --reject <id>   # evidence fails → stays visible, never scored
```

Only `pending` verified-run reviews can transition; the script refuses
anything else. Approved is the only state that enters agent ratings
(`summarizeRatings` filters on it), so a rejection needs no deletion.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | dev server |
| `pnpm build` / `pnpm start` | production build / serve |
| `pnpm test` | unit tests (transform, ratings) |
| `pnpm snapshot` | refresh snapshot metrics (GitHub only) |
| `pnpm agentx <verb>` | unified entry: `add` `snapshot` `validate` `apply` … map to the scripts below |
| `pnpm agent:add` | add a new agent to the snapshot (validated, metrics fetched) |
| `awescholar updater add --agentx` / `awescholar updater enrich --agentx` / `awescholar updater backfill --agentx` | standalone registry operations ([awescholar](https://github.com/wehuman01/awescholar)) — add, metrics refresh, paper/citation backfill on any checkout of this repo |
| `awescholar verify --agentx` | offline snapshot validation — the CI gate against hand edits |
| `pnpm enrich:papers` | enrich the snapshot with paper metadata via awescholar (Semantic Scholar) |
| `pnpm db:apply-snapshot` | load `data/agents-snapshot.json` into the DB |
| `pnpm reviews:moderate` | list / approve / reject pending verified-run reviews |
| `pnpm db:seed:demo` | seed demo reviews (`-- --purge` to remove) |
| `pnpm db:studio` | Prisma Studio |

## Testing and CI

- `pnpm test` — vitest; unit tests live in `src/lib/__tests__`, one file
  per module. The tag policy and review rules are test-enforced: change
  them in `src/lib`, not in ad-hoc branches of page code.
- `pnpm lint` — eslint.
- CI (`.github/workflows/ci.yml`) runs lint, tests, type check
  (`next typegen` + `tsc --noEmit`) and build on every push and pull
  request.
- Work on short-lived branches, merge into `main`.

## Changelog

`CHANGELOG.md` at the repo root, dated sections, newest first. Update it
in the same pull request as the behavior change.

## Project layout

```
src/app/        App Router pages and API routes (agents, compare, reports, …)
src/lib/        Pure logic: categories, tags, ratings, review policy,
                snapshot (apply), papers, reports, samename (+ __tests__)
scripts/        Data pipeline: agent-add, snapshot, apply-snapshot,
                enrich-papers, seed-demo (+ lib/)
data/           agents-snapshot.json — the registry itself
skills/         Coding-agent skills wrapping the public API
prisma/         Schema and migrations
docs/           This document and design plans
```
