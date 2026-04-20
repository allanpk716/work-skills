# Codepoint V2 设计反省与改进评估

> 审查日期：2026-04-19
> 审查范围：Codepoint V2 技能（scan/plan/implement 三阶段）
> 对照标尺：代码点方法论原作者 zhh-4096 核心原则
> 文档性质：独立设计反省文档，为后续版本改进提供设计输入

---

## 一、审查背景与方法

### 审查目的

对照原作者方法论的核心原则（全局思维、集合论、密度校验），逐条评估当前 Codepoint V2 技能在 scan/plan/implement 三阶段的设计实现，识别设计偏差与合理偏离，输出包含可执行改进建议的反省文档。

### 审查范围

- scan 阶段：`plugins/codepoint/skills/scan/SKILL.md` — 两阶段扫描流程
- plan 阶段：`plugins/codepoint/skills/plan/SKILL.md` — 新功能埋点规划
- implement 阶段：`plugins/codepoint/skills/implement/SKILL.md` — TDD 式探针插入与验证
- 主技能定义：`plugins/codepoint/skills/codepoint/SKILL.md` — 三层模型和关键原则
- 数据模型规格：`plugins/codepoint/references/data-model.md` — 密度校验标准

### 审查标尺

以方法论原文 `docs/research/codepoint/2026-04-17-methodology.md` 2.1-2.8 节为标尺，重点章节：

- **2.2 节**（谁来埋、怎么埋）— 全局思维、人手动埋设、AI 不可替代
- **2.3 节**（埋多少、密度如何控制）— 按项目类型差异化、堆栈交集校验
- **2.7 节**（代码点集合论）— 提示词+集合->LLM 筛选子集->解决问题

辅助参考：`docs/research/codepoint/2026-04-19-global-thinking.md` — 全局思维核心原则提炼。

### 审查方法

1. 逐条比对原作者方法论原则与当前设计实现
2. 区分"设计偏差"（应改进）和"合理偏离"（工具化/Skill 化的必然调整）
3. 引用 E2E 测试项目产出（index.json）作为实证佐证
4. 每条改进建议具体到 SKILL.md 的哪个步骤改成什么

---

## 二、原作者方法论核心原则摘要

以下原则提炼自 `2026-04-17-methodology.md` 和 `2026-04-19-global-thinking.md`，作为比对基准：

### 原则 1：埋点决策者原则（2.2 节）

> 埋代码点需要对系统的设计和实现都很了解的人去做，一定要有全局思维。对于一个大中型软件项目，代码点埋得好，实现 L4 就成功了一半。

核心要求：必须由深度理解系统的人手动埋设，AI 不能替代埋点决策。

### 原则 2：全局思维原则（2.2 节）

> 埋代码点需要对系统的设计和实现都很了解的人去做，一定要有全局思维。

核心要求：理解系统核心执行链路，从全局视角选择代码点位置，而不是逐个埋点或逐文件扫描。

### 原则 3：集合论原则（2.7 节）

> 所有的代码点也组成一个集合，只要找到一个代码点的子集就能解决各种问题。

核心要求：代码点不是孤立探针，而是组成覆盖系统的集合。运行时根据提示词筛选子集定位问题。

### 原则 4：密度校验原则（2.3 节）

> 如果两个代码点产生的堆栈交集很大，那就说明你埋的代码点太密了，一点交集都没有说明代码点埋得太少。

核心要求：通过堆栈交集分析验证密度，交集太大=太密，完全没交集=太少。

### 原则 5：按项目类型差异化原则（2.3 节）

> 像 tomcat 这种大中型开源项目，虽然有几十万行代码，但是它的代码逻辑很简单的，无非就是分启动阶段和运行阶段，运行阶段的代码链路分 servlet 和静态资源文件，只要在这两条链路上埋 20 几个代码点就够了。数据库就复杂一些，代码点估计得有 200+ 个。

核心要求：不同项目类型的代码点数量差异巨大（Tomcat ~20 vs 数据库 ~200+），密度标准应按项目类型调整。

### 原则 6：一次性埋设原则（2.2 节）

> 埋代码点需要对系统的设计和实现都很了解的人去做

结合 3.2 节流程图：

```
人工埋点（一次性）→ 运行时捕获（按需触发）→ AI 分析（自动化）
```

核心要求：代码点埋设是一次性的人工作业，不是迭代循环。

---

## 三、设计偏差清单

本章节列出 5 条设计偏差（CP-01 到 CP-05），每条偏差包含原作者原话引用、当前设计引用、偏差分析、E2E 实证、改进建议和具体改进步骤。

---

### 偏差 CP-01: scan Phase 2 逐文件追踪 vs 全局思维

**偏差 ID:** CP-01
**对应决策:** D-01, D-02

**原作者原话（2.2 节）：**
> 埋代码点需要对系统的设计和实现都很了解的人去做，一定要有全局思维。

