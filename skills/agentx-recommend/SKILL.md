---
name: agentx-recommend
description: Recommend scientific research AI agents for a user's research domain or task. Use when the user describes their field ("I'm a computational chemist", "I work on scRNA-seq", "I need help surveying literature") and wants agent suggestions. Maps the domain to registry categories, fetches candidates from the public agentx API, and ranks them by maintenance signals and community ratings.

---

# AgentX agent recommendations

Turn a research domain into a short, justified list of agents from the
AgentX registry.

## Setup

```bash
BASE="${AGENTX_API_BASE:-https://agentx.webioinfo.top}"
```

## Map the domain to categories

Pick 1–3 category slugs (fetch the live list when unsure):

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

## Fetch and rank

```bash
curl -s "$BASE/api/agents?category=chem-drug" | jq -r '.agents[] | [.name, .repo, .stars, .status, (.rating.count // 0), (.rating.overall // 0), (.paper_meta.venue // "")] | @tsv'
```

Rank by, in order:

1. `status` — prefer `active`/`stable`; never recommend `gone` or
   `archived` without a warning.
2. `rating.overall` with `rating.count ≥ 1` — community evidence beats none.
3. `stars` and recency of `pushed_at` — adoption and maintenance.
4. A companion paper (`paper_meta`) when the user cares about
   peer-reviewed grounding.

## How to answer

- Give 3–5 recommendations, each with: name, repo, why it fits the user's
  domain (use `description` and `tags`), and its signals.
- Separate "well-established" from "promising but early" (few stars, no
  reviews yet).
- Link `$BASE/agents/<slug>` for each, and say which category you searched
  so the user can browse adjacent ones.
