# AgentX

A community registry of research AI agents — directory, side-by-side
comparison, and verified run reviews written by researchers who actually
ran the tools.

This repository is the **public hub for AgentX users**. It hosts the issue
tracker and documentation; the source code itself is in closed development
and is not published here.

## What you can do here

- **Suggest an agent** that should be listed —
  [open an agent suggestion](../../issues/new?template=agent-suggestion.yml)
  (the website's "Contribute" page links here too).
- **Report a bug** in the website or the public API —
  [open a bug report](../../issues/new?template=bug.yml).
- **Report wrong or outdated data** — comment on an existing issue or open
  a bug report with the `data` label.

## Public API

The registry is served through a read-only HTTP API (JSON):

| Endpoint | Description |
|---|---|
| `GET /api/agents?q=&category=&status=&limit=` | Search and list agents |
| `GET /api/agents/{slug}` | One agent with metrics and papers |
| `GET /api/agents/{slug}/reviews` | Verified run reviews for an agent |

`POST /api/agents/{slug}/reviews` accepts review submissions after signing
in. All list endpoints are paginated with `limit` / `offset` and need no
authentication.

## CLI

Registry maintainers drive the validated add-and-refresh pipeline with
[`agentx-hub-cli`](https://github.com/Webioinfo01/agentx-hub-cli)
(`npm install -g agentx-hub-cli`). CLI-specific problems go to
[its own issue tracker](https://github.com/Webioinfo01/agentx-hub-cli/issues).

## License

Registry data is published under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribute to
"AgentX Registry".
