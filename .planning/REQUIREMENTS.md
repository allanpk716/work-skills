# Requirements: Work Skills (v3.0 聚焦 claude-notify 重构)

**Defined:** 2026-06-26
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 通知技能 (claude-notify)

> 本里程碑为**瘦身重构**:移除 windows-git-commit 与 codepoint 两个技能,裁剪 NPX 安装器,使项目回归聚焦 claude-notify 的单一技能项目。不引入新功能。claude-notify 自身代码不动,仅作为回归验证对象。

## v1 Requirements

本里程碑 (v3.0) 需求。每条对应一个 roadmap 阶段。

### Removal — 移除已弃用技能

- [x] **REM-01**: windows-git-commit 技能目录及其全部内容 (scanner/、hooks/、references/、README、plugin.json) 从仓库删除
- [x] **REM-02**: codepoint 技能目录及其全部内容 (8 个子技能 + templates/ + references/ + README + plugin.json) 从仓库删除
- [x] **REM-03**: docs/codepoint 文档与调研工作区 (含 research/workspace、specs、plans、images) 删除;docs/claude-notify 保留
- [x] **REM-04**: 仓库内不再存在指向 windows-git-commit 或 codepoint 的残留引用 (README、README.zh、CHANGELOG、CLAUDE.md、package.json、installer 内的 i18n/路径)

### Installer — 裁剪安装器仅服务 claude-notify

- [x] **INS-01**: installer 不再检测/配置 git-ssh、git-user、TortoiseGit、PuTTY (移除 detectors/git.js、detectors/ssh-tools.js、configurators/git-ssh.js、configurators/git-user.js);保留 detectors/python.js、detectors/pip-package.js、configurators/pushover.js
- [x] **INS-02**: installer 不再运行多技能 marketplace 集成 (移除 marketplace/ 目录),claude-notify 的安装/hook 注册仅由现有 hooks/ 模块 (`runHooksInstallation`) 承担
- [x] **INS-03**: installer 卸载流程裁剪 — 移除与已删技能耦合的 uninstall/ 模块 (或裁剪为仅清理 claude-notify 通知组件),并相应移除/调整 `--uninstall` CLI 入口
- [x] **INS-04**: installer 的 i18n (en.json / zh.json) 与 welcome 横幅更新为单一技能 (claude-notify) 范围,移除 git/marketplace/多技能相关文案
- [ ] **INS-05**: installer 测试更新 — 删除已移除模块 (git/ssh 检测、git 配置、marketplace、uninstall) 的测试文件,更新剩余测试以匹配裁剪后契约;**验收门为"不引入新失败"**(相对 v3.0 前既有红色基线:10 failed suites / 8 failed tests,均为预存负债,out of scope,见 Out of Scope 表)。即 Phase 54 执行后,失败套件数 ≤ 基线中未被本阶段删除的套件数,且不出现裁剪引入的新失败

### Release — 元数据更新与发版

- [ ] **REL-01**: 根 README.md / README.zh.md 更新为单一技能 (claude-notify) 项目 (技能表格、项目结构、Quick Start 命令)
- [ ] **REL-02**: CHANGELOG.md 增加 v3.0.0 条目,记录移除的技能与安装器裁剪范围
- [ ] **REL-03**: 根 package.json 与 installer/package.json 版本同步升至 3.0.0,且与新建 git tag `v3.0` 保持一致 (遵循项目发布规范)
- [ ] **REL-04**: 重构后 claude-notify 的全部 Python 测试通过 (回归验证,确认移除未破坏 claude-notify)

## v2 Requirements

本里程碑无 v2 (未来) 需求 — 纯瘦身里程碑。

## Out of Scope

明确排除项,记录以防范围蔓延。

| Feature | Reason |
|---------|--------|
| claude-notify 功能改造 / 加固 | 本里程碑仅删除与裁剪,claude-notify 代码不动 (仅回归测试) |
| claude-notify git 跟踪的 __pycache__ 清理 | 属于 claude-notify 自身清理,本里程碑范围外 (用户选择"仅做删除") |
| 重写 installer 架构 | 仅做"裁剪",不重构 installer 设计;保留 CJS + 现有模块边界 |
| 保留 windows-git-commit / codepoint 中的任何子能力 | 用户明确不再使用,整体移除 |
| npm 包改名 / 重新发布策略变更 | 包名 `@allanpk716/work-skills-setup` 保留,仅升版本号 |
| Linux/macOS 支持 | 项目专注于 Windows 开发环境 |
| installer 预存测试失败修复 (bin.test CRLF / verification python 路径 / pushover+unified-flow process.exit IIFE) | v3.0 前既有负债 (基线 10 failed suites / 8 failed tests),与本里程碑裁剪无关;INS-05 验收门改为"不引入新失败"而非"全部通过"。codex+opencode 复核 cycle 1 发现并经用户确认 out of scope |

## Traceability

各阶段覆盖的需求。roadmap 创建时填写。

| Requirement | Phase | Status |
|-------------|-------|--------|
| REM-01 | Phase 53 | Complete |
| REM-02 | Phase 53 | Complete |
| REM-03 | Phase 53 | Complete |
| REM-04 | Phase 53 | Complete |
| INS-01 | Phase 54 | Complete |
| INS-02 | Phase 54 | Complete |
| INS-03 | Phase 54 | Complete |
| INS-04 | Phase 54 | Complete |
| INS-05 | Phase 54 | Pending |
| REL-01 | Phase 55 | Pending |
| REL-02 | Phase 55 | Pending |
| REL-03 | Phase 55 | Pending |
| REL-04 | Phase 55 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-26*
*Last updated: 2026-06-26 — Traceability filled after M015 v3.0 roadmap creation (Phase 53-55)*
