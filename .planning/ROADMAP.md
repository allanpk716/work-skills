# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-04-18

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- [x] **v1.3 - 智能配置检测** - Phases 20-21 (shipped 2026-03-29)
- [x] **v1.4 - 修复插件安装检测** - Phases 22-23 (shipped 2026-03-30)
- [x] **v1.5 - NPX 卸载功能** - Phases 24-25 (shipped 2026-03-30)
- [x] **v1.6 - 通知标志文件向上查找 + 全局控制** - Phases 26-28 (shipped 2026-04-01)
- [x] **v1.7 - 通知项目名称智能识别** - Phases 29-30 (shipped 2026-04-04)
- [x] **v1.8 - Worktree 区分** - Phase 31 (shipped 2026-04-09)
- [ ] **v1.9.1 - Codepoint V2 E2E 测试** - Phases 32-37 (in progress)

## Phases

### v1.9.1 - Codepoint V2 E2E 测试 (In Progress)

**Milestone Goal:** 通过精心设计的测试项目验证代码点 V2 技能的完整流程（scan/plan/implement/跨语言集成），发现问题并渐进改进

- [ ] **Phase 32: Go 单语言计算器验证** - 创建 Go 计算器项目并完成 scan/plan/implement 全流程验证
- [ ] **Phase 33: Python 单语言计算器验证** - 创建 Python 计算器项目并完成 scan/plan/implement 全流程验证
- [x] **Phase 34: 单语言问题修复** - 记录并修复单语言 E2E 测试中发现的所有技能缺陷 (3/3 plans, completed 2026-04-18)
- [x] **Phase 35: Go+JS 全栈跨语言集成** - 创建 Go+JS 全栈计算器并验证跨语言探针联动 (4/4 plans, completed 2026-04-19)
- [ ] **Phase 36: Python+TS 全栈跨语言集成** - 创建 Python+TS 全栈计算器并验证跨语言探针联动
- [ ] **Phase 37: 全栈问题修复** - 记录并修复全栈 E2E 测试中发现的所有技能缺陷

<details>
<summary>v1.8 - Worktree 区分 (Phase 31) — SHIPPED 2026-04-09</summary>

- [x] Phase 31: Worktree 区分 (2/2 plans) — completed 2026-04-08

</details>

<details>
<summary>v1.7 - 通知项目名称智能识别 (Phases 29-30) — SHIPPED 2026-04-04</summary>

- [x] Phase 29: Find-up Project Root Logic (2/2 plans) — completed 2026-04-04
- [x] Phase 30: Integration into Notification Scripts (1/1 plan) — completed 2026-04-04

</details>

<details>
<summary>v1.6 - 通知标志文件向上查找 + 全局控制 (Phases 26-28) — SHIPPED 2026-04-01</summary>

- [x] Phase 26: Find-up Implementation (2/2 plans) — completed 2026-04-01
- [x] Phase 27: Global Control (2/2 plans) — completed 2026-04-01
- [x] Phase 28: Diagnostics & Testing (1/1 plan) — completed 2026-04-01

</details>

<details>
<summary>v1.5 - NPX 卸载功能 (Phases 24-25) — SHIPPED 2026-03-30</summary>

- [x] Phase 24: CLI Entry & Detection (2/2 plans) — completed 2026-03-30
- [x] Phase 25: Uninstall Execution & UX (2/2 plans) — completed 2026-03-30

</details>

<details>
<summary>v1.4 - 修复插件安装检测 (Phases 22-23) — SHIPPED 2026-03-30</summary>

- [x] Phase 22: Plugin Install Detection (1/1 plan)
- [x] Phase 23: Smart Reinstall Flow (1/1 plan)

</details>

<details>
<summary>v1.3 - 智能配置检测 (Phases 20-21) — SHIPPED 2026-03-29</summary>

- [x] Phase 20: Config Detection & Smart Interaction (2/2 plans)
- [x] Phase 21: Unified Flow Integration (1/1 plan)

</details>

<details>
<summary>v1.2 - Installer NPX 安装体验 (Phases 13-19) — SHIPPED 2026-03-28</summary>

- [x] Phase 13: Add Slash Commands (1/1 plan)
- [x] Phase 14: Installer Foundation (3/3 plans)
- [x] Phase 15: Environment Detection (3/3 plans)
- [x] Phase 16: Python Dependencies (2/2 plans)
- [x] Phase 17: Interactive Configuration (3/3 plans)
- [x] Phase 18: Marketplace Integration (3/3 plans)
- [x] Phase 19: Installation Verification (2/2 plans)

</details>

<details>
<summary>v1.1 - Git Security Scanning (Phases 6-12) — SHIPPED 2026-02-27</summary>

