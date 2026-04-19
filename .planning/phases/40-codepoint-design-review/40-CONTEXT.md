# Phase 40: Codepoint 设计反省与改进评估 - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

对照代码点方法论原作者的核心原则（全局思维、集合论、密度校验），审查当前 Codepoint V2 技能设计是否有偏离，输出独立的改进建议文档。

Scope:
- 审查 scan/plan/implement 三阶段流程的设计合理性
- 评估数据模型（Collection/Flow/Point）与原作者集合论的契合度
- 评估探针密度校验标准的合理性
- 输出可执行的改进建议文档

</domain>

<decisions>
## Implementation Decisions

### Scan 阶段设计
- **D-01:** Deep dive 阶段过度细化（逐文件追踪），偏离了原作者的全局思维原则
- **D-02:** Scan 改进方向：**链路导向替代文件导向** — 只追踪入口→出口的完整调用链，识别模块边界和状态变更点，不做逐函数级别分析

### Plan/Implement 流程
- **D-03:** 当前三步流程（scan/plan/implement）属于过度工程化，但保留三步结构不做删除
- **D-04:** Plan 阶段重新定位为**"集合构建"** — 不是为新功能规划探针，而是基于全局理解构建代码点集合，识别 3-5 条核心执行链路，确定集合中每个代码点的位置和类型
- **D-05:** Implement 阶段定位调整为**"一次性埋设"**，而非当前的"TDD 循环"模式

### 探针密度与数据模型
- **D-06:** 三层模型（Collection→Flow→Point）合理，符合原作者集合论视角，不需简化
- **D-07:** 密度目标值需按项目类型调整 — 原作者给出 Tomcat ~20、数据库 ~200+ 的参考，当前统一 20%-60% 不够灵活
- **D-08:** 当前 scan 中没有实际执行密度校验（只在 SKILL.md 中描述了概念），需增加自动密度校验环节

### 改进建议的输出
- **D-09:** 输出为独立的设计反省文档（如 `docs/research/codepoint/2026-04-19-design-review.md`），不修改现有技能文件
- **D-10:** 改进建议为**可执行的具体建议**（如"scan Phase 2 从逐文件追踪改为链路导向，步骤：1)识别入口→出口调用链 2)只标记模块边界和状态变更 3)不分析中间函数"），不是原则性方向

### Claude's Discretion
- 具体文档的结构和章节组织
- 对照审查时的具体措辞和表达
- 是否引用 E2E 测试项目作为对照案例

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 方法论原文（核心参考）
- `docs/research/codepoint/2026-04-17-methodology.md` — 主调研文档，包含原作者完整方法论（371 行）
- `docs/research/codepoint/2026-04-19-global-thinking.md` — 全局思维埋点补充，提炼核心原则

### 当前技能实现
- `plugins/codepoint/skills/codepoint/SKILL.md` — Codepoint V2 主技能定义
- `plugins/codepoint/skills/scan/SKILL.md` — Scan 阶段技能
- `plugins/codepoint/skills/plan/SKILL.md` — Plan 阶段技能
- `plugins/codepoint/skills/implement/SKILL.md` — Implement 阶段技能

### 设计规格（历史参考）
- `docs/superpowers/specs/2026-04-18-codepoint-v2-redesign.md` — V2 重设计规格
- `docs/superpowers/plans/2026-04-18-codepoint-v2-redesign.md` — V2 重设计计划

### E2E 测试项目（验证参考）
- `tests/e2e/codepoint-v2/` — 5 个已验证的测试项目

### 项目文档
- `.planning/REQUIREMENTS.md` §R4 — Phase 40 需求定义

</canonical_refs>

<code_context>
## Existing Code Insights

### 当前技能架构
- 三阶段技能（scan/plan/implement），各自有独立 SKILL.md
- 3 种语言支持（Go/Python/TypeScript），各有 references/ 下的模板文件
- 文件开关机制（`~/.codepoint/.codepoint-{lang}`）
- collector 模式：后端文件写入 + 前端 HTTP POST
- V2 探针输出格式：结构化 JSON（point_id, flow_id, stack, metadata）

### 数据模型
- `.codepoints/` 目录结构：collections/, flows/, points/, verification/
- `index.json` 全局索引供 AI 查询
- Markdown 文档供人类阅读

### 已验证的 E2E 成果
- 5 个测试项目全部通过 scan→plan→implement 全流程
- 验证了 Go/Python 单语言和 Go+JS/Python+TS 跨语言场景
- 共产出 ~20 codepoints per project, 3 flows per project

</code_context>

<specifics>
## Specific Ideas

- 原作者 2.2 节明确说"AI 不能替代埋点决策"——但当前 scan 阶段正是让 AI 来识别埋点位置，这本身可能就是一个根本性的偏差
- 原作者的流程是"人理解系统→人埋点→AI 筛选"，当前技能的流程是"AI 扫描→AI 规划→AI 埋设"，角色定位完全不同
- 密度校验不仅需要自动化，还需要在 scan 输出后就能评估——而不是等到 implement 之后
- 改进建议应区分"设计偏差"和"合理偏离"——有些偏离是因为我们做的是工具化/Skill 化，不是原教旨复刻

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope
</deferred>

---

*Phase: 40-codepoint-design-review*
*Context gathered: 2026-04-19*
