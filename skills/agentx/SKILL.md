---
name: agentx
description: Search, recommend, and compare scientific research AI agents using the AgentX registry — a curated directory with live GitHub metrics and verified-run community reviews. Use when the user asks to find research/science AI agents ("an agent for single-cell analysis", "paper writing agents"), asks what agent could help with a research task, describes their field and wants suggestions ("I'm a computational chemist", "I work on scRNA-seq", "help surveying literature"), or names two or more agents and asks "X vs Y" or "which should I use". Wraps the public agentx API — no keys, no auth.
---

# AgentX research-agent registry

One public API, three moves: **search** by keyword or category,
**recommend** for a research domain, and **compare** named agents side by
side.

## Setup

The API base is `${AGENTX_API_BASE:-https://agentx.webioinfo.top}` (the
deployed registry; point `AGENTX_API_BASE` at a local dev server if you
run one). Resolve it once per session:

```bash
BASE="${AGENTX_API_BASE:-https://agentx.webioinfo.top}"
```

## Reading the signals (applies to every move)

Each record carries `stars`, `pushed_at`, `status`, `rating`, and often
`paper_meta`:

- **`status`** — maintenance reality: `active`, `stale`, `stable`,
  `archived`, `gone`, `no-repo`. Prefer `active`/`stable`; never recommend
  `gone` or `archived` without a warning.
- **`rating`** — community evidence from verified-run reviews (`count`,
  `overall`, five dimensions). Evidence beats stars, and `rating.count: 0`
  means unreviewed, not bad.
- **`stars` + `pushed_at`** — adoption and recency.
- **`paper_meta`** — companion paper (`venue`, `year`) when peer-reviewed
  grounding matters.

## Search

```bash
curl -s "$BASE/api/agents?q=protein&limit=20" | jq -r '.agents[] | "\(.name) | \(.repo) | ★\(.stars) | \(.status) | \(.rating.count) ratings"'
```

- `q` — substring over name, repo, description and tags (`protein`,
  `scrna`, `literature`, `autoresearch`, …)
- `category` — one of: `autonomous-research`, `literature-writing`,
  `bio-omics`, `chem-drug`, `clinical-health`, `platforms`,
  `orchestration`, `benchmarks`, `safety-security`, `others`
- `status` — `active`, `stale`, `stable`, `archived`, `gone`, `no-repo`
- `limit` — up to 500

Category-only listing (no keyword):
`curl -s "$BASE/api/agents?category=bio-omics"`.

How to answer:

1. Run one search (keyword, or category when the ask is a domain).
2. Recommend 3–5 agents with name, repo, one-line `description`, and the
   signals above. Link the registry page: `$BASE/agents/<slug>`.
3. Mention search terms that returned nothing — it is useful negative
   information.

## Recommend

Map the user's domain to 1–3 category slugs:

| Domain cue | Category slug |
|---|---|
| End-to-end research automation, "AI scientist" | `autonomous-research` |
| Papers, writing, literature surveys | `literature-writing` |
| Bioinformatics, genomics, omics | `bio-omics` |
| Chemistry, molecules, drug discovery | `chem-drug` |
| Clinical, medical, healthcare | `clinical-health` |
| Agent platforms and infrastructure | `platforms` |
| Multi-agent orchestration | `orchestration` |
| Benchmarks, leaderboards, evaluation datasets | `benchmarks` |
| Agent safety, security, misuse | `safety-security` |

Fetch and rank:

```bash
curl -s "$BASE/api/agents?category=chem-drug" | jq -r '.agents[] | [.name, .repo, .stars, .status, (.rating.count // 0), (.rating.overall // 0), (.paper_meta.venue // "")] | @tsv'
```

Rank by, in order: 1) `status` — prefer `active`/`stable`; 2)
`rating.overall` with `rating.count ≥ 1` — community evidence beats none;
3) `stars` and recency of `pushed_at`; 4) `paper_meta` when the user
cares about peer-reviewed grounding.

How to answer:

- Give 3–5 recommendations, each with: name, repo, why it fits the user's
  domain (use `description` and `tags`), and its signals.
- Separate "well-established" from "promising but early" (few stars, no
  reviews yet).
- Say which category you searched so the user can browse adjacent ones;
  link `$BASE/agents/<slug>` for each.

## Compare

Compare 2–4 named agents.

Resolve loose names to slugs with a search first:

```bash
curl -s "$BASE/api/agents?q=autoresearch" | jq -r '.agents[] | "\(.slug) | \(.name) | \(.repo)"'
```

Beware same-name projects (four ScienceClaws, three MedClaws…): the repo
`owner/name` disambiguates. When the user's name is ambiguous, list the
candidates and ask which repo they mean, or check the registry's
disambiguation page at `$BASE/samename`.

Fetch each agent:

```bash
curl -s "$BASE/api/agents/<slug>" | jq '.agent'
```

Build one row per agent, columns for:

- **Repo / license / language** — what you'd actually install.
- **Status + pushed_at** — maintenance reality.
- **Stars** — adoption.
- **Paper** — `paper_meta.venue` and year when peer-reviewed grounding
  matters.
- **Ratings** — `rating.overall` (`rating.count`); note when it is 0
  reviews rather than a low score.
- **Category** — same category means substitutes; different categories
  often means complements.

How to answer:

- Lead with a one-line verdict per agent ("best maintained", "most
  evidence", "lightest to adopt").
- Then the table, then 2–3 sentences of guidance tied to what the user is
  doing.
- Link `$BASE/agents/<slug>` per agent, and the ready-made side-by-side
  page `$BASE/compare?ids=<slug1>,<slug2>` when comparing 2–4.
