---
name: agentx-compare
description: Compare scientific research AI agents side by side using the AgentX registry. Use when the user names two or more agents or asks "X vs Y" or "which of these should I use" for research AI tools. Fetches each agent's record from the public agentx API and builds a comparison of maintenance, adoption, paper grounding, and community ratings.

---

# AgentX agent comparison

Compare 2–4 named research AI agents from the AgentX registry.

## Setup

```bash
BASE="${AGENTX_API_BASE:-https://agentx.webioinfo.top}"
```

## Resolve names to slugs

The API takes slugs. Resolve loose names with a search first:

```bash
curl -s "$BASE/api/agents?q=autoresearch" | jq -r '.agents[] | "\(.slug) | \(.name) | \(.repo)"'
```

Beware same-name projects (four ScienceClaws, three MedClaws…): the repo
`owner/name` disambiguates. When the user's name is ambiguous, list the
candidates and ask which repo they mean, or check the registry's
disambiguation page at `$BASE/samename`.

## Fetch each agent

```bash
curl -s "$BASE/api/agents/<slug>" | jq '.agent'
```

## Build the comparison

One row per agent, columns for:

- **Repo / license / language** — what you'd actually install.
- **Status + pushed_at** — maintenance reality (`active` vs `stale` vs
  `gone`).
- **Stars** — adoption.
- **Paper** — `paper_meta.venue` and year when peer-reviewed grounding
  matters.
- **Ratings** — `rating.overall` (`rating.count`); note when it is 0
  reviews rather than a low score.
- **Category** — same category means substitutes; different categories
  often means complements.

## How to answer

- Lead with a one-line verdict per agent ("best maintained", "most
  evidence", "lightest to adopt").
- Then the table, then 2–3 sentences of guidance tied to what the user is
  doing.
- Link `$BASE/agents/<slug>` per agent and the ready-made side-by-side page
  `$BASE/compare?ids=<slug1>,<slug2>` when comparing 2–4.
