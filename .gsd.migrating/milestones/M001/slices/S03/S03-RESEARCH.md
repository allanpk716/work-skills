# Phase 40: Codepoint 设计反省与改进评估 - Research

**Researched:** 2026-04-19
**Domain:** 代码点方法论 vs Codepoint V2 技能设计 — 对照审查
**Confidence:** HIGH

## Summary

本阶段是一个纯文档分析/审查型任务，不涉及代码修改或新功能开发。核心工作是对照原作者方法论（全局思维、集合论、密度校验）与当前 Codepoint V2 技能设计（scan/plan/implement 三阶段），识别设计偏差，输出可执行的改进建议文档。

通过详细阅读方法论原文（`2026-04-17-methodology.md`，371 行）和全局思维补充（`2026-04-19-global-thinking.md`），以及当前四个 SKILL.md 文件和 E2E 测试产出的 index.json，我已经掌握了完整的比对材料。关键发现：原作者流程是"人理解系统 -> 人埋点 -> AI 筛选"（3 步），当前技能是"AI 扫描 -> AI 规划 -> AI 埋设 + TDD 验证"（3 阶段 6+ 步），角色定位完全不同。三层数据模型（Collection/Flow/Point）与集合论契合度高，但 scan Phase 2 的逐文件追踪和 plan 阶段的"为新功能规划探针"都偏离了原作者的核心理念。

**Primary recommendation:** 以方法论原文 2.1-2.3 节和 2.7 节为标尺，逐条比对 scan/plan/implement SKILL.md 中的每个步骤，区分"设计偏差"和"合理偏离"（工具化/Skill 化的必然调整），输出含具体改进步骤的反省文档。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Deep dive 阶段过度细化（逐文件追踪），偏离了原作者的全局思维原则
- **D-02:** Scan 改进方向：链路导向替代文件导向 — 只追踪入口到出口的完整调用链，识别模块边界和状态变更点，不做逐函数级别分析
- **D-03:** 当前三步流程（scan/plan/implement）属于过度工程化，但保留三步结构不做删除
- **D-04:** Plan 阶段重新定位为"集合构建" — 不是为新功能规划探针，而是基于全局理解构建代码点集合，识别 3-5 条核心执行链路，确定集合中每个代码点的位置和类型
- **D-05:** Implement 阶段定位调整为"一次性埋设"，而非当前的"TDD 循环"模式
- **D-06:** 三层模型（Collection/Flow/Point）合理，符合原作者集合论视角，不需简化
- **D-07:** 密度目标值需按项目类型调整 — 原作者给出 Tomcat 约 20、数据库约 200+ 的参考，当前统一 20%-60% 不够灵活
- **D-08:** 当前 scan 中没有实际执行密度校验（只在 SKILL.md 中描述了概念），需增加自动密度校验环节
- **D-09:** 输出为独立的设计反省文档（如 `docs/research/codepoint/2026-04-19-design-review.md`），不修改现有技能文件
- **D-10:** 改进建议为可执行的具体建议（如"scan Phase 2 从逐文件追踪改为链路导向，步骤：1)识别入口到出口调用链 2)只标记模块边界和状态变更 3)不分析中间函数"），不是原则性方向

