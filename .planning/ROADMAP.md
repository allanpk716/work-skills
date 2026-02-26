# ROADMAP: Work Skills v1.1 Git Security Scanning

**Milestone:** v1.1 - Windows Git Commit Security Scanning
**Created:** 2026-02-25
**Depth:** standard
**Starting Phase:** 6

## Overview

本路线图为 `windows-git-commit` 技能添加提交前安全扫描功能,防止敏感信息泄露到版本控制。通过多层检测策略(正则模式 + 关键词 + 熵值分析),在 git commit 前扫描暂存区内容,发现问题时阻止提交并显示详细提示。

**Core Value:** 为 Windows 开发者提供即开即用的安全扫描工具,保护代码仓库免受敏感信息泄露

## Phases

- [ ] **Phase 6: Core Scanning Infrastructure** - 构建规则引擎和核心检测器(密钥、缓存、配置文件)
- [ ] **Phase 7: Scanning Execution & Reporting** - 实现扫描流程、问题报告和自定义规则
- [ ] **Phase 8: Internal Info Detection & Integration** - 添加内部信息检测、集成到 SKILL.md
- [x] **Phase 9: Windows Testing & Optimization** - Windows 兼容性测试和性能优化 ✓
- [ ] **Phase 10: UX Polish & Production Ready** - 双语支持、结果分级、最终打磨

## Phase Details

### Phase 6: Core Scanning Infrastructure

**Goal:** 开发者能够使用基础安全扫描器检测密钥、缓存文件和配置文件泄露

**Depends on:** Nothing (首个阶段)

**Requirements:**
- SENS-01, SENS-02, SENS-03, SENS-04, SENS-05, SENS-06 (密钥检测)
- CACHE-01, CACHE-02, CACHE-03, CACHE-04 (缓存文件检测)
- CONF-01, CONF-02, CONF-03 (配置文件检测)

**Success Criteria** (what must be TRUE):
1. 用户运行扫描器可以检测到 AWS Access Key ID 和 Secret Access Key
2. 用户运行扫描器可以检测到 GitHub Personal Access Token
3. 用户运行扫描器可以检测到通用 API 密钥模式(api_key, secret, password 字段)
4. 用户运行扫描器可以检测到 SSH/PGP 私钥和 PEM 证书文件
5. 用户运行扫描器可以检测到 Python 缓存文件和 Node.js 依赖目录
6. 用户运行扫描器可以检测到 .env 文件和凭证配置文件

**Plans:**
- [ ] 06-01-PLAN.md — 实现敏感信息检测规则引擎 (SENS-01 到 SENS-06)
- [ ] 06-02-PLAN.md — 实现缓存文件和配置文件检测规则 (CACHE-01 到 CACHE-04, CONF-01 到 CONF-03)

---

### Phase 7: Scanning Execution & Reporting

**Goal:** 开发者能够在 git commit 前自动扫描暂存区,并收到清晰的问题报告

**Depends on:** Phase 6

**Requirements:**
- EXEC-01, EXEC-02, EXEC-03, EXEC-04 (扫描执行)
- RPT-01, RPT-02, RPT-03, RPT-04, RPT-05 (问题报告)
- CUST-01, CUST-02, CUST-04 (自定义规则)

> **Note:** CUST-03 (扫描白名单功能) 延后至 Phase 8 实现,遵循 RESEARCH.md 建议

**Success Criteria** (what must be TRUE):
1. 用户执行 git commit 时自动扫描暂存区内容
2. 发现敏感信息时扫描器阻止 git commit 执行
3. 用户可以看到问题类型、文件路径和行号
4. 用户可以看到问题内容片段(敏感信息已脱敏)和修复建议
5. 用户可以通过 .gitignore 文件自定义扫描排除规则

**Plans:**
- [ ] 07-01-PLAN.md — 实现扫描执行流程和.gitignore规则解析 (EXEC-01, EXEC-02, EXEC-03, EXEC-04, CUST-01, CUST-02, CUST-04)
- [ ] 07-02-PLAN.md — 实现报告生成器,提供彩色表格格式输出 (RPT-01, RPT-02, RPT-03, RPT-04, RPT-05)
- [ ] 07-03-PLAN.md — 集成Phase 6检测规则,创建pre-commit hook (EXEC-01, RPT-01)

---

### Phase 8: Internal Info Detection & Integration

**Goal:** 开发者能够检测内部信息泄露,并使用完整集成的安全扫描功能

**Depends on:** Phase 7

