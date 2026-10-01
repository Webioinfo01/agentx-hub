// Triage an agent-suggestion issue: verify facts, report, label.
// Reports facts only — the listing decision stays with maintainers.
// The category list is read from the issue form dropdown (single source
// of truth, kept in sync with awescholar/agentx/policy.py CATEGORIES).

const API_BASE = "https://agentx.webioinfo.top";
const PUBLIC_REPO = { owner: "Webioinfo01", repo: "agentx-hub" };

const fs = require("fs");

function parseForm(body) {
  const fields = {};
  for (const chunk of String(body || "").split(/^### /m).slice(1)) {
    const nl = chunk.indexOf("\n");
    const label = (nl === -1 ? chunk : chunk.slice(0, nl)).trim().replace(/\*+$/, "").trim();
    const value = nl === -1 ? "" : chunk.slice(nl + 1).trim();
    if (label) fields[label] = value.replace(/^_No response_$/i, "").trim();
  }
  return fields;
}

function githubSlug(text) {
  const m = String(text || "").match(
    /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?=[\s/#?]|$)/i
  );
  return m ? `${m[1]}/${m[2]}` : null;
}

function doiOf(text) {
  const m = String(text || "").match(/10\.\d{4,9}\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[.,;)]+$/, "") : null;
}

function arxivIdOf(text) {
  const t = String(text || "");
  const m =
    t.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})(?:v\d+)?/i) ||
    t.match(/arXiv:\s*(\d{4}\.\d{4,5})/i);
  return m ? m[1] : null;
}

function categoriesFromForm() {
  try {
    const yml = fs.readFileSync(".github/ISSUE_TEMPLATE/agent-suggestion.yml", "utf8");
    const block = yml.split("- type: dropdown").pop().split("validations:")[0];
    return [...block.matchAll(/^\s+-\s+(\S+)\s*$/gm)].map((m) => m[1]);
  } catch {
    return [];
  }
}

async function registryQuery(q) {
  try {
    const res = await fetch(`${API_BASE}/api/agents?q=${encodeURIComponent(q)}&limit=500`);
    if (!res.ok) return null;
    return (await res.json()).agents || [];
  } catch {
    return null;
  }
}

async function paperMetaFrom(doi, arxivId) {
  if (doi) {
    try {
      const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      if (res.ok) {
        const msg = (await res.json()).message;
        const title = (msg.title || [])[0];
        if (title) {
          return {
            title,
            venue: (msg["container-title"] || [])[0] || "DOI",
            source: `DOI ${doi}`,
          };
        }
      }
    } catch {}
  }
  if (arxivId) {
    try {
      const res = await fetch(
        `https://export.arxiv.org/api/query?id_list=${arxivId}&max_results=1`
      );
      if (res.ok) {
        const xml = await res.text();
        const titles = xml.match(/<title>([\s\S]*?)<\/title>/g) || [];
        const title = (titles[1] || "").replace(/<\/?title>/g, "").replace(/\s+/g, " ").trim();
        if (title) return { title, venue: "arXiv", source: `arXiv ${arxivId}` };
      }
    } catch {}
  }
  return null;
}

