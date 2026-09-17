---
name: agentx-search
description: Search the AgentX registry of scientific research AI agents by keyword or category. Use when the user asks to find research/science AI agents, tools like "an agent for single-cell analysis" or "paper writing agents", or asks what agent could help with a research task. Returns names, GitHub repos, stars, status, and community rating summaries from the public agentx API.
---

# AgentX agent search

Search a curated registry of research AI agents (bioinformatics, drug
discovery, literature work, autonomous research, …) with live GitHub
metrics and evidence-backed review scores.

## Setup

The API base is `${AGENTX_API_BASE:-https://agentx.webioinfo.top}` (the
deployed registry; point `AGENTX_API_BASE` at a local dev server if you
run one). Resolve it once per session:

```bash
BASE="${AGENTX_API_BASE:-https://agentx.webioinfo.top}"
```

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

```bash
curl -s "$BASE/api/agents?category=bio-omics" | jq '.agents | length'
```

## How to answer

1. Run one search (keyword, or category when the ask is a domain).
2. Read `stars`, `pushed_at`, `status` as maintenance signals — a `gone`
   or `archived` repo must not be recommended.
3. Read `rating` (`count`, `overall`, per-dimension) as community evidence;
   `rating.count: 0` means unreviewed, not bad.
4. Recommend 3–5 agents with name, repo, one-line `description`, and the
   signals above. Link the registry page: `$BASE/agents/<slug>`.
5. Mention search terms that returned nothing — it is useful negative
   information.
