# Requirements: Work Skills v1.5 — NPX 卸载功能

**Defined:** 2026-03-30
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务

## v1.5 Requirements

Requirements for v1.5 milestone. Each maps to roadmap phases.

### CLI 触发

- [ ] **CLI-01**: User can run `npx @allanpk716/work-skills-setup --uninstall` to trigger the uninstall flow
- [ ] **CLI-02**: `--help` output includes uninstall usage and description
- [ ] **CLI-03**: `--version` output remains consistent with installer version

### 插件清理

- [ ] **PLUG-01**: System detects which plugins are currently installed (claude-notify, windows-git-commit)
- [x] **PLUG-02**: System removes installed plugin directories from Claude Code plugins folder
- [x] **PLUG-03**: System removes plugin entries from Claude Code settings.json (skills/hooks references)
- [x] **PLUG-04**: System removes source registration from marketplace.json

### 环境清理

- [ ] **ENV-01**: System detects Pushover environment variables set via setx (PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN)
- [x] **ENV-02**: System removes detected Pushover environment variables via registry deletion (persistent setx values)

### UX & 安全

- [x] **UX-01**: User sees a summary list of all items to be removed before uninstall starts
- [x] **UX-02**: User must confirm the uninstall action before any changes are made
- [x] **UX-03**: System displays a clear uninstall report (success/failure per item) after completion
- [ ] **UX-04**: Uninstall flow supports bilingual output (Chinese/English, auto-detected)
- [x] **UX-05**: System handles partial failures gracefully — continues uninstalling remaining items if one fails
- [x] **UX-06**: User can abort uninstall at confirmation prompt without any changes made

## Future Requirements

Deferred to future releases.

### 高级卸载

- **ADV-01**: `--force` flag to skip confirmation prompt
- **ADV-02**: Selective uninstall — user picks which plugins/env vars to remove individually
- **ADV-03**: Uninstall log file saved to disk for audit trail

## Out of Scope

| Feature | Reason |
|---------|--------|
| Git SSH 配置回滚 | SSH 密钥可能被其他工具使用,不自动删除 |
| Git 用户配置回滚 | git config --global 设置可能影响其他工作流 |
| Python 依赖卸载 | pip 包可能被其他项目依赖 |
| 卸载后重新安装检测 | 已有 v1.3 智能配置检测覆盖 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 24 | Pending |
| CLI-02 | Phase 24 | Pending |
| CLI-03 | Phase 24 | Pending |
| PLUG-01 | Phase 24 | Pending |
| ENV-01 | Phase 24 | Pending |
| UX-04 | Phase 24 | Pending |
| UX-01 | Phase 25 | Complete |
| UX-02 | Phase 25 | Complete |
| UX-03 | Phase 25 | Complete |
| UX-05 | Phase 25 | Complete |
| UX-06 | Phase 25 | Complete |
| PLUG-02 | Phase 25 | Complete |
| PLUG-03 | Phase 25 | Complete |
| PLUG-04 | Phase 25 | Complete |
| ENV-02 | Phase 25 | Complete |

**Coverage:**
- v1.5 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation*