**当前行为（scan/SKILL.md Phase 2 Steps 第 2 步）：**
> Trace execution paths — For each Flow in the selected Collection: Read the entry point handler/controller function, Trace function calls through service layer, repository layer, external calls, Identify module boundaries, state changes, concurrency points, error paths

**偏差分析：**

原作者强调"全局思维"——理解系统的核心执行链路，而不是逐个埋点。当前 scan Phase 2 的执行方式是"逐文件追踪"：从 entry point handler 开始，逐层追踪 service layer、repository layer、external calls。这本质上是传统的代码阅读思路：从入口函数开始，逐步展开每个调用目标，形成完整的文件级调用图。

这种方法虽然在单个 flow 内做到了路径追踪，但违反了全局思维的核心要求：

1. **粒度过细** — 逐函数追踪会产生大量中间节点信息，淹没了关键的模块边界和状态变更点
2. **视角局限** — 聚焦于单个 flow 的内部路径，而非从系统整体角度理解 flow 之间的共享逻辑和交叉点
3. **产出膨胀** — 产出的是完整的文件级调用图，而非原作者期望的"3-5 条核心链路"的精简描述

原作者的意图是：架构师应该先在脑中构建系统的运行时地图（全局理解），然后在关键位置放代码点。当前 Phase 2 的"追踪"试图让 AI 通过逐文件分析来替代人的全局理解过程，但从产出质量来看，这种方式更像是在做"详细的代码阅读笔记"而非"全局链路提炼"。

**E2E 实证：**

gojs-calculator 项目的 index.json 中 `scan_notes` 字段记录：

> "Scan performed by analyzing source code. The codepoint skill does not have a separate automated scan tool -- /codepoint:scan is a methodology for identifying codepoints by reading source files."

这段描述清楚表明：实际执行的是源代码文件分析（逐文件读取和分析），而非链路导向的全局扫描。同时，`cross_language_connections` 字段的存在说明 AI 确实有能力识别跨语言的完整链路（前端→API→后端），但这更多是因为测试项目规模小、结构清晰，而非 Phase 2 的逐文件追踪方法论的结果。

**改进建议：**

| 项目 | 内容 |
|------|------|
| 对应偏差 | CP-01 |
| 当前行为 | scan/SKILL.md Phase 2 Steps 第 2 步："For each Flow in the selected Collection: Read the entry point handler/controller function, Trace function calls through service layer, repository layer, external calls" |
| 建议变更 | Phase 2 从"逐文件追踪"改为"链路导向"，只追踪入口→出口的完整调用链，在调用链上标记 4 类关键位置，输出 3-5 条核心链路图 |
| 影响的文件 | `plugins/codepoint/skills/scan/SKILL.md` Phase 2 Steps 第 2-4 步 |
| 预估工作量 | M |

**具体改进步骤：**

1. scan Phase 2 从"逐文件追踪"改为"链路导向"（per D-02）：不再逐层展开每个调用目标，而是追踪入口→出口的完整调用链
2. 只追踪入口到出口的完整调用链（如 HTTP handler -> service -> repo -> DB），不深入每个中间函数的内部逻辑
3. 在调用链上只标记 4 类关键位置：模块边界（跨层调用）、状态变更点（数据写入/状态机转换）、并发点（锁/goroutine/async）、错误路径（catch/error handler）
4. 不分析中间函数的内部逻辑——从"Read the entry point handler/controller function, Trace function calls through service layer, repository layer"改为"Identify the entry→exit path, mark 4 key location types along the path"
5. 输出为 3-5 条核心链路图（而非完整的文件级报告），每条链路是一行简洁的入口→边界→出口描述

**预期效果：**

scan Phase 2 的产出从"详细的文件级调用图"精简为"3-5 条核心执行链路图"，回归全局思维。AI 产出更聚焦于系统关键路径，减少噪音信息，用户更容易理解和审核。

---

### 偏差 CP-02: Plan 阶段"新功能规划"定位 vs 集合构建

**偏差 ID:** CP-02
**对应决策:** D-04

**原作者原话（2.7 节）：**
> 所有的代码点也组成一个集合，只要找到一个代码点的子集就能解决各种问题。

**当前行为（plan/SKILL.md Overview 和 description）：**
> "Plan code points for a new feature being developed. Analyzes the feature's spec or design document to determine optimal probe locations, maps them to business flows, and generates a code point plan."

**偏差分析：**

原作者的集合论视角是：代码点组成一个覆盖系统全局的集合，运行时根据提示词从这个集合中筛选子集来定位和解决问题。代码点的构建过程应基于对系统全局执行链路的理解，而非针对某个特定新功能。

当前 plan 阶段的定位是"为新功能规划探针"——分析新功能的 spec/设计文档，确定探针位置。这存在两个偏差：

