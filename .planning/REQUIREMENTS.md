# Requirements: Work Skills v1.3

**Defined:** 2026-03-28
**Core Value:** 安装器在配置步骤中自动检测已有配置，避免重复输入，提升重复运行体验

## v1.3 Requirements

Requirements for smart configuration detection in installer.

### Config Detection (CFGD)

- [x] **CFGD-01**: Installer can detect if Pushover credentials (PUSHOVER_API_KEY, PUSHOVER_USER_KEY) are already persisted via setx in environment variables
- [ ] **CFGD-02**: Installer can detect if Git user info (user.name, user.email) is already configured via git config --global

### Smart Interaction (INTX)

- [x] **INTX-01**: When existing config is detected, installer displays current values to user (masked API key, full user info)
- [x] **INTX-02**: User can choose to skip the configuration step when existing values are detected, proceeding to next step
- [x] **INTX-03**: User can choose to re-enter configuration, updating existing values and re-persisting them

### Unified Flow (UFLOW)

- [ ] **UFLOW-01**: Fresh install (no existing config) proceeds with full configuration prompts, no detection overhead
- [ ] **UFLOW-02**: Re-run (existing config detected) checks each item and asks user skip/update per item, adapting automatically

## Out of Scope

| Feature | Reason |
|---------|--------|
| Git SSH config detection | User explicitly excluded from scope |
| Installed plugin detection | User explicitly excluded from scope |
| Separate "update" command/mode | User chose unified flow approach |
| Config file export/import | Future consideration |
| Silent install mode (--quiet) | Future consideration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CFGD-01 | Phase 20 | Complete |
| CFGD-02 | Phase 20 | Pending |
| INTX-01 | Phase 20 | Complete |
| INTX-02 | Phase 20 | Complete |
| INTX-03 | Phase 20 | Complete |
| UFLOW-01 | Phase 21 | Pending |
| UFLOW-02 | Phase 21 | Pending |

**Coverage:**
- v1.3 requirements: 7 total
- Mapped to phases: 7
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after roadmap creation*