- [x] Phase 06: Core Scanning Infrastructure
- [x] Phase 07: Scanning Execution & Reporting
- [x] Phase 08: Internal Info Detection & Integration
- [x] Phase 09: Windows Testing & Optimization
- [x] Phase 10: UX Polish & Production Ready
- [x] Phase 11: Fix Orphaned Security Rules
- [x] Phase 12: Verify Phase 9 Completion

</details>

<details>
<summary>v1.0 - Claude Notify (Phases 1-5) — SHIPPED 2026-02-24</summary>

- [x] Phase 01: Core Infrastructure
- [x] Phase 01.1: Hook Claude Code Skill
- [x] Phase 02: Configuration Diagnostics
- [x] Phase 03: Documentation & Efficiency
- [x] Phase 03.1: Fix Missing Features

</details>

## Phase Details

### Phase 32: Go 单语言计算器验证
**Goal**: 用户可以在 Go 计算器测试项目上完整运行 codepoint scan/plan/implement 流程，并验证探针在多业务流下正确输出不同堆栈信息
**Depends on**: Phase 31 (v1.8 shipped)
**Requirements**: SING-01, SING-02, SING-03, SING-04, SING-05
**Success Criteria** (what must be TRUE):
  1. Go 计算器项目存在且包含至少 3 个业务流程（REST API、批量处理、历史查询）共享核心计算代码路径（parse -> validate -> compute -> format）
  2. History 查询流通过 calculator.Evaluate() 显式重新计算，经过完整共享管道
  3. `/codepoint:scan` 正确识别共享代码点上的多个业务流，输出包含每个流的调用路径信息（含修正程序处理非确定性输出）
  4. `/codepoint:plan` 规划的探针位于关键业务路径上，plan 输出被 implement 直接消费
  5. `/codepoint:implement` 生成的探针代码编译通过，flow_id 通过 context.Context 传播，TDD 验证循环正常执行
  6. 运行不同业务流程时，同一代码点的探针输出不同的堆栈信息和调试数据，可区分调用来源
**Plans:** 2 plans (revised) (revised per 32-REVIEWS.md)

Plans:
- [ ] 32-01: 创建 Go 计算器项目（多流程共享核心计算架构，history 显式重新计算，context.Context for flow_id）
- [ ] 32-02: 运行 codepoint scan 并验证业务流识别（含修正程序处理非确定性输出，结构化验证）
- [ ] 32-03: 运行 codepoint plan 并验证探针规划质量（对现有流重新规划，输出被 implement 消费）
- [ ] 32-04: 运行 codepoint implement 并验证探针编译和 TDD 循环（预检，hybrid 探针方式，flow_id via context.Context）
- [ ] 32-05: 多流程运行验证堆栈差异（测试隔离，密度验证 20-60%，cleanup）

### Phase 33: Python 单语言计算器验证
**Goal**: 用户可以在 Python 计算器测试项目上完整运行 codepoint scan/plan/implement 流程，确认技能对 Python 语言的完整支持
**Depends on**: Phase 32
**Requirements**: SING-06, SING-07, SING-08
**Success Criteria** (what must be TRUE):
  1. Python 计算器项目存在且具备与 Go 计算器相同的多流程共享核心代码架构
  2. `/codepoint:scan` 正确识别 Python 项目中的共享代码点和业务流
  3. `/codepoint:plan` 和 `/codepoint:implement` 在 Python 项目上正常工作，生成的探针代码可运行
  4. 多流程运行时，同一 Python 代码点的探针输出不同的堆栈信息和调试数据
**Plans:** 2 plans (revised)

Plans:
- [ ] 33-01: 创建 Python 计算器项目（多流程共享核心计算架构）
- [ ] 33-02: 运行 codepoint scan/plan/implement 全流程验证
- [ ] 33-03: 多流程运行验证堆栈差异

### Phase 34: 单语言问题修复
**Goal**: 单语言 E2E 测试中发现的所有技能缺陷被记录、修复，探针模板在实际项目中生成的代码可编译运行
**Depends on**: Phase 32, Phase 33
**Requirements**: FIX1-01, FIX1-02, FIX1-03
**Success Criteria** (what must be TRUE):
  1. 所有在 Go/Python 单语言测试中发现的问题被完整记录在文档中，包含问题描述、复现步骤、预期行为
  2. 记录的所有问题已修复，在对应测试项目中重新验证通过
  3. Go 探针模板和 Python 探针模板生成的代码在实际项目中可编译/运行，堆栈信息格式正确可读
**Plans:** 3 plans

