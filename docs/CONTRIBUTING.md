# Contributing to AgentX

Two contributions need no code: suggest an agent for the registry (see
[Adding an agent](#adding-an-agent-maintainer-pipeline) below, or the
`/contribute` page on the site), and review agents you have actually run —
a verified-run review with logs linked does more for the next researcher
than any listing. For code and registry data, read on.

## What this repository is

The open home of the AgentX registry:

- `data/agents-snapshot.json` — the registry itself: every agent record
  with provenance, refreshed daily from GitHub.
- `skills/agentx` — a coding-agent skill that wraps the public read-only
  API (search, recommend, compare).
- `docs/` — this guide and the [API reference](./API.md).

The website's application code is developed in a separate private
repository and is not part of this one. Everything a contributor needs to
add or maintain registry records — the `awescholar` CLI
(`pip install awescholar`) — works on any checkout of this repository.

## Engineering Taste

- **Simple:** make the smallest change that solves the real problem.
- **Clear:** optimize for the next reader, not for cleverness.
- **Decoupled:** keep boundaries clean, but don't add abstractions without a real need.
- **Honest:** make complexity, state, side effects, assumptions, and failure modes visible; don't hide complexity and don't create extra complexity.
- **Focused:** preserve boundaries between modules, and keep top-level convenience commands minimal.
- **Durable:** choose behavior that is easy to maintain, test, and extend.
- **First principles:** identify the real problem, hard constraints, and known facts before reaching for patterns, abstractions, or prior solutions.

## The snapshot is the source of truth

- `data/agents-snapshot.json` is the only write path for curated agent
  fields. It is never hand-edited; `awescholar updater add --agentx` is the
  only supported entry point for new records. `awescholar verify --agentx`
  (run in CI) enforces
  the writer invariants — shape, slug order and uniqueness, registered
  categories/tags, consistent counts — so a hand edit fails loudly.

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
git add data/agents-snapshot.json && git commit
```

`GITHUB_TOKEN` is optional — the command makes one request per invocation,
so the unauthenticated limit is fine.

Categories:

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

The tag policy is objective proper-noun attributions only — institution,
venue, companion product, named tech; never capability or marketing
descriptors. It is enforced by `awescholar verify --agentx`.

## Paper enrichment and GitHub metrics

Paper metadata (title, venue, year, team, DOI) is resolved through the
[awescholar](https://github.com/wehuman01/awescholar) CLI against Semantic
Scholar (`awescholar updater enrich/backfill --agentx`). Enrichment starts
from precise clues in the snapshot (DOI, arXiv ID, quoted title); agents
without a resolvable clue are left untouched.

Stars, last-push time, language, license and repo descriptions refresh
daily. Statuses are derived from that activity: a repo archived by its
owner or deleted from GitHub (404) moves to the graveyard (`gone`), a repo
idle past its tier's patience — 180 days under the nursery star line, 3
years above it — is classified as `archived`, and a fresh push restores it.
"Stable" is sticky once set: granted by manual verdict or automatically by
the paper rule (a peer-reviewed companion paper at any star count, or a
preprint with 1k+ stars). See the site's `/data-sources` page for the
reader-facing wording.

## The `agentx` skill

`skills/agentx` wraps the public API so coding agents can search,
recommend and compare registry entries — install with
`npx skills add webioinfo01/agentx-hub -g -y`. Improvements welcome by
pull request: keep the frontmatter description covering all three trigger
families, and test the changed sections against the live API with plain
`curl` before submitting.

## Changelog

`CHANGELOG.md` at the repo root, dated sections, newest first. Update it
in the same pull request as the behavior change.

## Project layout

```
data/           agents-snapshot.json — the registry itself
skills/         The agentx coding-agent skill (public API wrapper)
docs/           This guide and the API reference
.github/        Issue templates (agent suggestions, bugs)
```