1. **定位偏差** — 面向"新功能"而非面向"系统全局"。原作者的集合论要求代码点集合覆盖系统的所有关键路径，而不是只为新功能添加探针。plan 阶段应该做的是"基于 scan 的全局理解，构建/补充代码点集合"，而非"分析新功能 spec 规划探针"
2. **输入偏差** — 以 feature spec 为输入，而非以全局理解为输入。当前流程是"读 spec -> 识别 flows -> 确定探针位置"，但应该是"基于 scan 产出的全局链路图 -> 识别链路上缺失的代码点 -> 补充到集合中"

**E2E 实证：**

go-calculator 的 index.json 展示了 3 条 flows 共享 4 个核心 codepoints（cp-calc-parse/validate/compute/format），这正是集合论在实际项目中的体现——代码点不是为某个特定 flow 服务，而是作为共享资源覆盖多条执行路径。

当前 plan 阶段以"新功能"为出发点的设计，无法产出这种跨 flow 共享的代码点布局。gojs-calculator 的 `shared_codepoints_summary` 进一步证实：共享函数 `calculator.Evaluate()` 中的 4 个共享代码点被所有 3 条业务链路复用。这种布局只有从全局视角才能设计出来。

**改进建议：**

| 项目 | 内容 |
|------|------|
| 对应偏差 | CP-02 |
| 当前行为 | plan/SKILL.md description："Plan code points for a new feature being developed"，以 feature spec 为输入规划探针位置 |
| 建议变更 | Plan 阶段重新定位为"集合构建"——基于 scan 的全局链路理解，构建/补充代码点集合，确保覆盖系统的所有关键执行路径 |
| 影响的文件 | `plugins/codepoint/skills/plan/SKILL.md` Overview、Step 1-3 |
| 预估工作量 | M |

**具体改进步骤：**

1. Plan 阶段重新定位为"集合构建"而非"新功能埋点规划"——将 description 从"Plan code points for a new feature being developed"改为"Build and maintain the code point collection based on global system understanding"
2. 基于 scan 的全局理解（Phase 1 的模块概览 + Phase 2 的核心链路图），识别 3-5 条核心执行链路
3. 确定集合中每个代码点的位置和类型——在核心链路上的关键位置（模块边界、状态变更、并发、错误）放置代码点
4. 确保代码点集合覆盖系统的所有关键执行路径——检查是否存在未被任何代码点覆盖的重要链路
5. Plan 的产出不是"探针方案"而是"代码点集合定义"——输出的是集合的结构描述（哪些 flows、哪些 points、如何共享），而非具体的探针插入方案

**预期效果：**

Plan 阶段从"面向单个功能的探针规划"转向"面向系统全局的集合构建"，与原作者集合论对齐。产出的是覆盖系统全局的代码点集合定义，而不是某个特定功能的探针方案。

---

### 偏差 CP-03: Implement 阶段 TDD 循环 vs 一次性埋设

**偏差 ID:** CP-03
**对应决策:** D-05

**原作者原话（2.2 节及 3.2 节流程图）：**

2.2 节：
> 埋代码点需要对系统的设计和实现都很了解的人去做

3.2 节流程图明确标注三个阶段：
```
人工埋点（一次性）→ 运行时捕获（按需触发）→ AI 分析（自动化）
```

**当前行为（implement/SKILL.md Overview）：**
> "TDD-style three-phase loop: Red -> Green -> Verify"，包含 Phase 1 Red（确认方案）、Phase 2 Green（生成+插入探针）、Phase 3 Verify（自动生成测试用例、运行验证、生成验证报告）

**偏差分析：**

原作者的方法论中，代码点埋设是"一次性"的人工作业——架构师基于全局理解，在关键位置放好代码点，完成即结束。后续的工作是运行时按需触发（bool 开关）和 AI 分析堆栈。

当前 implement 阶段引入了 TDD 式三步循环（Red/Green/Verify），这是典型的软件工程最佳实践，但对于代码点埋设场景属于过度工程化：

1. **Red 阶段**（确认方案）—— 合理，确认埋点位置是必要的
2. **Green 阶段**（生成+插入探针）—— 合理，这是核心的埋设操作
3. **Verify 阶段**（自动生成测试用例、运行、分析输出、生成报告）—— 过度。原作者的方法论中没有"验证代码点"的步骤——代码点是运行时基础设施，通过实际使用来验证有效性，而不是通过专门的测试用例

Verify 阶段要求生成三类测试（正常流程、边界条件、失效模式），每种都包含详细的执行步骤和输出分析。这相当于为基础设施（代码点）构建了一套完整的测试体系，而原作者的预期是代码点本身是低频、动态触发的探针，不需要专门的测试验证。

**E2E 实证：**

go-calculator 的 index.json 中 12 个 codepoints 分布在 3 条 flows 中，结构清晰简洁。这个项目的探针是通过 `/codepoint-implement` 的 Green 阶段插入的，但 Verify 阶段产出的验证报告（`.codepoints/verification/` 下的文件）在实际 E2E 测试中主要用于确认探针能触发和输出格式正确，而非 Verify 阶段定义的复杂测试矩阵。

