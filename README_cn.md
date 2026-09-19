<div align="center">
  <img src="./src/app/icon.svg" alt="AgentX" width="120">
  <h1>AgentX：科研 AI agent 验证收录与评价平台</h1>
  <p><strong>发现、对比、评审科研 AI agent。</strong></p>
  <p>社区驱动的 agent 目录，附实测评价与实时 GitHub 指标。</p>
  <p>
    <a href="./README.md">English</a> ·
    <strong>简体中文</strong>
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

> 发现、对比、评审科研 AI agent。

AgentX 是一个追踪科研 AI agent 的社区网站：带实时 GitHub 指标的策展目录、来自真正用过这些工具的研究者的 Verified Run 实测评价、并排对比，以及月度生态报告。收录免费、人工编辑、只看匹配度 —— 与 star 数无关。

## 使用网站

- **浏览**（`/agents`）—— 200+ 个 agent，按 10 类用户意图分类；实时 GitHub 指标（star、最近推送、语言、许可证）；搜索 / 筛选 / 排序；新收录 7 天内带 🔥 New 标
- **对比**（`/compare`）—— 最多 4 个 agent 并排比较，含评价得分和配套论文
- **评价** —— 分享你的使用经验；Verified Run 实测评价决定每个 agent 的得分（规则见下）
- **月度报告**（`/reports`）—— 每月新增、仓库活跃度、评价动态，全部由注册表数据实时计算
- **同名消歧**（`/samename`）—— ScienceClaw / MedClaw / autoresearch 等同名冲突的整理分组

## 评价规则

| | 普通评论 | Verified Run 实测评价 |
|---|---|---|
| 要求 | ≥10 字符 | ≥30 字符 + 证据 URL + 5 项评分（1–5） |
| 计入总分 | 否 | 是（审核通过后） |
| 证据 | — | 仓库 / gist / PR / 运行日志链接 |

证据放在评价者自己 GitHub 账号下（`https://github.com/<login>/…`）的，自动通过并标记为 **self-attested**；其余进入 **待审**，由维护者人工核查。五个评分维度：实用性、科学准确性、证据质量、可靠性、易用性。

## 添加 agent

注册表通过社区提名和策展导入增长。收录免费、人工编辑、只看匹配度 —— 与 star 数、赞助、谁嗓门大无关。

### 提名 agent（任何人）

开一个 issue，写清基本信息：名称、仓库地址、建议分类、论文链接（如有）、一句话说明为什么符合。没有模板体操，维护者每条都读。

[**去 GitHub 提名 agent →**](https://github.com/Webioinfo01/agentx-hub/issues/new?title=Agent+suggestion%3A+%3Cname%3E)

收录标准：

- **做科研。** agent 执行或辅助科学工作 —— 文献、生物信息、化学、药物发现、临床流程、自主研究、围绕科研 agent 的编排。
- **有公开仓库或论文。** 能抓取指标的 GitHub 仓库，或有可用链接的配套论文。两者皆无的闭源 SaaS 无法诚实追踪。
- **只有客观事实。** 描述来自仓库本身；标签只承载机构和期刊，不承载营销话术。有争议的名字进同名消歧（`/samename` 页），绝不悄悄合并。

### 提交之后

1. **匹配检查** —— 维护者按上述标准核查，并在 issue 里回复：收录，或缺什么。
2. **创建记录** —— 仓库走验证过的添加流水线：分类与标签策略检查，一次实时 GitHub 抓取获取指标和描述。没有任何手工录入。
3. **以新收录上线** —— agent 带 New 标展示 7 天，之后与所有记录一样追踪推送、star 和评价。

维护者通过验证过的 CLI 添加记录 —— 注册表快照永不手工编辑。操作命令（`awescholar updater add --agentx`、`awescholar verify --agentx` 等）由 Python 包 [`awescholar`](https://github.com/wehuman01/awescholar) 提供。完整流水线、分类和标签策略见 [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)（英文）。

## 公开 API 与技能

- `GET /api/agents` —— 目录 + 评分摘要（`q`、`category`、`status`、`limit` 筛选）
- `GET /api/agents/[slug]` —— 单个 agent 记录及评分摘要
- `GET /api/agents/[slug]/reviews` —— 单个 agent 的评价
- `GET /llms.txt` —— 全库纯文本索引（llms.txt 约定）
- `POST /api/agents/[slug]/reviews` —— 创建评价（需登录）
- `POST /api/reviews/[id]/vote` —— 有用 / 无用投票（需登录）

只读端点均开 CORS。带示例的完整参考见 [docs/API.md](./docs/API.md)，站点 `/developers` 页渲染同样内容。

`skills/` 内置一个面向 coding agent 的技能 `agentx`，封装公开 API，覆盖搜索、推荐、对比——无需密钥、无需登录：

```bash
npx skills add webioinfo01/agentx-hub -g -y
```

用 [aweskill](https://github.com/wehuman01/aweskill) 管理技能的话：

```bash
aweskill store install Webioinfo01/agentx-hub --all
aweskill agent add skill agentx --global
```

细节和 `AGENTX_API_BASE` 覆盖见 `skills/README.md`。

## 数据来源

- **[claw4science.org](https://claw4science.org/)** —— 最初约 160 条记录来自其公开 API 的导入（只取事实：仓库地址、项目名、分类）。导入是历史性的；本目录不再从 claw4science 同步，分类和成员由本地策展。
- **[Awesome AI Meets Biology](https://github.com/Webioinfo01/Awesome-AI-Meets-Biology)** —— 从该策展调查导入的学术 bio-agent（[Huang 等，2026，*Genomics Communications*](https://doi.org/10.48130/gcomm-0026-0005)），论文链接在有正式发表版时指向发表版。
- **[awescholar](https://github.com/Webioinfo01/awescholar)** —— 本站维护工具之一：配套论文元数据（标题、期刊、年份、团队、DOI）由其 CLI 对接 Semantic Scholar 解析。
- **GitHub API** —— star、最近推送、语言、许可证和仓库描述，每日刷新。

每条收录的来源都记录在快照里；站点 `/data-sources` 页详细说明各来源取什么、什么是我们自己的。本项目独立运行，与任何收录的 agent 无隶属关系。

## 路线图

- agent 执行沙箱（在浏览器里跑 agent）
- 单任务多 agent 编排
- 基于 CI 日志的 Verified Run 标自动认证

## 引用

如果你在研究中觉得本仓库有用，请引用我们的论文：

Huang S, Lang M, Chen Z, Yang C, Huang X, et al. 2026. From foundation models to autonomous agents in biology. Genomics Communications 3: e006 doi: 10.48130/gcomm-0026-0005

## 开发

本仓库是注册表的开源主场：快照数据、`agentx` 技能和文档。维护者添加流水线和参与方式见 [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)（英文）；站点应用代码另行开发，不在本仓库。

## 许可

- **本仓库代码**（`skills/`）—— MPL-2.0，见 [LICENSE](./LICENSE)。MPL 按文件授权：对这些文件的修改必须保持开源；与你自己的代码组合不受影响。
- **注册表数据**（`data/`）、月度报告和文档 —— [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，署名 "AgentX Registry, https://github.com/Webioinfo01/agentx-hub"。
- **用户评价** —— CC BY 4.0，署名为评价者的 GitHub 账号；提交时授予的授权见站点 Terms 页（`/terms`）。
