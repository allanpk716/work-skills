# Phase 40: Codepoint 设计反省与改进评估 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 40-codepoint-design-review
**Areas discussed:** scan 设计, plan/implement 流程, 探针密度与数据模型, 改进建议粒度与输出

---

## Scan 阶段设计

| Option | Description | Selected |
|--------|-------------|----------|
| Deep dive 过度细化 | Phase 1 (overview) 已体现全局思维，Phase 2 退化为逐文件追踪，偏离原作者原则 | ✓ |
| AI vs 人类埋点 | AI 驱动的 scan 是否能真正理解系统全局？ | |
| scan 设计没问题 | 真正的问题在 plan/implement 流程 | |

**User's choice:** Deep dive 过度细化
**Notes:** 用户认为 Phase 1 overview 合理，但 Phase 2 deep dive 从全局退化为逐文件追踪，变成原作者反对的"传统思路"

### 改进方向选择

| Option | Description | Selected |
|--------|-------------|----------|
| 链路导向替代文件导向 | 只追踪入口→出口的完整调用链，识别模块边界和状态变更点 | ✓ |
| 简化为纯 overview | 去掉 deep dive，scan 只做 overview 级别 | |
| 增加密度校验 | 保留两阶段但增加自动密度校验环节 | |

**User's choice:** 链路导向替代文件导向
**Notes:** 改进方向明确——链路导向，不逐文件追踪

---

## Plan/Implement 流程

| Option | Description | Selected |
|--------|-------------|----------|
| 集合构建 vs 回应问题 | plan 应是"集合构建"而非回应具体问题 | |
| plan 本身没问题 | plan 在"新功能"场景下合理 | |
| 过度工程化 | 整个三步流程过度工程化，原作者没有"规划"步骤 | ✓ |

**User's choice:** 过度工程化
**Notes:** 用户认为当前三步流程过度工程化，原作者的流程更简单（全局理解→埋点→筛选）

### 简化方向

| Option | Description | Selected |
|--------|-------------|----------|
| 简化为全局→埋点→筛选 | 回归原作者的简单流程 | |
| 保留三步但调整定位 | plan 改为"集合构建"，implement 改为"一次性埋设" | ✓ |

**User's choice:** 保留三步但调整定位
**Notes:** 保留三步结构（工具层面有合理性），但调整 plan 为"集合构建"定位

---

## 探针密度与数据模型

### 数据模型评估

| Option | Description | Selected |
|--------|-------------|----------|
| 三层模型合理 | 符合原作者集合论——Collection=集合，Flow=子集关系 | ✓ |
| 简化为两层 | Flow 中间层增加不必要复杂度 | |
| 调整 Flow 定位 | Flow 应是"同一场景下的代码点子集"而非"有序组合" | |

**User's choice:** 三层模型合理
**Notes:** 三层模型与原作者集合论一致，不需简化

### 密度校验

| Option | Description | Selected |
|--------|-------------|----------|
| 目标值合理但未实施 | 20%-60% 目标值合理，但 scan 中没有自动执行密度校验 | |
| 目标值需分项目类型 | 不同项目类型应有不同密度基准（Tomcat~20, 数据库~200+） | ✓ |

**User's choice:** 目标值需分项目类型
**Notes:** 统一 20%-60% 不够灵活，需要根据项目复杂度调整

---

## 改进建议粒度与输出

### 输出形式

| Option | Description | Selected |
|--------|-------------|----------|
| 独立反省文档 | 输出为 `docs/research/codepoint/` 下的独立文档，不修改技能文件 | ✓ |
| 文档 + 直接修改技能 | 同时产出文档和修改技能文件 | |
| 正式设计规格 | 输出为 specs/ 下的正式设计规格 | |

**User's choice:** 独立反省文档
**Notes:** 只输出文档，不修改现有技能文件

### 建议粒度

| Option | Description | Selected |
|--------|-------------|----------|
| 可执行的具体建议 | 每个偏差点对应具体改进步骤 | ✓ |
| 原则性方向建议 | 更高层次的方向，具体实施留给后续 | |

**User's choice:** 可执行的具体建议
**Notes:** 改进建议要具体到可执行，不是原则性方向

---

## Claude's Discretion

- 文档结构和章节组织
- 审查措辞和表达
- 是否引用 E2E 测试项目作为对照案例

## Deferred Ideas

None — discussion stayed within phase scope