gojs-calculator 的 18 个 codepoints 跨两种语言（Go+TypeScript），项目验证了探针能正常触发、跨语言链路可追踪。这证明了一次性埋设+轻量验收即可满足需求，不需要 TDD 三步循环。

**改进建议：**

| 项目 | 内容 |
|------|------|
| 对应偏差 | CP-03 |
| 当前行为 | implement/SKILL.md 三阶段 TDD 循环："Phase 1 Red（确认方案）→ Phase 2 Green（生成+插入探针）→ Phase 3 Verify（自动生成测试用例：Normal Flow Test、Boundary Condition Tests、Failure Mode Tests，运行测试，分析输出，生成验证报告）" |
| 建议变更 | 简化为"一次性埋设"两步流程：确认方案 + 插入探针，保留轻量验收环节（确认探针能触发、输出格式正确），去掉复杂的测试用例生成和 Verify 阶段 |
| 影响的文件 | `plugins/codepoint/skills/implement/SKILL.md` Phase 3 Verify 整个章节、Phase 2 Green 中的测试相关部分 |
| 预估工作量 | M |

**具体改进步骤：**

1. Implement 阶段从 TDD 三步循环（Red/Green/Verify）改为"一次性埋设"两步流程：将 Overview 从"TDD-style three-phase loop"改为"Two-phase probe insertion with lightweight acceptance"
2. 保留 Phase 1（确认方案）和 Phase 2（插入探针），合并为"确认 + 埋设"
3. Phase 3 Verify 简化为轻量验收——仅确认探针能触发（enabled=true 后能产出 JSON）和输出格式正确（point_id/flow_id/timestamp/stack 字段完整），去掉 Boundary Condition Tests 和 Failure Mode Tests 的自动生成
4. 去掉 Verification Failure Handling 章节中的复杂测试矩阵——保留基本的"探针未触发排查"指引即可
5. 验收报告从完整的 PASS/FAIL 矩阵简化为简单的"已埋设 N 个探针，M 个触发确认"清单

**预期效果：**

Implement 阶段从复杂的 TDD 三步循环简化为一次性埋设+轻量验收，减少过度工程化，回归原作者"一次性手动埋设"的简洁流程。用户使用 `/codepoint-implement` 的操作成本显著降低。

---

### 偏差 CP-04: 统一密度阈值 vs 按项目类型差异化

**偏差 ID:** CP-04
**对应决策:** D-07

**原作者原话（2.3 节）：**
> 像 tomcat 这种大中型开源项目，虽然有几十万行代码，但是它的代码逻辑很简单的，无非就是分启动阶段和运行阶段，运行阶段的代码链路分 servlet 和静态资源文件，只要在这两条链路上埋 20 几个代码点就够了。数据库就复杂一些，代码点估计得有 200+ 个。

**当前行为（data-model.md Density Validation 章节）：**
> "Too dense (overlap > 80%): Remove points. Too sparse (overlap = 0%): Add intermediate points. Target range: 20%-60% overlap between adjacent points."

**偏差分析：**

原作者明确给出了按项目类型差异化的密度参考：Tomcat 几十万行代码只需 ~20 个代码点，数据库需要 ~200+ 个。这说明代码点密度与项目的"逻辑复杂度"（而非代码行数）直接相关。

当前 data-model.md 中的密度校验标准是统一的：所有项目一律使用 20%-60% overlap 作为目标范围，>80% 太密，0% 太少。这个统一标准没有考虑项目类型的差异：

1. **简单应用**（如计算器、CRUD 服务）— 3-5 条链路，10-30 个代码点。统一 20%-60% 的标准对这类项目可能偏高（代码点数量少，相邻点之间的代码路径短，overlap 自然偏高）
2. **中型系统**（如业务系统）— 10-20 条链路，50-100 个代码点。统一标准适用
3. **复杂系统**（如数据库、分布式系统）— 50+ 条链路，100-200+ 个代码点。统一标准可能偏松（复杂系统中需要更细粒度的覆盖）

**E2E 实证：**

go-calculator（单语言项目）：12 个 codepoints，3 条 flows。相邻代码点之间的 overlap 在这个小项目中会自然偏高（如 cp-calc-parse 和 cp-calc-validate 都在同一个 `calculator.go` 文件中，行号相近），按统一标准可能被标记为"太密"。但实际上 12 个代码点对于这个项目的规模是合理的。

gojs-calculator（跨语言项目）：18 个 codepoints，3 条 flows，跨 Go 和 TypeScript 两种语言。同样，由于项目规模小，统一 20%-60% 的 overlap 目标不完全适用。

两个 E2E 项目都是小型项目（10-20 个代码点），如果机械应用 20%-60% 的统一标准，可能导致不合理的密度评估结果。

**改进建议：**

