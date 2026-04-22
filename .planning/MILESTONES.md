# Milestones

## v2.0 前端自动化测试体系 (Shipped: 2026-04-20)

**Phases completed:** 6 phases, 12 plans
**Known deferred items at close:** 7 (see STATE.md Deferred Items)

**Key accomplishments:**

- /codepoint-test-plan 技能 — 6 步测试规划工作流 + 10 个探针代码片段 (D-01~D-10)
- index.json 数据契约 — 1 collection / 2 flows / 9 codepoints，33 项结构校验
- /codepoint-instrument 技能 — 6 步埋点规划，5 级优先级 (P1-P5)，按类型元数据契约
- /codepoint-verify 技能 — 7 步验证工作流，4 轮校验 (序列/完整/元数据/覆盖)
- /codepoint-run 编排技能 — 双入口模式 (现有代码库/新功能)，6 子技能链，制品恢复
- /codepoint-validate 技能 — 5 轮渐进式静态制品一致性验证

---

## v1.9.2 Codepoint 测试归档与调研文档整理 (Shipped: 2026-04-20)

**Phases completed:** 3 phases, 5 plans
**Known deferred items at close:** 7 (see STATE.md Deferred Items)

**Key accomplishments:**

- E2E 测试项目从 tmp/ 迁移到 tests/e2e/codepoint-v2/，5 个项目 (go/python/gojs/pyts/template) 结构完整，tmp/ 清空
- 代码点方法论调研文档归档到 docs/research/codepoint/（主文档 + 6 配图 + 全局思维补充 + workspace 迭代记录）
- Codepoint V2 设计反省：5 条偏差 (CP-01~05) + 3 条合理偏离 (RD-01~03)，10 个决策点全覆盖
- 改进优先级排序：CP-01 (P0) > CP-05 (P0) > CP-02 (P1) > CP-04 (P1) > CP-03 (P2)

---

## v1.9.1 Codepoint V2 E2E Tests (Shipped: 2026-04-19)

**Phases completed:** 6 phases, 20 plans
**Known deferred items at close:** 8 (see STATE.md Deferred Items)

**Key accomplishments:**

- Go 单语言 E2E: 3 业务流计算器 + scan/plan/implement 全流程验证, 多流程堆栈差异确认
- Python 单语言 E2E: 同架构验证通过, 探针模板双语言可编译运行
- Go+JS 全栈跨语言集成: 20 codepoints 识别, 3 flows 文档化, collector 联动验证, SPA fallback + batch unwrap 修复
- Python+TS 全栈跨语言集成: FastAPI + React TS, Toggle 四组合独立验证, Windows 进程管理
- 全栈缺陷修复: 12 个 E2E 缺陷记录并修复 (4 单语言 + 8 全栈), golang.md/python.md 模板更新

---

## v1.8 Worktree 区分 (Shipped: 2026-04-08)

**Phases completed:** 1 phases, 2 plans, 2 tasks

**Key accomplishments:**

- get_git_branch() with git branch --show-current, build_notification_title() for [project:branch] format, and find_project_root() worktree fix (.exists() replacing .is_dir())
- notify.py and notify-attention.py use shared build_notification_title() from flags.py for [project:branch] title format; both scripts import get_git_branch() for worktree-aware notification titles; 6 integration tests added in TestWorktreeTitleFormat class

---

## v1.7 通知项目名称智能识别 (Shipped: 2026-04-04)

**Phases completed:** 2 phases, 3 plans, 3 tasks

**Key accomplishments:**

- TDD RED phase: 13 failing tests defining behavioral contract for find_project_root() and get_project_name() with mock-based Path traversal
- Upward-traversal find_project_root() detecting .git directories and CLAUDE.md files, with get_project_name() returning directory name or cwd basename fallback
- Migrated get_project_name() from local os.getcwd-based implementations to shared flags.py upward-traversal, fixing subdirectory name display (e.g., "scripts" -> "work-skills")

---

## v1.6 通知标志文件向上查找 + 全局控制 (Shipped: 2026-04-01)

**Phases completed:** 3 phases, 5 plans, 11 tasks

**Key accomplishments:**

- Shared flags.py module with upward directory traversal for .no-xxx detection, 12 TDD tests covering parent find, CLAUDE.md stop, root stop, max depth, and channel independence
- Replaced duplicated check_notification_flags() in notify.py and notify-attention.py with shared flags.py import; updated installer to deploy flags.py alongside notification scripts
- Global ~/.claude/.no-xxx fallback detection with project-level priority, 6-key return dict, and 4 new test cases
- --global flag for notify-enable/disable commands operating on ~/.claude/.no-xxx, plus notify-status showing project-level vs global source annotation via check_notification_flags()
- diagnose_configuration() section [2] updated to use check_notification_flags() with project-level and global source labels, plus 5 new TDD tests verifying display output

---

## v1.5 NPX Uninstall Support (Shipped: 2026-03-30)

**Phases completed:** 23 phases, 45 plans, 89 tasks

**Key accomplishments:**

- Problem:
- Problem:
- Test contracts established for Python dependency auto-installation with 16 test cases defining expected behavior
- One-liner:
- One-liner:
- One-liner:
- Marketplace Integration Flow (installer/src/marketplace/index.js)
- Created 4 TDD test scaffold files with 18 test cases for verification module development, establishing test-first pattern for Phase 19
- Dual-source Pushover credential detection with registry fallback and per-item Confirm interaction
- Git user configurator enhanced with per-item Confirm prompts for keep/re-enter, supporting 4 cases (both, only name, only email, neither) with unified save logic
- 14 integration tests verifying UFLOW-01 (fresh install) and UFLOW-02 (re-run) detection and case-mapping logic across pushover, git-user, and git-ssh configurators
- 7-step fault-tolerant removal execution (remover.js) and colored ASCII result table (reporter.js) as independent testable modules
- Full uninstall flow orchestration: enquirer Confirm with default-No safety, detect->confirm->remove->report pipeline, and CLI routing from runUninstallDetection to runUninstall

---

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