**Requirements:**
- INTL-01, INTL-02, INTL-03 (内部信息检测)
- CUST-03 (扫描白名单功能,从 Phase 7 延后)

**Success Criteria** (what must be TRUE):
1. 用户运行扫描器可以检测到内网 IP 地址(10.x.x.x, 172.16-31.x.x, 192.168.x.x)
2. 用户运行扫描器可以检测到内部域名(*.internal, *.local, *.corp)
3. 用户可以检测到邮箱地址泄露
4. 用户使用 windows-git-commit 技能时自动执行安全扫描

**Plans:** TBD

---

### Phase 9: Windows Testing & Optimization

**Goal:** 开发者在 Windows 系统上获得快速、稳定的扫描体验,并能在紧急情况下跳过扫描

**Depends on:** Phase 8

**Requirements:**
- UX-02 (紧急情况跳过扫描)

**Success Criteria** (what must be TRUE):
1. 用户在 Windows 10+ 系统上可以正常运行安全扫描器
2. 用户可以在紧急情况下使用选项跳过扫描(有明确风险提示)
3. 中等规模仓库的扫描时间小于 2 秒
4. 二进制文件被正确跳过,不触发错误

**Plans:** 3 plans
- [x] 09-01-PLAN.md — 创建测试框架和性能基准(Wave 0) ✓
- [x] 09-02-PLAN.md — 实现性能优化和 Windows 兼容性(Wave 1) ✓
- [x] 09-03-PLAN.md — 实现跳过扫描选项和最终验证(Wave 2) ✓

---

### Phase 10: UX Polish & Production Ready

**Goal:** 开发者获得生产就绪的安全扫描体验,支持双语和问题分级

**Depends on:** Phase 9

**Requirements:**
- UX-01, UX-03, UX-04 (用户体验优化)

**Success Criteria** (what must be TRUE):
1. 用户可以清晰区分错误级别(阻止提交)和警告级别(仅提示)的问题
2. 用户可以看到彩色输出的扫描结果,提高可读性
3. 用户可以选择中文或英文提示信息
4. 用户在实际项目中使用扫描器,无阻塞性问题

**Plans:** 1/2 plans executed

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Core Scanning Infrastructure | 0/4 | Not started | - |
| 7. Scanning Execution & Reporting | 0/3 | Not started | - |
| 8. Internal Info Detection & Integration | 0/2 | Not started | - |
| 9. Windows Testing & Optimization | 3/3 | ✅ Complete | 2026-02-26 |
| 10. UX Polish & Production Ready | 1/2 | In Progress|  |

---

## Coverage

**Total v1 requirements:** 28
**Mapped to phases:** 28
**Coverage:** 100% ✓

### Requirement Mapping

| Category | Requirements | Phase |
|----------|--------------|-------|
| 敏感信息检测 | SENS-01, SENS-02, SENS-03, SENS-04, SENS-05, SENS-06 | Phase 6 |
| 缓存文件检测 | CACHE-01, CACHE-02, CACHE-03, CACHE-04 | Phase 6 |
| 配置文件检测 | CONF-01, CONF-02, CONF-03 | Phase 6 |
| 扫描执行 | EXEC-01, EXEC-02, EXEC-03, EXEC-04 | Phase 7 |
| 问题报告 | RPT-01, RPT-02, RPT-03, RPT-04, RPT-05 | Phase 7 |
| 自定义规则 | CUST-01, CUST-02, CUST-04 | Phase 7 |
| 自定义规则(白名单) | CUST-03 | Phase 8 |
| 内部信息检测 | INTL-01, INTL-02, INTL-03 | Phase 8 |
| 用户体验 | UX-02 | Phase 9 |
| 用户体验 | UX-01, UX-03, UX-04 | Phase 10 |

---

## Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| 分阶段交付检测器 | 降低复杂度,先实现核心检测,再添加高级功能 | Phase 6-8 |
| 使用 Python 标准库 | 无外部依赖,Windows 预装,与现有架构一致 | Phase 6 |
| 复用 .gitignore 规则 | 用户熟悉的语法,无需学习新配置 | Phase 7 |
| 阻止提交而非警告 | 强制用户处理安全问题,更安全 | Phase 7 |
| CUST-03 白名单延后 | 遵循 RESEARCH.md 建议,优先完成核心功能 | Phase 8 |
| Windows 专项测试 | 确保 Windows 兼容性和性能 | Phase 9 |
| 双语支持 | 提升用户体验,支持中英文 | Phase 10 |

---

*Roadmap created: 2026-02-25*
*Ready for planning: yes*