| 项目 | 内容 |
|------|------|
| 对应偏差 | CP-04 |
| 当前行为 | data-model.md Density Validation 章节："Target range: 20%-60% overlap between adjacent points"，统一的 overlap 目标 |
| 建议变更 | 密度目标从统一 20%-60% overlap 改为按项目类型分级：简单应用 30-60%、中型系统 20-50%、复杂系统 15-40%，同时给出代码点数量参考 |
| 影响的文件 | `plugins/codepoint/references/data-model.md` Density Validation 章节、`plugins/codepoint/skills/scan/SKILL.md` Density Validation 章节 |
| 预估工作量 | S |

**具体改进步骤：**

1. 密度目标从统一 20%-60% overlap 改为按项目类型分级：
   - **简单应用**（CRUD/Web 服务、<10 个入口）：~10-30 个代码点，overlap 目标 30-60%（路径短、相邻点自然重叠高）
   - **中型系统**（业务逻辑复杂、10-30 个入口）：~50-100 个代码点，overlap 目标 20-50%
   - **复杂系统**（数据库/分布式、30+ 个入口）：~100-200+ 个代码点，overlap 目标 15-40%（需要更细粒度覆盖）
2. 在 scan 阶段 Phase 1 完成后，根据识别到的入口数量和模块复杂度自动推荐密度等级——将项目分类到上述三个等级之一
3. 将分级标准写入 data-model.md 的 Density Validation 章节，替换当前的统一标准
4. scan/SKILL.md 的 Density Validation 章节同步更新，引用新的分级标准

**预期效果：**

密度校验标准更加灵活和合理，与原作者"Tomcat ~20、数据库 ~200+"的差异化理念对齐。小型项目不会被统一标准误判为"太密"，大型项目也不会被统一标准放行"太稀"的布局。

---

### 偏差 CP-05: 密度校验仅概念描述 vs 需自动化执行

**偏差 ID:** CP-05
**对应决策:** D-08

**原作者原话（2.3 节）：**
> 如果两个代码点产生的堆栈交集很大，那就说明你埋的代码点太密了，一点交集都没有说明代码点埋得太少。

**当前行为（scan/SKILL.md Density Validation 章节）：**
> "After placing code points, validate density: Run overlap analysis on adjacent points in each flow. Too dense (>80% overlap): flag for removal. Too sparse (0% overlap): flag for intermediate points. Good range: 20-60% overlap."

**偏差分析：**

原作者在方法论中明确要求密度校验——通过分析代码点的堆栈交集来验证埋点质量。方法论文档（4.1 节）甚至提供了具体的 `AnalyzeOverlap` 算法实现。

当前 scan/SKILL.md 中虽然有 Density Validation 章节描述了校验概念（>80% 太密、0% 太少、20-60% 合适），但：

1. **没有执行步骤** — Density Validation 章节只是描述了"应该做什么"，没有定义"怎么做"的具体步骤（何时触发、如何计算、输出到哪里）
2. **没有触发时机** — 没有明确在 scan 流程的哪个步骤执行密度校验（Phase 1 后？Phase 2 后？）
3. **没有输出格式** — 校验结果应该输出到哪里、格式是什么、如何标记问题点

data-model.md 中同样只有概念描述，没有执行步骤。这意味着密度校验在实际使用中完全依赖人工判断，失去了原作者设定的质量保障作用。

**E2E 实证：**

go-calculator 的 index.json 中没有 `verification/density-report.md` 文件，说明实际 E2E 流程中并未执行密度校验。gojs-calculator 同样没有密度校验产出。

两个项目的代码点布局（12 个和 18 个）都是合理的，但这更多是因为测试项目规模小、结构简单，而非密度校验的结果。对于更大规模的项目，缺乏自动密度校验可能导致代码点布局质量无法保障。

**改进建议：**

| 项目 | 内容 |
|------|------|
| 对应偏差 | CP-05 |
| 当前行为 | scan/SKILL.md Density Validation 章节："After placing code points, validate density: Run overlap analysis on adjacent points in each flow"，仅为概念描述，无执行步骤 |
| 建议变更 | 增加自动密度校验执行步骤——定义计算方法（AnalyzeOverlap 算法）、触发时机（scan Phase 2 完成后立即执行）、输出格式（density-report.md） |
| 影响的文件 | `plugins/codepoint/skills/scan/SKILL.md` Density Validation 章节、`plugins/codepoint/references/data-model.md` Density Validation 章节 |
| 预估工作量 | L |

**具体改进步骤：**

1. 在 scan 阶段 Phase 2 完成代码点放置后，自动执行密度校验（不需要等到 implement 阶段）——在 scan/SKILL.md Phase 2 Steps 之后添加 Step 6："Run density validation"
2. 计算方法：使用 methodology.md 4.1 节的 AnalyzeOverlap 算法——提取堆栈帧集合，计算两个相邻代码点的帧集合交集 / 帧总数，得到 0~1 的 overlap 值
3. 触发时机：scan Phase 2 完成代码点定义后、写入 `.codepoints/` 目录前，立即运行校验
4. 输出校验报告到 `.codepoints/verification/density-report.md`，包含：每个 flow 中相邻代码点的 overlap 值、超出范围的标记、调整建议（精简或补充）
5. 对每个 flow 中相邻代码点计算 overlap 值，按分级标准标记：超过目标上限（太密）、低于目标下限（太稀）、在范围内（合格）

