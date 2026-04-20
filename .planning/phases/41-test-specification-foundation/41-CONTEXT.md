# Phase 41: Test Specification Foundation - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

为前端测试流程建立标准化规划模板和探针代码片段。开发者可以使用结构化模板规划"点击→响应→验证"的测试流程，并获取可直接复制使用的探针代码片段。

Scope:
- 创建 /codepoint-test-plan 子技能（SKILL.md）
- 定义 6 段式测试计划模板（Flow 为单位）
- 定义三段式测试用例格式（Action→Response→Verify）
- 提供 4 类前端探针代码片段（button click, form submit, API call, state change）
- 测试计划存储在 .codepoints/test-plans/ 并与 Flow 显式映射

</domain>

<decisions>
## Implementation Decisions

### 技能形态与交付形式
- **D-01:** Codepoint 子技能 — 在 `plugins/codepoint/skills/test-plan/SKILL.md` 下新建，复用 codepoint 的 references/ 和数据模型，技能入口为 `/codepoint-test-plan`
- **D-02:** 交互式生成工作流 — 开发者描述功能或提供 spec → 技能读取 `.codepoints/index.json` → 输出结构化测试计划文档

### 测试计划模板结构
- **D-03:** Flow 为单位 — 每个测试计划文档对应一个 Flow（如 flow-user-login），紧凑实用，与 .codepoints/ 数据模型直接对齐
- **D-04:** 三段式测试用例格式 — 每个 test case 固定三段：Action（用户操作）→ Expected Response（UI 状态变化）→ Verify（可见输出断言）
- **D-05:** 6 段式模板 — 标题、Flow ID、前置条件、测试用例列表、Codepoint 映射表、探针片段引用

### 探针代码片段范围
- **D-06:** 新建测试专用片段文件 — `plugins/codepoint/references/test-probes.md`，与 frontend.md 的通用模式分开
- **D-07:** 4 类基础模式 — 按钮点击、表单提交、API 调用、状态变更，与 TSPEC-03 精确对齐，每类 1-2 个片段
- **D-08:** 框架无关 — 纯 JS/TS 片段，不依赖 React/Vue 等特定框架 API

### 存储位置与关联方式
- **D-09:** `.codepoints/test-plans/` 子目录 — 与 flows/、points/、verification/ 并列，每个 Flow 对应一个测试计划文件（如 `test-plans/flow-user-login.md`）
- **D-10:** 显式映射表 — 测试计划内置映射表（6 段式第 5 段），明确列出每个测试用例触发的 codepoint sequence

### Claude's Discretion
- SKILL.md 的具体步骤编排和措辞
- 测试计划模板的具体 markdown 格式细节
- 探针片段的代码示例编写风格

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Codepoint 核心定义
- `plugins/codepoint/skills/codepoint/SKILL.md` — Codepoint V2 主技能定义，三层模型、命令列表、关键原则
- `plugins/codepoint/references/data-model.md` — 数据模型规格，CodePoint/Flow/Collection 定义、探针输出格式、密度校验
- `plugins/codepoint/references/frontend.md` — 前端探针实现指南，React/Vue/Node 模式、双模式输出（Browser/Node.js）

### 已有子技能（参考结构）
- `plugins/codepoint/skills/scan/SKILL.md` — Scan 子技能结构参考
- `plugins/codepoint/skills/plan/SKILL.md` — Plan 子技能结构参考
- `plugins/codepoint/skills/implement/SKILL.md` — Implement 子技能结构参考

### 设计反省与改进方向
- `docs/research/codepoint/2026-04-19-design-review.md` — 5 条偏差（CP-01~05）+ 3 条合理偏离 + 改进建议总表
- `docs/research/codepoint/2026-04-19-global-thinking.md` — 全局思维核心原则提炼
- `docs/research/codepoint/2026-04-17-methodology.md` — 代码点方法论原文（371 行）

### 项目文档
- `.planning/REQUIREMENTS.md` — TSPEC-01/02/03 需求定义
- `.planning/PROJECT.md` — 项目上下文、关键决策历史

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `plugins/codepoint/references/frontend.md`: 已有 React/Vue/Node 探针模式，包含 pointWithMeta V2 模式 — test-probes.md 可以引用其中的基础 API（point, pointWithMeta, pointAsync）
- `plugins/codepoint/references/data-model.md`: Flow 的 sequence 字段和 test_cases 结构 — 测试计划模板可以直接使用 flow_id 和 point_id 术语
- `plugins/codepoint/skills/plan/SKILL.md`: Plan 子技能的 SKILL.md 结构 — test-plan SKILL.md 可以参考同样的 frontmatter 和段落组织

### Established Patterns
- SKILL.md 使用 YAML frontmatter（name, description）+ `<objective>`, `<context>`, `<workflow>` 等自定义段落
- 探针输出为结构化 JSON：`{ point_id, flow_id, timestamp, stack, metadata }`
- .codepoints/ 目录约定：collections/, flows/, points/, verification/ 各自存放 markdown 文档

### Integration Points
- 新技能 `/codepoint-test-plan` 作为 codepoint 插件的第四个子技能，与 scan/plan/implement 并列
- 测试计划存储在 `.codepoints/test-plans/`，通过 flow_id 与 flows/ 目录中的 Flow 定义关联
- 映射表通过 point_id 列表与 points/ 目录中的 CodePoint 定义关联

</code_context>

<specifics>
## Specific Ideas

- 测试计划的 6 段结构应直接反映在 SKILL.md 的 output template 中，开发者拿到即可用
- Codepoint 映射表格式建议：表格形式，列为 Test Case ID | Codepoint Sequence | Expected Firing Order
- 探针片段引用段应给出具体的文件路径（如 `plugins/codepoint/references/test-probes.md#button-click`），方便开发者直接查找
- TSPEC-02 的 "assertion on visible output" 应体现为 Verify 段的具体断言描述，不是代码级断言

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 41-test-specification-foundation*
*Context gathered: 2026-04-20*
