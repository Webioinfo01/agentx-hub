<div align="center">
  <img src="./src/app/icon.svg" alt="AgentX" width="120">
  <h1>AgentX: Verified Registry of Research AI Agents</h1>
  <p><strong>Discover, compare and review scientific research AI agents.</strong></p>
  <p>A community directory with verified-run reviews and live GitHub metrics.</p>
  <p>
    <strong>English</strong> ·
    <a href="./README_cn.md">简体中文</a>
  </p>
  <p>
    <a href="https://github.com/Webioinfo01/agentx-hub"><img src="https://img.shields.io/github/stars/Webioinfo01/agentx-hub?style=social" alt="GitHub Stars"></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/agents-209-0EA5E9?style=flat-square" alt="Agents tracked">
    <img src="https://img.shields.io/badge/categories-10-7C3AED?style=flat-square" alt="Categories">
    <img src="https://img.shields.io/badge/paper--backed-88-22C55E?style=flat-square" alt="Paper-backed agents">
    <img src="https://img.shields.io/badge/updated-2026.09-334155?style=flat-square" alt="Last updated">
  </p>
</div>

> Discover, compare and review scientific research AI agents.

AgentX is a community website that tracks scientific research AI agents: a
curated directory with live GitHub metrics, verified-run reviews from
researchers who actually used the tools, side-by-side comparison, and monthly
ecosystem reports. Listing is free and editorial — based on fit, not stars.

## Using the site

- **Browse** (`/agents`) — 200+ agents across 10 user-intent categories with
  live GitHub metrics (stars, last push, language, license), search /
  filter / sort; 🔥 New badge for agents added within the last 7 days
- **Compare** (`/compare`) — up to 4 agents side by side, including review
  scores and companion papers
- **Review** — share your experience; verified-run reviews shape every
  agent's score (rules below)
- **Monthly reports** (`/reports`) — additions, repository activity and
  review flow per month, computed live from registry data
- **Same-name disambiguation** (`/samename`) — curated groups for the
  ScienceClaw / MedClaw / autoresearch name collisions

## How reviews work

| | General comment | Verified Run review |
|---|---|---|
| Requires | ≥10 chars | ≥30 chars + evidence URL + 5 ratings (1–5) |
| Counts toward score | no | yes (after approval) |
| Evidence | — | repo / gist / PR / run log link |

Evidence hosted under the reviewer's own GitHub account
(`https://github.com/<login>/…`) is auto-accepted as **self-attested**.
Anything else lands in **pending** until a maintainer checks it. The five
rating dimensions: usefulness, scientific accuracy, evidence quality,
reliability, ease of use.

## Adding an agent

The registry grows through suggestions and curated imports. Listing is
free, editorial, and based on fit — not stars, sponsorship, or who asks
loudest.

### Suggest an agent (anyone)

Open an issue with the basics: name, repo URL, category suggestion, paper
link if there is one, and one line on why it fits. No template gymnastics;
a maintainer reads every one.

[**Suggest an agent on GitHub →**](https://github.com/Webioinfo01/agentx-hub/issues/new?title=Agent+suggestion%3A+%3Cname%3E)

What qualifies:

- **A research purpose.** The agent does or assists scientific work —
  literature, bio-omics, chemistry, drug discovery, clinical workflows,
  autonomous research, orchestration around research agents.
- **A public repo or a paper.** A GitHub repository we can fetch metrics
  from, or a companion publication with a usable link. Closed SaaS without
  either cannot be tracked honestly.
- **Objective facts only.** Descriptions come from the repo itself; tags
  carry institutions and venues, not marketing claims. Contested names get
  disambiguated (the `/samename` page), never silently merged.

### What happens next

1. **Fit check** — a maintainer checks the criteria above and replies in
   the issue: accepted, or what is missing.
2. **Record created** — the repo goes through the validated add pipeline:
   category and tag policy checks, one live GitHub fetch for metrics and
   description. Nothing is hand-typed.
3. **Listed as new** — the agent appears with a New badge for its first
   7 days, then tracks pushes, stars and reviews like every other record.

Maintainers add records through a validated CLI — the registry snapshot
is never hand-edited. The operator commands live in the Python package
[`awescholar`](https://github.com/wehuman01/awescholar).
The full pipeline, categories and tag policy are documented in
[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## Public API and skills

- `GET /api/agents` — directory + rating summaries (`q`, `category`,
  `status`, `limit` filters)
- `GET /api/agents/[slug]` — one agent record with its rating summary
- `GET /api/agents/[slug]/reviews` — reviews for one agent
- `GET /llms.txt` — plain-text registry index (llms.txt convention)
- `POST /api/agents/[slug]/reviews` — create review (auth required)
- `POST /api/reviews/[id]/vote` — helpful / not helpful (auth required)

Read-only endpoints are CORS-enabled. The full reference with examples
lives in [docs/API.md](./docs/API.md) and is also rendered at
`/developers` on the site.

`skills/` ships one agent skill (`agentx`) that wraps the public API for
coding agents — search, recommend, and compare; no keys, no auth:

```bash
npx skills add webioinfo01/agentx-hub -g -y
```

Managing skills with [aweskill](https://github.com/wehuman01/aweskill)?

```bash
aweskill store install Webioinfo01/agentx-hub --all
aweskill agent add skill agentx --global
```

See `skills/README.md` for details and the `AGENTX_API_BASE` override.

## Where the data comes from

- **[claw4science.org](https://claw4science.org/)** — the first ~160
  entries were imported from its publicly documented API (facts only: repo
  URLs, project names, categories). The import is historical; this
  directory is no longer synced from claw4science, categories and
  membership are curated here.
- **[Awesome AI Meets Biology](https://github.com/Webioinfo01/Awesome-AI-Meets-Biology)** —
  curated academic bio-agents imported from the survey
  ([Huang et al. 2026, *Genomics Communications*](https://doi.org/10.48130/gcomm-0026-0005)),
  with paper links pointing to peer-reviewed versions where they exist.
- **[awescholar](https://github.com/Webioinfo01/awescholar)** — one of the
  site's maintenance tools: companion-paper metadata (title, venue, year,
  team, DOI) resolved through its CLI against Semantic Scholar.
- **GitHub API** — stars, last-push time, language, license and repo
  descriptions, refreshed daily.

Every listing's provenance is recorded in the snapshot; the site's
`/data-sources` page details what is taken from each source and what stays
ours. This project is independent and not affiliated with any listed
agent.

## Roadmap

- Agent execution sandbox (run agents from the browser)
- Multi-agent orchestration on a single task
- Verified Run badge automation via CI logs

## Citation

If you find this repository useful in your research, please cite our paper:

Huang S, Lang M, Chen Z, Yang C, Huang X, et al. 2026. From foundation models to autonomous agents in biology. Genomics Communications 3: e006 doi: 10.48130/gcomm-0026-0005

## Development

This repository is the open home of the registry: the snapshot, the
`agentx` skill, and documentation. The maintainer add pipeline and the
contribution paths are documented in
[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md); the site's application
code is developed separately.

## License

- **Code in this repository** (`skills/`) — MPL-2.0, see
  [LICENSE](./LICENSE). MPL is file-level: modifications to these files
  must stay open; combining them with your own code is fine.
- **Registry data** (`data/`), monthly reports and documentation —
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), attributed to
  "AgentX Registry, https://github.com/Webioinfo01/agentx-hub".
- **Reviews** — CC BY 4.0, attributed to the reviewer's GitHub account;
  the license granted on submission is described in the site's Terms page
  (`/terms`).
