# Public API reference

The whole registry is available as JSON — no authentication, no key,
read-only. Build directories, recommendations, or agent skills on top of
it. The same reference is rendered at [`/developers`](https://agentx.webioinfo.top/developers)
on the site.

Base URL: `https://agentx.webioinfo.top` (the deployed registry).

If you ship something on top of the API, a star and a link back to the
[registry](https://agentx.webioinfo.top/agents) is appreciated but not
required.

## GET /api/agents

The full directory with rating summaries, ordered by stars.

```bash
curl "https://agentx.webioinfo.top/api/agents?q=protein&category=chem-drug&limit=20"
```

| Parameter | Type | Effect |
|---|---|---|
| `q` | string | Substring match over name, repo, description and tags. |
| `category` | string | Category slug (see the response meta or `/agents`). |
| `status` | string | `active` · `stale` · `stable` · `archived` · `gone` · `no-repo`. |
| `limit` | int | Cap results, 1–500 (default 500). |

## GET /api/agents/{slug}

One agent by slug: record fields, provenance, and its rating summary.

```bash
curl "https://agentx.webioinfo.top/api/agents/agentlaboratory"
```

## GET /api/agents/{slug}/reviews

Public reviews for one agent, newest first, with reviewer identity and
vote counts.

```bash
curl "https://agentx.webioinfo.top/api/agents/agentlaboratory/reviews"
```

## POST /api/agents/{slug}/reviews

Submit a review (general or verified-run). Requires GitHub sign-in;
verified-run submissions must carry an evidence URL and five ratings. See
the review policy on the site (`/about`).

## POST /api/reviews/{id}/vote

Vote helpful / not helpful on a review. Requires GitHub sign-in.

## GET /llms.txt

A plain-text index of every agent, grouped by category, following the
[llms.txt convention](https://llmstxt.org) — the cheapest way to give a
model the whole directory in one request.

## GET /llms-full.txt

The expanded form of the same index: one short paragraph per agent
(description plus registry facts and verified-run averages), so a model can
cite a record without fetching each page.

## GET /feed.xml

RSS 2.0 feed of the most recently listed main-directory agents (up to 30).
Useful for aggregators, monitoring scripts, or anything that wants the
registry's new entries without polling the API.

## Response shape

```json
{
  "meta": {
    "total_agents": 168, "returned": 20, "total_reviews": 12,
    "api_version": "1.1", "docs": "/developers"
  },
  "agents": [
    {
      "slug": "agentlaboratory",
      "name": "AgentLaboratory",
      "repo": "SamuelSchmidgall/AgentLaboratory",
      "category": "autonomous-research",
      "stars": 5846,
      "pushed_at": "2025-08-20T21:46:43.000Z",
      "status": "stale",
      "retired_reason": null, "retired_stars": null,
      "paper_meta": { "venue": "Findings of EMNLP 2025", "year": "2025.06" },
      "reviews": 2,
      "rating": { "count": 2, "overall": 4.0, "usefulness": 4.5, "...": "..." }
    }
  ]
}
```

## For LLMs and coding agents

A ready-made [`agentx` skill](../skills/) wrapping this API (search,
recommend, compare) ships in this repository under `skills/`:

```bash
npx skills add webioinfo01/agentx-hub -g -y
```

Read-only GETs are CORS-enabled. No rate limiting is applied today; cache
responses on your side. Fields may gain new keys; existing keys keep their
meaning.
