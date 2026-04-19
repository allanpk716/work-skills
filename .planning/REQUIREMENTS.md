# Requirements: Codepoint V2 E2E 测试

**Defined:** 2026-04-18
**Core Value:** 通过精心设计的测试项目验证代码点 V2 技能的完整流程，确保探针在多流程复用场景下堆栈输出和调试信息正确，发现问题并渐进改进

## v1.9.1 Requirements

### 单语言基础验证

测试项目设计原则：计算器需包含多个业务流程（如 REST API 调用、批量计算、历史查询），这些流程共享核心计算/校验/格式化代码点，使探针能捕获不同流程经过同一关键路径时的堆栈差异。

- [ ] **SING-01**: 创建 Go 计算器项目，包含至少 3 个业务流程共享核心计算代码（parse → validate → compute → format），具备多流程复用代码点的架构
- [ ] **SING-02**: 在 Go 计算器上运行 `/codepoint:scan`，正确识别共享代码点上的多个业务流（如 API 调用流、批量处理流、历史查询流）
- [ ] **SING-03**: 在 Go 计算器上运行 `/codepoint:plan`，为新功能规划代码点，规划的探针位于关键路径而非随意选择
- [ ] **SING-04**: 在 Go 计算器上运行 `/codepoint:implement`，探针代码编译通过，TDD 验证循环正常
- [ ] **SING-05**: 运行多个业务流程，验证同一代码点在不同流程下输出不同的堆栈信息和调试数据，确认探针复用有效
- [ ] **SING-06**: 创建 Python 计算器项目，同样具备多流程共享核心代码的架构
- [ ] **SING-07**: 在 Python 计算器上完成 scan/plan/implement 全流程验证，确认堆栈输出和调试信息正确
- [ ] **SING-08**: Python 计算器多流程运行验证同一代码点在不同流程下的堆栈差异

### 单语言问题修复

- [ ] **FIX1-01**: 记录单语言 E2E 测试中发现的所有技能缺陷（探针模板、scan 识别、plan 规划、implement 生成的问题）
- [ ] **FIX1-02**: 修复发现的问题，在对应测试项目中重新验证通过
- [ ] **FIX1-03**: 确认探针模板（Go/Python）在实际项目中生成的代码可编译/运行且堆栈信息格式正确

### 全栈跨语言集成

全栈项目延续单语言的验证思路：前后端共享业务流，探针需捕获跨语言调用链路的完整调试信息。

- [x] **FULL-01**: 创建 Go+JS 全栈计算器项目，前端 JS 调用后端 Go API，业务流跨前后端且共享核心代码点
- [x] **FULL-02**: 在 Go+JS 项目上运行 `/codepoint:scan`，识别前后端各自的业务流及跨语言调用链路
- [ ] **FULL-03**: Go 后端 collector 通过 `/__codepoint__/` 端点收集前端 JS 探针数据，验证跨语言探针联动
- [ ] **FULL-04**: 运行全栈业务流程，验证同一跨语言代码点在不同流程下的完整调用链堆栈信息
- [x] **FULL-05**: 创建 Python+TS 全栈计算器项目，同样具备跨语言共享代码点的架构
- [ ] **FULL-06**: 在 Python+TS 项目上完成 scan/跨语言联动/多流程堆栈验证全流程
- [ ] **FULL-07**: Toggle 机制在全栈项目中正常工作（文件 toggle 启用/禁用探针，前后端独立控制）

### 全栈问题修复

- [ ] **FIX2-01**: 记录全栈 E2E 测试中发现的所有技能缺陷（跨语言联动、前端探针模板、collector 问题）
- [ ] **FIX2-02**: 修复发现的问题，在全栈测试项目中重新验证通过
- [ ] **FIX2-03**: 确认前端探针模板（JS/TS）生成的代码可运行且与后端 collector 正确联动

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rust/Java 等其他语言 | 当前技能只支持 Go/Python/TS/JS |
| 性能基准测试 | 本次验证功能正确性，不做性能测试 |
| CI/CD 集成测试 | 超出技能验证范围 |
| 真实生产项目测试 | 先在计算器示例上验证，再考虑真实项目 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SING-01 | Phase 32 | Pending |
| SING-02 | Phase 32 | Pending |
| SING-03 | Phase 32 | Pending |
| SING-04 | Phase 32 | Pending |
| SING-05 | Phase 32 | Pending |
| SING-06 | Phase 33 | Pending |
| SING-07 | Phase 33 | Pending |
| SING-08 | Phase 33 | Pending |
| FIX1-01 | Phase 34 | Pending |
| FIX1-02 | Phase 34 | Pending |
| FIX1-03 | Phase 34 | Pending |
| FULL-01 | Phase 35 | Done (35-01, 35-02) |
| FULL-02 | Phase 35 | Complete |
| FULL-03 | Phase 35 | Pending |
| FULL-04 | Phase 35 | Pending |
| FULL-05 | Phase 36 | Done (36-01) |
| FULL-06 | Phase 36 | Pending |
| FULL-07 | Phase 36 | Pending |
| FIX2-01 | Phase 37 | Pending |
| FIX2-02 | Phase 37 | Pending |
| FIX2-03 | Phase 37 | Pending |

**Coverage:**
- v1.9.1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-04-18*
*Last updated: 2026-04-19 — FULL-05 marked complete (36-01)*
