# ROADMAP: Work Skills

**Project:** Claude Code 个人技能集
**Last Updated:** 2026-03-30

## Milestones

- [x] **v1.0 - Claude Notify** - Phases 1-5 (shipped 2026-02-24)
- [x] **v1.1 - Git Security Scanning** - Phases 6-12 (shipped 2026-02-27)
- [x] **v1.2 - Installer NPX 安装体验** - Phases 13-19 (shipped 2026-03-28)
- [x] **v1.3 - 智能配置检测** - Phases 20-21 (shipped 2026-03-29)
- [x] **v1.4 - 修复插件安装检测** - Phases 22-23 (shipped 2026-03-30)
- [ ] **v1.5 - NPX 卸载功能** - Phases 24-25 (current)

## Phases

### v1.5 - NPX 卸载功能 (Phases 24-25) -- IN PROGRESS

- [ ] **Phase 24: CLI Entry & Detection** - Establish --uninstall entry point and detect installed components
- [ ] **Phase 25: Uninstall Execution & UX** - Implement confirmation, removal, reporting with fault tolerance

#### Phase 24: CLI Entry & Detection
**Goal**: Users can trigger uninstall via CLI and see what will be removed
**Depends on**: Phase 23 (v1.4 shipped)
**Requirements**: CLI-01, CLI-02, CLI-03, PLUG-01, ENV-01, UX-04
**Success Criteria** (what must be TRUE):
  1. User can run `npx @allanpk716/work-skills-setup --uninstall` and the uninstall flow starts (not the install flow)
  2. `--help` output shows uninstall usage with description in both Chinese and English
  3. System correctly detects which plugins are installed and which Pushover env vars exist (empty result when nothing installed, full list when everything installed)
  4. Uninstall output is bilingual -- respects system language or --lang flag

Plans:
- [x] 24-01-PLAN.md -- Add --uninstall CLI entry point, routing, and i18n translation keys
- [ ] 24-02-PLAN.md -- Create uninstall detection module (detector + formatter + entry point)

#### Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 24. CLI Entry & Detection | 1/2 | In progress | 2026-03-30 |
| 25. Uninstall Execution & UX | 0/? | Not started | - |

<details>
<summary>v1.4 - 修复插件安装检测 (Phases 22-23) -- SHIPPED 2026-03-30</summary>

## Phase Details

### Phase 24: CLI Entry & Detection
**Goal**: Users can trigger uninstall via CLI and see what will be removed
**Depends on**: Phase 23 (v1.4 shipped)
**Requirements**: CLI-01, CLI-02, CLI-03, PLUG-01, ENV-01, UX-04
**Success Criteria** (what must be TRUE):
  1. User can run `npx @allanpk716/work-skills-setup --uninstall` and the uninstall flow starts (not the install flow)
  2. `--help` output shows uninstall usage with description in both Chinese and English
  3. System correctly detects which plugins are installed and which Pushover env vars exist (empty result when nothing installed, full list when everything installed)
  4. Uninstall output is bilingual — respects system language or --lang flag
**Plans**: 2 plans

Plans:
- [ ] 24-01-PLAN.md — Add --uninstall CLI entry point, routing, and i18n translation keys
- [ ] 24-02-PLAN.md — Create uninstall detection module (detector + formatter + entry point)

### Phase 25: Uninstall Execution & UX
**Goal**: Users can review, confirm, and complete uninstallation with clear feedback and fault tolerance
**Depends on**: Phase 24
**Requirements**: UX-01, UX-02, UX-03, UX-05, UX-06, PLUG-02, PLUG-03, PLUG-04, ENV-02
**Success Criteria** (what must be TRUE):
  1. Before any changes, user sees a complete summary of all items to be removed (plugins, env vars, marketplace entries)
  2. User must type confirm to proceed; pressing cancel/abort leaves system unchanged
  3. After completion, user sees a clear report showing success/failure status for each removed item
  4. If one item fails to remove (e.g., file locked), remaining items continue to be processed and the failure is reported
  5. Installed plugin directories are removed, settings.json references are cleaned, and Pushover env vars are deleted from registry
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 24. CLI Entry & Detection | 0/2 | Not started | - |
| 25. Uninstall Execution & UX | 0/? | Not started | - |

</details>

---
*Roadmap created: 2026-02-25*
*Last updated: 2026-03-30 -- v1.5 milestone, Phase 24 Plan 01 complete*