**预期效果：**

密度校验从"写在文档里的概念"变为"自动执行的质量保障步骤"。scan 阶段产出的代码点布局在交付给用户审核时已经过密度校验，用户能直接看到哪些位置可能需要调整，形成质量保障闭环。

---

## 四、合理偏离说明

本章节列出 3 条合理偏离（RD-01 到 RD-03），说明为何这些与原作者方法论的差异是工具化/Skill 化的必然调整。

---

### 合理偏离 RD-01: AI 辅助 scan vs 人手动埋点

**原作者原话（2.2 节）：**
> ai 都知道去哪里埋代码点了那还需要代码点干嘛！就好比你手上有一个内部大中型软件项目，招了一个新人进来，你想让他快速学会代码实现，你居然让他告诉你实现某个功能的核心代码点在哪里，他会骂你神经病。

**当前设计：**

`/codepoint-scan` 由 AI 执行代码扫描，分析源代码结构并建议埋点位置。

**为何是合理偏离：**

原作者批评的是"AI 自己就知道埋点位置"的场景——如果 AI 已经完全理解系统，那代码点就失去了存在的意义。但我们的技能定位不是"AI 替代人的埋点决策"，而是"AI 辅助人更快完成全局理解"：

1. **scan Phase 1 有 User Confirmation 环节** — AI 提出候选模块和 flow，用户审核确认。最终决策权在用户手中
2. **AI 的角色是"快速梳理"** — AI 帮助快速梳理代码结构（目录、入口、路由），人可能需要数小时的工作，AI 可以在秒级完成。但梳理结构不等于理解系统——理解系统的全局链路仍然需要人的判断
3. **跨语言链路识别** — gojs-calculator 的 `cross_language_connections` 字段展示了 AI 辅助跨语言链路识别的价值（前端→API→后端的完整链路），这种跨语言分析对人类来说也很有挑战性

工具化必然需要 AI 参与，关键是保留人的审核和决策权。当前 scan Phase 1 的 User Confirmation 步骤已经满足了这个要求。

**E2E 实证：**

gojs-calculator 的 index.json 中 `cross_language_connections` 展示了 3 条跨语言链路（frontend handleSubmit → fetch POST → Go HandleCalculate → calculator.Evaluate），这恰好是 AI 辅助 scan 的真正价值所在——快速识别跨语言、跨模块的执行链路，帮助人更快建立全局理解。

**判定：无需变更 — 这是工具化/Skill 化的合理适应性调整，不需要改进。** AI 辅助 scan 不违背原作者的"人做决策"原则，因为最终埋点位置仍需用户确认。scan 的定位是"辅助工具"而非"替代决策"。

---

### 合理偏离 RD-02: 三步流程（scan/plan/implement）vs 原作者两步（人埋设+AI 筛选）

**原作者原话（3.2 节流程图）：**
```
人工埋点（一次性）→ 运行时捕获（按需触发）→ AI 分析（自动化）
```

**当前设计：**

三步流程：`/codepoint-scan` → `/codepoint-plan` → `/codepoint-implement`，各自有独立 SKILL.md。

**为何是合理偏离：**

原作者描述的是理想流程——架构师已经深度理解系统，直接选点埋设。但在工具化/Skill 化场景下，"人的理解"需要拆解为可执行的步骤：

1. **scan 对应"理解系统"** — AI 辅助梳理代码结构，帮助人快速建立全局理解
2. **plan 对应"构建集合"** — 基于全局理解确定代码点集合的布局
3. **implement 对应"埋设探针"** — 将代码点集合中的定义转化为实际的探针代码

这三个步骤对应三个明确的工具化操作，每个步骤都有独立的触发条件和用户审核环节。per D-03 保留三步结构不做删除。

原作者的"两步"（人埋设+AI 筛选）是方法论层面的抽象，我们的"三步"是工具化层面的具体实现。两者不是矛盾关系，而是不同粒度的描述——原作者说的是"做什么"，我们拆解为"怎么做"。

**判定：无需变更 — 三步流程是工具化拆解，对应原作者方法论中不同阶段的工具化映射，属于合理的工程化适应。** 虽然 plan 和 implement 阶段的内部设计需要调整（见 CP-02、CP-03），但三步结构本身是合理的。

---

### 合理偏离 RD-03: 三层模型（Collection/Flow/Point）的 Flow 有序性 vs 集合论的无序性

**原作者原话（2.7 节）：**
> 所有的代码点也组成一个集合，只要找到一个代码点的子集就能解决各种问题。

**当前设计：**

data-model.md 定义 Flow 为"ordered combination of code points"，Flow 中的 sequence 字段定义了代码点的执行顺序。

**为何是合理偏离：**