### Claude's Discretion
- 具体文档的结构和章节组织
- 对照审查时的具体措辞和表达
- 是否引用 E2E 测试项目作为对照案例

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R4 | 对照原作者最新建议审查当前 codepoint 技能的探针密度和设计 | 方法论原文 2.3 节提供密度标准（Tomcat 约 20, 数据库约 200+），2.7 节提供集合论基础。当前 scan SKILL.md 和 data-model.md 中 20%-60% overlap 标准需比对评估 |
| R4 | 评估 scan 阶段是否过度（传统思路）vs 全局思维 | 方法论原文 2.2 节明确"AI 不能替代埋点决策"，scan Phase 2 的逐文件追踪是比对重点。E2E 测试产出（index.json 中的 scan_notes 字段）可佐证实际行为 |
| R4 | 评估 plan/implement 阶段是否符合"按提示词动态触发"原则 | 方法论原文 2.7 节描述"提示词+集合->LLM 筛选子集"的运行时模式。当前 plan SKILL.md 定义的是"为新功能规划探针"的静态规划模式，两者对比 |
| R4 | 输出改进建议文档，作为后续版本的设计输入 | 按决策 D-09 输出到 docs/research/codepoint/，按 D-10 每条建议需具体可执行 |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 方法论对照分析 | 文档/研究层 | — | 纯文档审查，不涉及代码运行时 |
| E2E 测试结果引用 | 测试资产层 | — | 引用已有 E2E 产出作为论证材料 |
| 改进建议撰写 | 文档/研究层 | — | 输出为 Markdown 文档 |
| 技能 SKILL.md 审查 | 插件配置层 | — | SKILL.md 是技能定义，非运行时代码 |

## Standard Stack

本阶段为纯文档分析任务，不涉及代码开发，无需安装任何库。

### 核心参考材料（必读）

| 材料 | 位置 | 用途 |
|------|------|------|
| 方法论原文 | `docs/research/codepoint/2026-04-17-methodology.md` | 原作者完整方法论（371 行），包含 2.1-2.8 全部章节 |
| 全局思维补充 | `docs/research/codepoint/2026-04-19-global-thinking.md` | 提炼全局思维核心原则，含对技能设计的启示 |
| 主技能定义 | `plugins/codepoint/skills/codepoint/SKILL.md` | V2 主入口，定义三层模型和关键原则 |
| Scan SKILL.md | `plugins/codepoint/skills/scan/SKILL.md` | 审查对象 — 两阶段扫描流程 |
| Plan SKILL.md | `plugins/codepoint/skills/plan/SKILL.md` | 审查对象 — 新功能埋点规划 |
| Implement SKILL.md | `plugins/codepoint/skills/implement/SKILL.md` | 审查对象 — TDD 式探针插入和验证 |
| 数据模型规格 | `plugins/codepoint/references/data-model.md` | 三层模型详细定义和密度校验标准 |
| E2E 测试产出 | `tests/e2e/codepoint-v2/*/.codepoints/index.json` | 实际 scan 产出，可佐证 scan 行为 |
| V2 设计规格 | `docs/superpowers/specs/2026-04-18-codepoint-v2-redesign.md` | 历史参考 — V2 重设计时的决策背景 |

## Architecture Patterns

### 原作者方法论的核心流程（对标基准）

```
架构师全局理解系统（人）
        |
        v
识别 3-5 条核心执行链路（人）
        |
        v
在关键位置埋设 20-200 个代码点（人）
        |
        v
运行时按需触发，捕获堆栈（系统）
        |
        v
提示词 + 代码点集合 -> LLM 筛选子集 -> 定位问题（AI）
```

三个关键角色：
1. **人** — 全局理解、选点埋设（前置条件，不可跳过）
2. **系统** — 运行时捕获（自动化基础设施）
3. **AI** — 从集合中筛选子集（运行时消费方）

### 当前技能的流程（待审查）

```
/codepoint-scan Phase 1: AI 概览（目录结构、入口、路由）
        |
        v
/codepoint-scan Phase 2: AI 逐文件追踪（入口handler->service->repository）
        |
        v
/codepoint-plan: AI 分析 spec，规划探针位置和类型
        |
        v
/codepoint-implement Red: 确认方案
        |
        v
/codepoint-implement Green: 生成并插入探针代码
        |
        v
/codepoint-implement Verify: 自动生成测试用例，运行验证
```

### 对照审查框架

审查应覆盖以下维度：