Plans:
- [ ] 34-01: 创建结构化缺陷记录文件 34-DEFECTS.yaml（FIX1-01）
- [ ] 34-02: 为 golang.md 和 python.md 添加编译检查说明并验证测试项目编译/运行通过（FIX1-02, FIX1-03）
- [ ] 34-03: 在 go-calculator 和 python-calculator 上运行完整 codepoint scan/plan/implement 技能验证（FIX1-02, FIX1-03）

### Phase 35: Go+JS 全栈跨语言集成
**Goal**: 用户可以在 Go+JS 全栈计算器上验证跨语言探针联动，前端 JS 探针数据通过 collector 端点被后端 Go 收集
**Depends on**: Phase 34
**Requirements**: FULL-01, FULL-02, FULL-03, FULL-04
**Success Criteria** (what must be TRUE):
  1. Go+JS 全栈计算器项目存在，前端 JS 调用后端 Go API，业务流跨前后端且共享核心代码点
  2. `/codepoint:scan` 识别前后端各自的业务流及跨语言调用链路，输出包含完整的调用链信息
  3. Go 后端 `/__codepoint__/` collector 端点正确收集前端 JS 探针数据，跨语言探针联动正常
  4. 运行全栈业务流程时，同一跨语言代码点在不同流程下输出完整的调用链堆栈信息，包含前端和后端部分
**Plans:** 4/4 plans complete

Plans:
- [x] 35-01: 创建 Go 后端项目（calculator + API + 增强 collector + go:embed + 测试）— FULL-01
- [x] 35-02: 创建 React 前端（Vite 构建 + codepoint.ts + 三组件 + 构建+集成验证）— FULL-01 (completed 2026-04-18)
- [x] 35-03: 运行 codepoint scan 验证跨语言业务流识别 — FULL-02
- [x] 35-04: 验证 collector 联动 + 多流程跨语言堆栈完整性 — FULL-03, FULL-04

### Phase 36: Python+TS 全栈跨语言集成
**Goal**: 用户可以在 Python+TS 全栈计算器上验证跨语言探针联动和 Toggle 机制，确认技能对 Python+TS 技术栈的完整支持
**Depends on**: Phase 35
**Requirements**: FULL-05, FULL-06, FULL-07
**Success Criteria** (what must be TRUE):
  1. Python+TS 全栈计算器项目存在，具备与 Go+JS 项目相同的跨语言共享代码点架构
  2. `/codepoint:scan`、跨语言联动、多流程堆栈验证在 Python+TS 项目上完整通过
  3. Toggle 机制正常工作：通过文件 toggle 可独立启用/禁用前端和后端的探针，切换后立即生效
**Plans:** 2 plans (revised)

Plans:
- [ ] 36-01-PLAN.md — 创建 Python+TS 全栈计算器项目（FastAPI 后端 + React TS 前端 + collector + 构建集成）
- [ ] 36-02-PLAN.md — 跨语言联动验证（collector + 多流程堆栈 + Toggle 四组合）

### Phase 37: 全栈问题修复
**Goal**: 全栈 E2E 测试中发现的所有技能缺陷被记录、修复，前端探针模板生成的代码可运行且与后端 collector 正确联动
**Depends on**: Phase 35, Phase 36
**Requirements**: FIX2-01, FIX2-02, FIX2-03
**Success Criteria** (what must be TRUE):
  1. 所有在 Go+JS 和 Python+TS 全栈测试中发现的问题被完整记录，包含跨语言联动、前端探针模板、collector 等类别
  2. 记录的所有问题已修复，在全栈测试项目中重新验证通过
  3. JS/TS 前端探针模板生成的代码在浏览器中可运行，且与后端 collector 正确联动，调试数据完整
**Plans:** 2 plans (revised)

Plans:
- [ ] 37-01: 汇总记录全栈测试中发现的所有缺陷
- [ ] 37-02: 修复缺陷并在全栈测试项目中重新验证
- [ ] 37-03: 确认前端探针模板（JS/TS）生成代码的运行质量和 collector 联动正确性

## Progress

**Execution Order:**
Phases execute in numeric order: 32 -> 33 -> 34 -> 35 -> 36 -> 37

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 32. Go 单语言计算器验证 | v1.9.1 | 0/5 | Not started | - |
| 33. Python 单语言计算器验证 | v1.9.1 | 0/3 | Not started | - |
| 34. 单语言问题修复 | v1.9.1 | 0/3 | Not started | - |
| 35. Go+JS 全栈跨语言集成 | v1.9.1 | 4/4 | Complete | 2026-04-19 |
| 36. Python+TS 全栈跨语言集成 | v1.9.1 | 0/2 | Planned | - |
| 37. 全栈问题修复 | v1.9.1 | 0/3 | Not started | - |

---
*Roadmap initialized: 2026-02-24*
*Last updated: 2026-04-19 — Phase 35 complete (4/4 plans)*