原作者的集合论视角是数学层面的——代码点组成集合，运行时筛选子集。集合论中的"集合"是无序的，但 Flow 的 sequence 字段定义了执行顺序。这看似矛盾，实际上是实用性需要与理论一致性的兼容：

1. **Flow 既是子集又有执行顺序** — Flow 从代码点集合中选取一个子集（符合集合论），同时记录这个子集在运行时的执行顺序（符合实用性需要）。执行顺序是子集的额外属性，不违背子集的定义
2. **执行顺序有助于问题定位** — 当 AI 分析代码点输出时，知道执行顺序能更准确地定位问题（如"代码点 A 触发了但 B 没触发"比"A 和 B 都在集合中但只有 A 触发"信息更丰富）
3. **E2E 验证需要顺序** — go-calculator 的 3 条 flows 都有明确的 sequence 定义，E2E 测试验证了代码点按预期顺序触发。如果没有顺序信息，验收环节无法判断执行是否正确

从实用性角度，Flow 的有序性不仅不违背集合论，反而丰富了子集的信息量——每个 Flow 仍然是从代码点集合中选取的子集，只是附加了执行路径的语义。

**E2E 实证：**

go-calculator 的 index.json 中，3 条 flows 都有 shared_points（cp-calc-parse/validate/compute/format 被所有 flow 共享），这正是"子集"概念的体现——不同问题对应不同的子集，但共享的代码点是集合中的公共元素。同时，每条 flow 的 sequence 字段定义了执行顺序，在 E2E 测试中验证了代码点按序触发。

**判定：无需变更 — Flow 的有序性是实用性需要，与集合论子集概念兼容。** Flow 既是从代码点集合中选取的子集（符合集合论），又附加了执行顺序信息（符合调试需要）。三层模型（Collection/Flow/Point）与原作者集合论视角的契合度高（验证 D-06）。

---

## 五、改进建议总表

按优先级排列所有改进建议：

| 编号 | 偏差/偏离 | 改进项 | 影响的 SKILL.md | 优先级 | 预估工作量 | 预期效果 |
|------|-----------|--------|-----------------|--------|------------|----------|
| CP-01 | scan Phase 2 逐文件追踪 | 改为链路导向 | scan/SKILL.md Phase 2 | P0 | M | 从局部扫描回归全局思维，产出精简的核心链路图 |
| CP-05 | 密度校验未执行 | 增加自动校验步骤 | scan/SKILL.md + data-model.md | P0 | L | 质量保障闭环，scan 产出自带密度验证报告 |
| CP-02 | Plan 定位为新功能规划 | 改为集合构建 | plan/SKILL.md | P1 | M | 对齐集合论核心，产出全局集合定义 |
| CP-04 | 统一密度阈值 | 按项目类型分级 | data-model.md + scan/SKILL.md | P1 | S | 更合理的密度标准，匹配原作者差异化理念 |
| CP-03 | TDD 三步循环 | 简化为一次性埋设 | implement/SKILL.md | P2 | M | 减少过度工程化，降低用户操作成本 |

**优先级说明：**

- **P0**：影响全局思维核心原则或质量保障闭环，应优先实施
- **P1**：对齐集合论核心或提升密度标准合理性，可在 V2.1 同步进行
- **P2**：减少过度工程化，可在 V2.2 实施

---

## 六、与 E2E 测试结果的交叉验证（概念性验证）

**本章节是概念性验证，不是自动化测试。** 验证方式：逐条将文档中的偏差主张与已知的 E2E 测试项目特征（index.json 中的实际数据）进行人工比照，确认主张有实证支撑。不涉及运行任何代码或测试命令。

### 验证项目 1：go-calculator（单语言项目）

**项目特征：**
- 12 个 codepoints，3 条 flows（flow-api-calculate、flow-batch-process、flow-history-query），1 个 collection（col-calculator）
- 4 个共享 codepoints：cp-calc-parse、cp-calc-validate、cp-calc-compute、cp-calc-format，在所有 3 条链路中被复用
- 单语言（Go），结构清晰的计算器项目

**主张验证：**

| 文档主张 | 实证数据 | 验证结果 |
|---------|---------|---------|
| 共享 codepoints 符合集合论原则 | `shared_points: ["cp-calc-parse", "cp-calc-validate", "cp-calc-compute", "cp-calc-format"]` 出现在所有 3 条 flows 的 sequence 中 | 一致 — 代码点作为集合中的共享元素被不同子集（flow）复用，符合"找一个代码点的子集就能解决各种问题" |
| 三层模型运作良好 | index.json 包含 collections/flows/points 三层数据，结构完整 | 一致 — Collection/Flow/Point 三层模型在实际项目中结构清晰，层次分明 |
| 12 个 codepoints 对小型项目合理 | 12 个 points，3 条 flows，4 个共享，布局紧凑 | 一致 — 支持 CP-04 的主张：统一 20%-60% 的 overlap 标准对小型项目可能偏高 |

