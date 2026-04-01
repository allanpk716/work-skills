# Requirements: Work Skills v1.6

**Defined:** 2026-04-01
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务

## v1.6 Requirements

### 向上查找 (Find-up)

- [ ] **FIND-01**: `check_notification_flags()` 在当前目录未找到 `.no-xxx` 文件时，向上遍历父目录查找，直到找到文件或到达根目录
- [ ] **FIND-02**: `notify-attention.py` 中的检测逻辑同步支持向上查找

### 全局控制 (Global Control)

- [ ] **GLOB-01**: 支持 `~/.claude/.no-pushover` 和 `~/.claude/.no-windows` 文件作为全局通知屏蔽，对所有项目生效
- [ ] **GLOB-02**: 查找优先级：项目级（当前目录向上）优先，`~/.claude/` 全局作为回退

### 诊断与测试 (Diagnostics & Testing)

- [ ] **DIAG-01**: `diagnose_configuration()` 显示项目级和全局级的 `.no-xxx` 文件检测结果
- [ ] **TEST-01**: 新增测试覆盖父目录查找场景（文件在父目录、文件在更上层、无文件）
- [ ] **TEST-02**: 新增测试覆盖全局 `~/.claude/` 查找场景

## Out of Scope

| Feature | Reason |
|---------|--------|
| 通知频道级别的细粒度全局配置 | 当前 `.no-xxx` 文件模式已足够 |
| 向上查找超过文件系统根目录 | 不合理，需有边界 |
| 交互式全局通知开关命令 | 未来版本考虑 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIND-01 | Phase 26 | Pending |
| FIND-02 | Phase 26 | Pending |
| GLOB-01 | Phase 27 | Pending |
| GLOB-02 | Phase 27 | Pending |
| DIAG-01 | Phase 28 | Pending |
| TEST-01 | Phase 28 | Pending |
| TEST-02 | Phase 28 | Pending |

**Coverage:**
- v1.6 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation*
