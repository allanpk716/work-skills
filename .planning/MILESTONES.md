# Milestones

## v1.4 修复插件安装检测 (Shipped: 2026-03-30)

**Phases completed:** 2 phases, 2 plans, 4 tasks

**Key accomplishments:**

- Flattened windows-git-commit plugin from nested skills/windows-git-commit/ to root level, matching claude-notify structure for installer isPluginInstalled() detection
- Verified windows-git-commit plugin detection end-to-end: pushed Phase 22 fix to remote, reinstalled via installer, confirmed isPluginInstalled() returns true for both plugins (DETECT-01/03), auto-approved [installed] marker display logic (DETECT-02)

---

## v1.3 智能配置检测 (Shipped: 2026-03-29)

**Phases completed:** 2 phases, 3 plans, 6 tasks

**Key accomplishments:**

- Dual-source Pushover credential detection with registry fallback and per-item Confirm interaction
- Git user configurator enhanced with per-item Confirm prompts for keep/re-enter, supporting 4 cases (both, only name, only email, neither) with unified save logic
- 14 integration tests verifying UFLOW-01 (fresh install) and UFLOW-02 (re-run) detection and case-mapping logic across pushover, git-user, and git-ssh configurators

---

## v1.2 Installer - NPX Installation Experience (Shipped: 2026-03-28)

**Phases completed:** 7 phases, 17 plans, 43 tasks

**Key accomplishments:**

- NPX installer -- `npx @allanpk716/work-skills-setup` one-command installation with Windows detection, bilingual support, CLI options
- Environment detection -- parallel detection of Python/Git/SSH/pip packages with clear status reports and installation guidance
- Python dependency auto-install -- interactive pip install with --user flag, permission/network/pip error detection
- Interactive configuration -- Pushover credential validation, Git SSH configuration, Git user info setup
- Claude Code marketplace integration -- register marketplace source, discover plugins, interactive multi-select installation
- Installation verification -- post-install auto-verification, --verify standalone rerun, pass/fail report

---

## v1.1 Windows Git Commit Security Scanning (Shipped: 2026-02-27)

**Phases completed:** 12 phases, 21 plans, 7 tasks

**Key accomplishments:**

- (none recorded)

---
