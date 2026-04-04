# Requirements: Work Skills v1.7

**Defined:** 2026-04-04
**Core Value:** 为 Windows 开发者提供即开即用的 Claude Code 技能,自动化重复性工作,让开发者专注于创造性任务

## v1 Requirements

### 项目根目录检测

- [ ] **PROJ-01**: `get_project_name()` 通过向上查找 `.git` 目录或 `CLAUDE.md` 文件定位项目根目录
- [ ] **PROJ-02**: 向上查找逻辑复用 flags.py 中的遍历模式（最大深度、根目录停止、CLAUDE.md 标记）
- [ ] **PROJ-03**: 找到项目根目录时返回该目录的文件夹名称作为项目名

### 集成

- [ ] **PROJ-04**: `notify.py` 的 `get_project_name()` 使用新的查找逻辑
- [ ] **PROJ-05**: `notify-attention.py` 的 `get_project_name()` 使用新的查找逻辑
- [ ] **PROJ-06**: 所有查找失败时回退到现有的 `os.getcwd()` 行为

### 测试

- [ ] **PROJ-07**: 向上查找项目根的 TDD 测试覆盖（子目录、嵌套项目、根目录等场景）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 使用 CLAUDE_PROJECT_DIR 环境变量 | 环境变量可能在某些场景不可用，文件系统检测更可靠 |
| 远程 Git 仓库名称获取 | 超出通知职责范围，本地文件夹名称已足够 |
| 自定义项目名称配置文件 | 过度设计，当前需求用文件夹名称即可 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROJ-01 | — | Pending |
| PROJ-02 | — | Pending |
| PROJ-03 | — | Pending |
| PROJ-04 | — | Pending |
| PROJ-05 | — | Pending |
| PROJ-06 | — | Pending |
| PROJ-07 | — | Pending |

**Coverage:**
- v1 requirements: 7 total
- Mapped to phases: 0
- Unmapped: 7 ⚠️

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after initial definition*