| 维度 | 原作者原则 | 当前实现 | 偏差判定 |
|------|-----------|---------|---------|
| 埋点决策者 | 必须是深度理解系统的人（2.2 节） | AI 驱动 scan 识别埋点位置 | 需评估 |
| 分析粒度 | 全局思维，关注核心链路（2.2 节） | Phase 2 逐文件逐函数追踪 | 已确认偏差（D-01） |
| 集合构建 | 人基于全局理解构建集合（2.7 节） | AI 根据 spec 规划探针 | 需评估 |
| 埋设方式 | 一次性手动埋设（2.2 节） | TDD 三步循环（Red/Green/Verify） | 已确认偏差（D-05） |
| 密度标准 | 按项目类型差异大（2.3 节） | 统一 20%-60% overlap | 已确认偏差（D-07） |
| 密度校验 | 必须校验（2.3 节） | 仅描述概念，未实际执行 | 已确认偏差（D-08） |
| 数据模型 | 集合论（集合->子集）（2.7 节） | Collection/Flow/Point | 已确认合理（D-06） |

### 推荐的改进建议文档结构

```markdown
docs/research/codepoint/2026-04-19-design-review.md

1. 审查背景与方法
2. 设计偏差清单（逐条比对）
   - 每条偏差：原作者原话 vs 当前设计 vs 具体改进步骤
3. 合理偏离说明（工具化必然调整）
4. 改进建议总表（按优先级排列）
5. 与 E2E 测试结果的交叉验证
6. 对后续版本的设计建议
```

## Don't Hand-Roll

本阶段无代码开发，此项不适用。

## Common Pitfalls

### Pitfall 1: 将"设计偏差"和"合理偏离"混为一谈
**What goes wrong:** 把所有与原作者不一致的地方都标记为"需要改进"，导致建议文档缺乏操作性
**Why it happens:** 原作者的方法论是面向人类架构师的纯方法论，我们做的是工具化/Skill 化，某些偏离是必然的
**How to avoid:** 对每条差异明确标注 — "设计偏差"（应改进）vs "合理偏离"（工具化必然调整，可保留）
**Warning signs:** 改进建议中出现"回归原作者做法"但没有考虑工具化场景的特殊性

### Pitfall 2: 改进建议过于原则化
**What goes wrong:** 建议写成了"应采用全局思维"、"应简化流程"等原则，无法直接执行
**Why it happens:** 原作者的方法论本身就是原则性的，审查容易停留在原则层面
**How to avoid:** 每条建议必须包含：1) 要改什么（具体到 SKILL.md 的哪个步骤）2) 改成什么样（具体的新流程描述）3) 改动的预期效果
**Warning signs:** 建议文档的每条建议如果一句话能说完，可能太原则化

### Pitfall 3: 忽略原作者 2.2 节的"AI 不能替代埋点决策"警告
**What goes wrong:** 审查时绕过这个根本性问题，只在表层流程上做调整
**Why it happens:** 这个问题触及技能的存在基础 — 如果 AI 不能替代埋点决策，那 AI 驱动的 scan 技能是否本身就有问题
**How to avoid:** 必须正面回应这个问题。可能的回答：技能不是替代人的全局理解，而是辅助人更快完成全局理解。scan 的定位应是"辅助工具"而非"替代决策"
**Warning signs:** 审查文档中没有提及 2.2 节的 AI 角色定位问题

### Pitfall 4: 未引用 E2E 测试产出作为实证
**What goes wrong:** 审查仅基于 SKILL.md 文本分析，缺少实际行为的证据
**Why it happens:** 审查者可能只读了技能定义文件，没有看 E2E 测试中 scan 的实际产出
**How to avoid:** 至少引用 2 个 E2E 项目的 index.json 作为佐证（go-calculator 和 gojs-calculator 的 scan_notes 和 codepoint 布局）
**Warning signs:** 审查文档没有引用任何具体的 E2E 测试结果