const clean = (s) => String(s || "").replace(/[`<>]/g, "").trim();
const header = (icon, title) =>
  `🤖 **${icon} ${title}**\n\n*Bot triage — facts only; the listing decision stays with maintainers.*\n`;

module.exports = async ({ github, context, core, issue }) => {
  const number = issue.number;
  const fields = parseForm(issue.body);
  const name = fields["Agent name"] || "";
  const repoField = fields["GitHub repository"] || "";
  const category = fields["Category"] || "";
  const rationale = fields["Why should it be listed?"] || "";

  let report;
  let ready;

  const slug = githubSlug(repoField) || githubSlug(issue.body);
  if (slug) {
    // --- Repo lane -------------------------------------------------------
    let repo;
    try {
      const [owner, repoName] = slug.split("/");
      repo = (await github.rest.repos.get({ owner, repo: repoName })).data;
    } catch {
      report =
        header("❌", "Repository not found") +
        `\`${slug}\` returned 404 on GitHub. Edit the issue with a valid repo URL and the triage will re-run automatically.\n\n` +
        `仓库不存在（404）。请编辑 issue 填入有效链接，bot 会自动重新预检。`;
      ready = false;
    }

    if (repo) {
      const lines = [];
      let blocked = false;
      let warn = "";

      lines.push(
        `- **Repository** — \`${slug}\` · ${repo.language || "?"} · ⭐ ${repo.stargazers_count} · last push ${repo.pushed_at.slice(0, 10)} · ${repo.license ? repo.license.spdx_id : "no license"}`
      );
      if (repo.archived) {
        warn = "The repo is **archived** — it will land in an retired state quickly; include why it is still worth listing.";
        lines.push(`- ⚠️ ${warn}`);
      }

      const agents = (await registryQuery(slug)) || [];
      const exact = agents.find((a) => (a.repo || "").toLowerCase() === slug.toLowerCase());
      if (exact) {
        report =
          header("❌", "Already listed") +
          `\`${slug}\` is already in the registry: [**${clean(exact.name)}**](${API_BASE}/agents/${exact.slug}) (${exact.category} · ⭐ ${exact.stars} · ${exact.status}).\n` +
          `If you meant a different project, edit the issue; if you want to update the entry, please comment with details instead.\n\n` +
          `该仓库已在册。如是不同项目请编辑 issue，如需补充信息请直接评论。`;
        ready = false;
      } else {
        const sameName = name ? ((await registryQuery(name)) || []) : [];
        const near = sameName
          .filter(
            (a) =>
              (a.name || "").toLowerCase() === name.toLowerCase() &&
              (a.repo || "").toLowerCase() !== slug.toLowerCase()
          )
          .slice(0, 5);
        if (near.length) {
          lines.push(
            `- ⚠️ **Same-name entries** — ${near.map((a) => `[${clean(a.name)}](${API_BASE}/agents/${a.slug}) (\`${a.repo}\`)`).join(", ")}. Fine if this is a different project; mention the full repo owner/name in the rationale to disambiguate.`
          );
        }

        const cats = categoriesFromForm();
        if (cats.length && !cats.includes(category)) {
          lines.push(`- ❌ Category \`${category}\` is not one of the registry categories.`);
          blocked = true;
        } else {
          lines.push(`- **Category** — \`${category}\``);
        }

        if (!blocked) {
          const doi = doiOf(rationale);
          const arxiv = arxivIdOf(rationale);
          const paper = doi ? `https://doi.org/${doi}` : arxiv ? `https://arxiv.org/abs/${arxiv}` : null;
          if (paper) lines.push(`- **Paper** — ${paper}`);
          const cmd =
            `awescholar updater add --agentx ${slug} --category ${category}` +
            (name ? ` --name "${clean(name).replace(/"/g, "")}"` : "") +
            (paper ? ` --paper ${paper}` : "");
          lines.push("");
          lines.push(`✅ Pre-check passed. An intake PR will be opened automatically shortly; the agent is listed only after a maintainer reviews and merges it.`);
          lines.push("");
          lines.push("```");
          lines.push(cmd);
          lines.push("```");
          report = header("✅", "Ready for intake") + lines.join("\n") + `\n\n预检通过，将自动生成收录 PR，维护者审核合并后正式收录。`;
          ready = true;
        } else {
          report = header("❌", "Cannot triage yet") + lines.join("\n") + `\n\n请编辑 issue 修正后，bot 会自动重新预检。`;
          ready = false;
        }
      }
    }
  } else {
    // --- Paper lane -------------------------------------------------------
    const doi = doiOf(repoField) || doiOf(issue.body);
    const arxivId = arxivIdOf(repoField) || arxivIdOf(issue.body);
    if (doi || arxivId || name) {
      const meta = await paperMetaFrom(doi, arxivId);
      const title = meta ? meta.title : name;
      const venue = meta ? meta.venue : "";
      const sysName = clean((title || "").split(/[:.—]/)[0]) || clean(name);

      const lines = [];
      lines.push(
        `- **Paper** — ${clean(title)}${venue ? ` (${clean(venue)})` : ""}${meta ? ` · resolved from ${meta.source}` : ""}`
      );

      let candidates = [];
      if (sysName) {
        try {
          const res = await github.rest.search.repos({ q: sysName, per_page: 3, sort: "stars" });
          candidates = res.data.items || [];
        } catch {}
      }
      if (candidates.length) {
        lines.push(`- **Possible code repositories** (please confirm — do NOT trust this guess):`);
        candidates.forEach((c, i) => {
          lines.push(`  ${i + 1}. \`${c.full_name}\` · ⭐ ${c.stargazers_count} — ${clean(c.description).slice(0, 100)}`);
        });
      } else {
        lines.push(`- No obvious code repository found for "${sysName}".`);
      }
      lines.push("");
      lines.push(
        `Reply with the candidate number to confirm the repo, or reply **no code** — papers without code can still be listed (no-repo entries) and will be evaluated manually.`
      );
      report =
        header("⚠️", "Paper suggestion — repo to confirm") +
        lines.join("\n") +
        `\n\n论文线索：请回复候选编号确认仓库，或回复"无代码"（无代码也可作为 no-repo 条目人工评估）。`;
      ready = false;
    } else {
      report =
        header("❌", "Nothing to triage") +
        `No GitHub URL, DOI, or arXiv link could be recognized. Please edit the issue and add at least one of them — the triage will re-run automatically.\n\n` +
        `未能识别出仓库或论文链接，请编辑 issue 补充（GitHub 链接、DOI 或 arXiv 链接任一），bot 会自动重新预检。`;
      ready = false;
    }
  }

  await github.rest.issues.createComment({
    ...PUBLIC_REPO,
    issue_number: number,
    body: report,
  });
  const keep = issue.labels.map((l) => l.name).filter((n) => n !== "triaged-ready" && n !== "needs-info");
  await github.rest.issues.setLabels({
    ...PUBLIC_REPO,
    issue_number: number,
    labels: [...keep, ready ? "triaged-ready" : "needs-info"],
  });
  core.info(`Issue #${number}: labeled ${ready ? "triaged-ready" : "needs-info"}`);
};