### 验证项目 2：gojs-calculator（跨语言项目）

**项目特征：**
- 18 个 codepoints，3 条 flows，跨 Go 和 TypeScript 两种语言
- `scan_mode: "manual-fallback"`，`scan_notes: "Scan performed by analyzing source code"`
- `cross_language_connections`：3 条跨语言链路（前端→API→后端）
- `shared_codepoints_summary`：4 个共享 codepoints 在 `calculator.Evaluate()` 函数中

**主张验证：**

| 文档主张 | 实证数据 | 验证结果 |
|---------|---------|---------|
| scan Phase 2 实际执行的是文件级分析（CP-01） | `scan_notes: "Scan performed by analyzing source code"` | 一致 — scan_notes 明确记录"analyzing source code"，佐证逐文件分析的实际行为 |
| 跨语言链路识别是 scan 的价值所在 | `cross_language_connections` 包含 3 条完整的 frontend→API→backend 链路描述 | 一致 — 这恰好是"链路导向"应该产出的结果，佐证 CP-01 改进方向的合理性 |
| 当前逐文件追踪方式产出质量好但效率可优化 | 18 个 codepoints 布局合理，但产出方式是逐文件分析 | 一致 — 产出（index.json）质量好，但 scan_mode 为"manual-fallback"说明自动化程度有限 |
| Flow 的有序性在跨语言场景中有价值 | 每条 flow 的 sequence 包含前端→后端的完整有序路径 | 一致 — 跨语言场景中执行顺序信息对问题定位尤为重要 |

### 交叉验证结论

1. **三层模型在 E2E 测试中运作良好（验证 D-06）** — 两个项目的 Collection/Flow/Point 结构都清晰完整，主张与实证一致
2. **共享 codepoints 的复用模式符合集合论原则** — 两个项目都有 4 个共享 codepoints 被多条 flows 复用，符合"子集筛选"理念
3. **scan 的实际产出质量好，但产出方式可优化** — index.json 中的代码点布局合理，但 scan_notes 佐证了 CP-01 的主张：实际执行的是文件级分析而非链路导向，改进方向合理
4. **跨语言链路识别是 scan 的真正价值** — gojs-calculator 的 cross_language_connections 证明了 AI 辅助 scan 的价值，也佐证了 RD-01 的判定

---

## 七、对后续版本的设计建议

### V2.1 优先改进

1. **CP-01：scan 链路导向改造**（P0, M）— Phase 2 从逐文件追踪改为链路导向，产出精简的核心链路图。这是回归全局思维的关键改动
2. **CP-05：自动密度校验**（P0, L）— 在 scan Phase 2 后自动执行密度校验，输出 density-report.md。这是质量保障闭环的必要环节
3. **CP-02：Plan 集合构建定位**（P1, M）— Plan 阶段重新定位为"集合构建"，产出全局集合定义而非单个功能的探针方案。可在 V2.1 中同步进行

### V2.2 后续改进

4. **CP-04：密度按项目类型分级**（P1, S）— 将统一 20%-60% 的 overlap 标准改为按项目类型分级（简单 30-60%、中型 20-50%、复杂 15-40%）
5. **CP-03：Implement 简化为一次性埋设**（P2, M）— 去掉 TDD 三步循环中的 Verify 阶段复杂测试，简化为两步流程+轻量验收

### 改进后验证

6. 改进完成后应重新运行 E2E 测试项目（go-calculator 和 gojs-calculator）验证改进效果
7. 建议在改进后的 scan 中增加"核心链路图"输出格式——入口→边界的可视化链路图，便于用户直观审核

---

## 附录：决策覆盖矩阵

| 决策 ID | 内容摘要 | 文档对应位置 | 状态 |
|---------|---------|-------------|------|
| D-01 | scan Phase 2 过度细化，偏离全局思维 | CP-01 偏差分析 | 已覆盖 |
| D-02 | 链路导向替代文件导向 | CP-01 具体改进步骤 | 已覆盖 |
| D-03 | 保留三步结构不做删除 | RD-02 合理偏离说明 | 已覆盖 |
| D-04 | Plan 阶段重新定位为集合构建 | CP-02 偏差分析及改进步骤 | 已覆盖 |
| D-05 | Implement 改为一次性埋设 | CP-03 偏差分析及改进步骤 | 已覆盖 |
| D-06 | 三层模型合理，不需简化 | RD-03 合理偏离说明 + 交叉验证结论 | 已覆盖 |
| D-07 | 密度目标值按项目类型调整 | CP-04 偏差分析及改进步骤 | 已覆盖 |
| D-08 | 增加自动密度校验环节 | CP-05 偏差分析及改进步骤 | 已覆盖 |
| D-09 | 输出独立文档不修改现有技能文件 | 整个文档（路径：docs/research/codepoint/2026-04-19-design-review.md） | 已满足 |
| D-10 | 改进建议具体可执行 | 每条 CP 偏差的改进建议表 + 具体改进步骤 | 已满足 |