### Pitfall 5: 密度校验建议缺乏可操作性
**What goes wrong:** 建议增加"自动密度校验"但没有说明怎么计算、何时触发、阈值如何设定
**Why it happens:** 密度校验涉及堆栈分析算法，原作者只给了定性描述（交集太大/完全没有），没有给出精确算法
**How to avoid:** 明确密度校验的计算方法（参考 data-model.md 和 methodology.md 4.1 节的 AnalyzeOverlap 实现），给出触发时机和按项目类型调整的阈值建议
**Warning signs:** 密度校验建议只有"应增加自动校验"一句话

## Code Examples

### 示例：偏差对比的推荐格式

```markdown
### 偏差 CP-01: scan Phase 2 逐文件追踪 vs 全局思维

**原作者原话（2.2 节）：**
> 埋代码点需要对系统的设计和实现都很了解的人去做，
> 一定要有全局思维。

**当前设计（scan SKILL.md Phase 2）：**
> Trace execution paths — Read the entry point handler/controller
> function, Trace function calls through service layer, repository
> layer, external calls

**偏差分析：**
Phase 2 的逐文件逐函数追踪从"全局思维"退化为"局部扫描"。
E2E 测试中 gojs-calculator 的 index.json scan_notes 字段记录：
"Scan performed by analyzing source code"，说明实际执行的是文件级分析。

**具体改进步骤：**
1. scan Phase 2 从"逐文件追踪"改为"链路导向"
2. 只追踪入口到出口的完整调用链（如 HTTP handler -> service -> repo -> DB）
3. 在调用链上只标记：模块边界、状态变更点、并发点、错误路径
4. 不分析中间函数的内部逻辑
5. 输出为 3-5 条核心链路图（而非完整的文件级报告）
```

### 示例：合理偏离的推荐格式

```markdown
### 合理偏离 RD-01: AI 辅助 scan vs 人手动埋点

**原作者原话（2.2 节）：**
> ai 都知道去哪里埋代码点了那还需要代码点干嘛！

**当前设计：**
/codepoint-scan 由 AI 执行代码扫描并建议埋点位置

**为何是合理偏离：**
原作者批评的是"AI 自己就知道埋点位置"的场景。
我们的技能定位是"辅助工具"——AI 不做最终的埋点决策，而是：
1. 快速梳理代码结构（人可能需要数小时的工作）
2. 提出候选位置供人审核确认（scan Phase 1 的 User Confirmation）
3. 最终埋点决策权在用户手中

工具化必然需要 AI 参与，关键是保留人的审核和决策权。
```

## State of the Art

| 原作者表述 | 当前理解 | 改进建议依据 |
|-----------|---------|-------------|
| "全局思维" | 理解系统核心执行链路 | scan Phase 1 合理，Phase 2 需改为链路导向 |
| "集合论" | Collection=集合, Flow=子集, Point=元素 | 三层模型合理（D-06） |
| "密度校验" | 堆栈交集分析 | 需要自动化 + 按项目类型调整阈值（D-07, D-08） |
| "AI 不能替代埋点决策" | 角色定位问题 | scan 应定位为辅助工具，保留人的决策权 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 原作者方法论是唯一正确标准，偏差都需要改进 | Summary | 如果原作者方法论本身有局限，部分"偏差"可能不是问题 |
| A2 | E2E 测试项目的 scan 产出反映了实际使用行为 | Code Examples | 如果 E2E 测试是手动执行的（scan_notes 暗示如此），可能不代表正常使用模式 |
| A3 | 三层模型（Collection/Flow/Point）完美映射集合论 | Standard Stack | Flow 作为"有序组合"可能不完全等同于集合论中的"子集"关系 |

**All other claims in this research are verified from source documents.**

## Open Questions

1. **Flow 的"有序组合"与集合论中"子集"的关系**
   - What we know: 原作者 2.7 节说"找到一个代码点的子集就能解决各种问题"，没有强调顺序
   - What's unclear: Flow 定义中的 sequence（有序）是否偏离了集合论中集合的无序性
   - Recommendation: 在审查文档中标注为"需确认"，建议改为"集合中的元素有序排列"以兼顾实用性和理论一致性

