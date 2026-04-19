# Phase 39: 调研文档归档与整理 - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

将 Codepoint 方法论的调研文档从外部目录 `C:\WorkSpace\agent\researche\` 归档到项目内 `docs/research/codepoint/`，建立按日期命名的文档结构，便于后续追加作者新分享。

Scope:
- 归档调研文档、配图、workspace 开发记录
- 建立可追加的目录结构
- 不修改调研内容本身

</domain>

<decisions>
## Implementation Decisions

### 归档内容范围
- **D-01:** 全部归档 — 调研文档 (`代码点调研.md`)、微信配图 (`代码点/` + `代码点_small/`)、workspace 开发记录 (`codepoint-workspace/`)
- **D-02:** `codepoint-test/` 已在 Phase 38 迁移到 `tests/e2e/codepoint-v2/`，不重复归档

### 文档组织结构
- **D-03:** 按日期命名多文件，结构如下：
  ```
  docs/research/codepoint/
  ├── 2026-04-17-methodology.md    # 主调研文档
  ├── 2026-04-19-global-thinking.md # 作者后续分享（全局思维埋点）
  ├── images/                       # 配图（重命名后）
  └── workspace/                    # codepoint-workspace 开发记录
  ```
- **D-04:** 后续作者新分享只需添加新的 `YYYY-MM-DD-topic.md` 文件

### 图片处理策略
- **D-05:** 微信图片重命名为描述性名称（如 `01-methodology-overview.jpg`），放入 `images/` 子目录
- **D-06:** Markdown 中用相对路径引用 `./images/` 中的图片
- **D-07:** `代码点/` 和 `代码点_small/` 中选择质量更好的版本归档，不需要两份都保留

### Claude's Discretion
- 图片的具体命名（根据内容确定描述性名称）
- workspace 目录的整理方式（保持原结构或重组）
- 是否需要创建 README.md 索引文件

</decisions>

<canonical_refs>
## Canonical References

### 调研源文件
- `C:\WorkSpace\agent\researche\代码点调研.md` — 主调研文档（370 行，归档源）
- `C:\WorkSpace\agent\researche\代码点\` — 原作者分享配图（5 张微信截图）
- `C:\WorkSpace\agent\researche\代码点_small\` — 同上压缩版（5 张 jpg）
- `C:\WorkSpace\agent\researche\codepoint-workspace\` — Codepoint V2 开发迭代记录

### 项目文档
- `.planning/REQUIREMENTS.md` §R2 — 调研文档归档需求定义
- `.planning/PROJECT.md` — 项目上下文

</canonical_refs>

<code_context>
## Existing Code Insights

### 目录约定
- `docs/` 目录已存在，用于项目文档
- `docs/research/` 尚未创建，需要新建
- CLAUDE.md 指定 `tmp/` 为临时目录，`docs/` 为持久文档目录

### 已有参考
- `docs/superpowers/` 下已有设计文档（specs, plans）的归档模式可参考

</code_context>

<specifics>
## Specific Ideas

- 源文件路径使用 Windows 绝对路径 `C:\WorkSpace\agent\researche\`
- 图片重命名时需要理解每张图的内容（可能需要查看图片来命名）
- workspace 中的 evals.json 和 iteration-1/ 是 Codepoint V2 的 E2E 测试迭代记录，有历史参考价值

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope
</deferred>

---

*Phase: 39-research-docs-archive*
*Context gathered: 2026-04-19*
