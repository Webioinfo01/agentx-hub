# AgentX skill

One [agent skill](https://agentskills.io) that puts the AgentX
research-agent registry inside a coding agent (Claude Code, Codex, Cursor,
…): search by keyword or category, recommend agents for a research domain,
and compare agents side by side — all over the public read-only API, no
keys, no auth.

## Install

```bash
npx skills add webioinfo01/agentx-hub -g -y
```

Managing your skills with [aweskill](https://github.com/wehuman01/aweskill)?

```bash
aweskill store install Webioinfo01/agentx-hub --all
aweskill agent add skill agentx --global
```

## API base URL

The skill calls `$AGENTX_API_BASE` and defaults to the deployed registry,
`https://agentx.webioinfo.top`. Running a local dev server? Point it
there:

```bash
export AGENTX_API_BASE="http://localhost:3000"
```

## API reference

See [docs/API.md](../docs/API.md), or `/developers` on the deployed site.
