# AgentX skills

Three [agent skills](https://llmstxt.org) that put the AgentX research-agent
registry inside a coding agent (Claude Code, Codex, Cursor, …). Each skill
wraps the public read-only API — no keys, no auth.

| Skill | What it does |
|---|---|
| `agentx-search` | Search the registry by keyword or category |
| `agentx-recommend` | Recommend agents for a research domain |
| `agentx-compare` | Compare 2–4 agents side by side |

## Install

```bash
npx skills add webioinfo01/agentx-hub -s agentx-search -y
npx skills add webioinfo01/agentx-hub -s agentx-recommend -y
npx skills add webioinfo01/agentx-hub -s agentx-compare -y
```

Or all three:

```bash
npx skills add webioinfo01/agentx-hub -g -y
```

## API base URL

The skills call `$AGENTX_API_BASE` and default to the deployed registry,
`https://agentx.webioinfo.top`. Running a local dev server? Point them at
it:

```bash
export AGENTX_API_BASE="http://localhost:3000"
```

## API reference

See `/developers` on the deployed site, or the API docs in the website
repository (`src/app/developers/page.tsx`).
