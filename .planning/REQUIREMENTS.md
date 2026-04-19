# REQUIREMENTS: v1.9.2 — Codepoint 测试归档与调研文档整理

**Milestone:** v1.9.2
**Created:** 2026-04-19
**Status:** Active

## Goal

将 v1.9.1 里程碑中的 E2E 测试项目从临时目录迁移到正式的测试验证目录，归档代码点方法论原作者的调研文档和后续分享内容，并根据作者最新经验分享反省当前 Codepoint 技能的设计是否有偏离方法论核心原则的问题。

## Requirements

### R1: E2E 测试项目迁移

**Priority:** P0
**Rationale:** tmp/ 目录是临时性质，不应保留持久性测试资产。测试项目需要长期存档用于回归验证和后续改进。

- [x] 将 `tmp/` 下 5 个测试项目迁移到 `tests/e2e/codepoint-v2/`:
  - `go-calculator` — Go 单语言计算器
  - `python-calculator` — Python 单语言计算器
  - `gojs-calculator` — Go+JS 全栈跨语言
  - `pyts-calculator` — Python+TS 全栈跨语言
  - `template-test` — 探针模板测试
- [x] 清理 tmp/ 目录（确认迁移完成后清空）
- [x] 更新项目中任何引用 tmp/ 路径的文档或配置

### R2: 调研文档归档

**Priority:** P0
**Rationale:** 代码点方法论原作者的分享是技能设计的核心参考，需要持久化归档以便未来查阅和讨论。

- [ ] 创建 `docs/research/codepoint/` 目录
- [ ] 归档原始调研文档（来自 `C:\WorkSpace\agent\researche\代码点调研.md`）
- [ ] 追加作者后续分享内容（2026-04-19 关于全局思维埋点的补充）
- [ ] 建立文档结构便于后续追加作者的新分享

### R3: 目录结构标准化

**Priority:** P1
**Rationale:** 为未来的 E2E 测试项目建立一致的目录组织模式。

- [x] `tests/e2e/codepoint-v2/` 目录命名与版本对应
- [x] 每个测试项目保持独立完整性（可独立运行）
- [ ] `docs/research/codepoint/` 目录以日期命名追加文档

### R4: Codepoint 设计反省与改进评估

**Priority:** P0
**Rationale:** 原作者强调"不要用 log/trace/metric 传统思路埋点，要用全局思维构建系统轮廓"。需审查当前 Codepoint 技能设计是否偏离此原则，为后续改进提供方向。

- [ ] 对照原作者最新建议审查当前 codepoint 技能的探针密度和设计
- [ ] 评估 scan 阶段是否过度（传统思路）vs 全局思维
- [ ] 评估 plan/implement 阶段是否符合"按提示词动态触发"原则
- [ ] 输出改进建议文档，作为后续版本的设计输入

## Success Criteria

1. `tests/e2e/codepoint-v2/` 包含 5 个测试项目，结构完整
2. `tmp/` 目录已清空
3. `docs/research/codepoint/` 包含完整的调研文档和作者分享
4. 所有文档中不再有指向 `tmp/` 的过时引用
5. 新目录结构在 PROJECT.md 中有记录
6. 产出 Codepoint 设计反省文档，明确当前设计与原作者方法论的偏差

## Out of Scope

| Item | Reason |
|------|--------|
| 改进测试项目代码 | 本里程碑仅做归档整理，不修改测试逻辑 |
| 新增 E2E 测试项目 | 使用现有测试项目，不做新增 |
| 翻译文档 | 保持原文和中文调研形式 |

## Phases

- Phase 38: E2E 测试项目迁移
- Phase 39: 调研文档归档与整理
- Phase 40: Codepoint 设计反省与改进评估
