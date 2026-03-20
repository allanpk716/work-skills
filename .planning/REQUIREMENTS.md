# Requirements: Work Skills v1.2

**Defined:** 2026-03-19
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务

## v1 Requirements (Milestone v1.2: 修复首次安装问题)

本里程碑创建独立的 npx 安装器,实现一步到位的安装体验,包括环境检测、交互式配置引导和安装后验证。

### 安装器核心

- [x] **INST-01**: 用户可以通过 `npx @allanpk716/work-skills-setup` 运行独立安装器
- [x] **INST-02**: 安装器检测运行环境是否为 Windows 系统
- [ ] **INST-03**: 安装器提供中英文双语支持
- [ ] **INST-04**: 安装器显示欢迎信息和功能介绍
- [ ] **INST-05**: 安装器提供 --help 和 --version 命令行选项

### 环境依赖检测

- [x] **ENV-01**: 安装器检测 Python 3.8+ 是否已安装
- [x] **ENV-02**: 安装器检测 Git 是否已安装
- [x] **ENV-03**: 安装器检测 TortoiseGit 或 PuTTY 是否已安装 (用于 SSH 认证)
- [x] **ENV-04**: 安装器检测 requests Python 库是否已安装
- [x] **ENV-05**: 检测结果显示清晰的通过/失败状态和版本信息
- [x] **ENV-06**: 缺少依赖时显示安装指导信息

### 交互式配置引导

- [ ] **CONF-01**: 安装器检测 PUSHOVER_TOKEN 环境变量是否已设置
- [ ] **CONF-02**: 安装器检测 PUSHOVER_USER 环境变量是否已设置
- [ ] **CONF-03**: Pushover 未配置时提供交互式引导输入 (可选跳过)
- [ ] **CONF-04**: 引导用户将 Pushover 配置写入系统环境变量 (setx)
- [ ] **CONF-05**: 安装器检测 Git SSH 配置 (core.sshCommand)
- [ ] **CONF-06**: Git SSH 未配置时提供配置引导
- [ ] **CONF-07**: 安装器检测 Git 用户信息 (user.name, user.email)

### Python 依赖安装

- [ ] **DEPS-01**: 安装器提供自动安装缺失 Python 库的选项
- [ ] **DEPS-02**: 使用 pip 安装 requests 库 (如缺失)
- [ ] **DEPS-03**: 安装失败时显示错误信息和解决建议

### 技能市场集成

- [ ] **MKT-01**: 安装器将 work-skills 添加为 Claude Code 技能市场
- [ ] **MKT-02**: 安装器显示可用插件列表 (claude-notify, windows-git-commit)
- [ ] **MKT-03**: 安装器提供安装插件的选项

### 安装验证

- [ ] **VER-01**: 安装完成后自动运行 verify-installation.py 验证
- [ ] **VER-02**: 验证结果显示通过/失败状态摘要
- [ ] **VER-03**: 验证失败时显示具体问题和解决建议
- [ ] **VER-04**: 提供手动重新验证的命令提示

## v2 Requirements

未来版本考虑的功能:

### 高级功能

- **INST-ADV-01**: 支持静默安装模式 (--quiet)
- **INST-ADV-02**: 支持配置文件导出/导入
- **INST-ADV-03**: 支持卸载/重置功能
- **INST-ADV-04**: 支持自动更新检测

## Out of Scope

明确排除的功能:

| Feature | Reason |
|---------|--------|
| Linux/macOS 支持 | 项目专注于 Windows 开发环境 |
| 自动下载安装 Python/Git | 超出安装器职责范围,只提供检测和指导 |
| GUI 安装界面 | CLI 交互已足够,GUI 增加复杂度 |
| 自动配置 Pageant 密钥 | 需要用户手动操作,安全考虑 |
| 检测所有 Python 库 | 只检测必要依赖,避免过度检查 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 14 | Complete |
| INST-02 | Phase 14 | Complete |
| INST-03 | Phase 14 | Pending |
| INST-04 | Phase 14 | Pending |
| INST-05 | Phase 14 | Pending |
| ENV-01 | Phase 15 | Complete |
| ENV-02 | Phase 15 | Complete |
| ENV-03 | Phase 15 | Complete |
| ENV-04 | Phase 15 | Complete |
| ENV-05 | Phase 15 | Complete |
| ENV-06 | Phase 15 | Complete |
| DEPS-01 | Phase 16 | Pending |
| DEPS-02 | Phase 16 | Pending |
| DEPS-03 | Phase 16 | Pending |
| CONF-01 | Phase 17 | Pending |
| CONF-02 | Phase 17 | Pending |
| CONF-03 | Phase 17 | Pending |
| CONF-04 | Phase 17 | Pending |
| CONF-05 | Phase 17 | Pending |
| CONF-06 | Phase 17 | Pending |
| CONF-07 | Phase 17 | Pending |
| MKT-01 | Phase 18 | Pending |
| MKT-02 | Phase 18 | Pending |
| MKT-03 | Phase 18 | Pending |
| VER-01 | Phase 19 | Pending |
| VER-02 | Phase 19 | Pending |
| VER-03 | Phase 19 | Pending |
| VER-04 | Phase 19 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-19*
*Last updated: 2026-03-19 after roadmap creation*