2. **"一次性埋设"是否仍需验收环节**
   - What we know: D-05 决定 implement 改为"一次性埋设"而非 TDD 循环
   - What's unclear: "一次性埋设"是否意味着去掉 Verify 阶段，还是简化但不删除
   - Recommendation: 建议保留轻量验收（确认探针能触发、输出格式正确），去掉 TDD 三步循环和复杂测试用例生成

3. **scan 的定位是"替代人"还是"辅助人"**
   - What we know: 原作者明确反对 AI 替代人的埋点决策（2.2 节）
   - What's unclear: 在工具化场景下，scan 应完全放弃自动埋点建议，还是保留但强调"辅助+人工审核"
   - Recommendation: 按讨论结论，scan 定位为辅助工具，保留 Phase 1 的 User Confirmation 环节，Phase 2 改为链路导向后仍然是辅助人更快理解系统

## Environment Availability

Step 2.6: SKIPPED — 本阶段为纯文档分析任务，无外部依赖。所有参考材料均在本地文件系统中已验证可读。

## Validation Architecture

### Test Framework

本阶段无自动化测试需求 — 产出为文档，验证方式为人工审查。

| Property | Value |
|----------|-------|
| Framework | N/A — 纯文档产出 |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R4 | 输出反省文档含偏差清单 | Manual review | N/A | Wave 0 创建 |
| R4 | 每条建议可执行 | Manual review | N/A | Wave 0 创建 |
| R4 | 区分偏差与合理偏离 | Manual review | N/A | Wave 0 创建 |

### Sampling Rate
- **Per task commit:** 人工检查产出文档的完整性和质量
- **Per wave merge:** N/A（单 wave 阶段）
- **Phase gate:** 文档产出完整、结构符合 D-09/D-10 要求

### Wave 0 Gaps
- None — 本阶段无需测试基础设施

## Security Domain

本阶段为纯文档分析，不涉及代码修改、数据处理或外部服务交互。Security domain 不适用。

## Sources

### Primary (HIGH confidence)
- `docs/research/codepoint/2026-04-17-methodology.md` — 原作者完整方法论原文（2.1-2.8 全部章节），作为对照审查的标尺
- `docs/research/codepoint/2026-04-19-global-thinking.md` — 全局思维核心原则提炼
- `plugins/codepoint/skills/codepoint/SKILL.md` — V2 主技能定义
- `plugins/codepoint/skills/scan/SKILL.md` — Scan 阶段技能（审查对象）
- `plugins/codepoint/skills/plan/SKILL.md` — Plan 阶段技能（审查对象）
- `plugins/codepoint/skills/implement/SKILL.md` — Implement 阶段技能（审查对象）
- `plugins/codepoint/references/data-model.md` — 数据模型规格和密度校验定义
- `tests/e2e/codepoint-v2/go-calculator/.codepoints/index.json` — E2E 实际产出佐证
- `tests/e2e/codepoint-v2/gojs-calculator/.codepoints/index.json` — 跨语言 E2E 产出佐证
- `docs/superpowers/specs/2026-04-18-codepoint-v2-redesign.md` — V2 设计规格（历史参考）
- `.planning/phases/40-codepoint-design-review/40-CONTEXT.md` — Phase 40 用户决策
- `.planning/phases/40-codepoint-design-review/40-DISCUSSION-LOG.md` — Phase 40 讨论记录

### Secondary (MEDIUM confidence)
- N/A — 所有核心材料为项目本地文件，直接读取

### Tertiary (LOW confidence)
- N/A — 无需外部搜索

## Metadata

**Confidence breakdown:**
- Standard stack (参考材料): HIGH — 所有文件已在本地验证读取
- Architecture (审查框架): HIGH — 基于方法论原文和 CONTEXT.md 决策构建
- Pitfalls: HIGH — 来自方法论原文的直接引用和 CONTEXT.md 中的具体观点

**Research date:** 2026-04-19
**Valid until:** 不限期（方法论原文不变，技能设计在改进前不变）