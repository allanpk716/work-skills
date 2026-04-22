# S02 Research: 文档重组

## Current docs/ Structure

```
docs/
├── README.md                    (插件开发指南索引, 大量 plugins/ 引用)
├── HOW_TO_ADD_NEW_SKILL.md      (添加技能指南, 引用 plugins/ 结构)
├── PROJECT_STRUCTURE.md         (项目结构说明, 引用 plugins/ 结构)
├── plugin-development-best-practices.md   (插件最佳实践, 大量 plugins/ 路径)
├── plugin-quick-reference.md    (插件快速参考, 大量 plugins/ 路径)
├── plugin-version-management.md (版本管理, 引用 plugins/ 目录)
├── bugs/
│   └── README.md                (空模板, 无 bug 记录)
├── fixes/
│   ├── plugin-best-practices-documentation.md  (文档创建记录, 引用 plugins/)
│   ├── windows-git-commit-bash-agent-fix.md    (wgc 修复)
│   └── windows-git-commit-duplicate-commands-fix.md  (wgc 修复, 引用 plugins/)
├── plans/
│   ├── README.md                (空模板)
│   ├── 2026-02-25-multi-turn-interaction-notification-design.md  (claude-notify 计划)
│   └── 2026-02-25-multi-turn-interaction-notification.md        (claude-notify 计划)
├── research/
│   └── codepoint/               (codepoint 研究资料, 含 images/ 和 workspace/)
│       ├── 2026-04-17-methodology.md
│       ├── 2026-04-19-design-review.md  (引用 plugins/ 路径)
│       ├── 2026-04-19-global-thinking.md
│       ├── images/              (4 JPG)
│       └── workspace/           (eval 输出, 含 pyc 文件)
├── superpowers/                 ← 需要重命名为 codepoint/
│   ├── plans/
│   │   ├── 2026-04-17-codepoint-integration.md
│   │   ├── 2026-04-18-codepoint-subagent-log-analysis.md
│   │   └── 2026-04-18-codepoint-v2-redesign.md
│   └── specs/
│       ├── 2026-04-17-codepoint-integration-design.md
│       └── 2026-04-18-codepoint-v2-redesign.md
└── verification/
    └── independent-plugin-structure.md  (引用 plugins/ 结构, 历史验证报告)
```

## Categorization Plan

### docs/claude-notify/
| Source | Target | Notes |
|--------|--------|-------|
| `docs/plans/2026-02-25-multi-turn-interaction-notification-design.md` | `docs/claude-notify/plans/2026-02-25-multi-turn-interaction-notification-design.md` | claude-notify 计划 |
| `docs/plans/2026-02-25-multi-turn-interaction-notification.md` | `docs/claude-notify/plans/2026-02-25-multi-turn-interaction-notification.md` | claude-notify 计划 |

### docs/windows-git-commit/
| Source | Target | Notes |
|--------|--------|-------|
| `docs/fixes/windows-git-commit-bash-agent-fix.md` | `docs/windows-git-commit/fixes/bash-agent-fix.md` | wgc 修复 |
| `docs/fixes/windows-git-commit-duplicate-commands-fix.md` | `docs/windows-git-commit/fixes/duplicate-commands-fix.md` | wgc 修复 |

### docs/codepoint/  (rename from docs/superpowers/)
| Source | Target | Notes |
|--------|--------|-------|
| `docs/superpowers/` (整个目录) | `docs/codepoint/` | git mv 保留历史 |
| `docs/research/codepoint/` (整个目录) | `docs/codepoint/research/` | 已有正确归类前缀 |

### docs/project/
| Source | Target | Notes |
|--------|--------|-------|
| `docs/plugin-development-best-practices.md` | `docs/project/plugin-development-best-practices.md` | 通用项目开发指南 |
| `docs/plugin-quick-reference.md` | `docs/project/plugin-quick-reference.md` | 通用项目快速参考 |
| `docs/plugin-version-management.md` | `docs/project/plugin-version-management.md` | 通用版本管理 |
| `docs/HOW_TO_ADD_NEW_SKILL.md` | `docs/project/how-to-add-new-skill.md` | 通用添加技能指南 |
| `docs/PROJECT_STRUCTURE.md` | `docs/project/structure.md` | 项目结构说明 |
| `docs/fixes/plugin-best-practices-documentation.md` | `docs/project/fixes/best-practices-documentation.md` | 文档创建记录 |
| `docs/verification/independent-plugin-structure.md` | `docs/project/verification/independent-plugin-structure.md` | 历史验证报告 |
| `docs/bugs/README.md` | `docs/project/bugs/README.md` | 空模板, 保留 |
| `docs/plans/README.md` | `docs/project/plans/README.md` | 空模板, 保留 |

## plugins/ References in docs/

13 files contain `plugins/` references. All are historical documentation — plans, specs, fixes, and guides written before the S01 restructure from `plugins/` to flat root layout.

**Files with plugins/ references:**
1. `docs/fixes/plugin-best-practices-documentation.md` — historical fix record
2. `docs/fixes/windows-git-commit-duplicate-commands-fix.md` — historical fix record
3. `docs/plans/2026-02-25-multi-turn-interaction-notification.md` — historical plan
4. `docs/plugin-development-best-practices.md` — active guide (needs update)
5. `docs/plugin-quick-reference.md` — active guide (needs update)
6. `docs/plugin-version-management.md` — active guide (needs update)
7. `docs/README.md` — index page (will be rewritten)
8. `docs/research/codepoint/2026-04-19-design-review.md` — historical research
9. `docs/superpowers/plans/*` (3 files) — historical plans
10. `docs/superpowers/specs/*` (2 files) — historical specs
11. `docs/verification/independent-plugin-structure.md` — historical verification

**Recommendation:** Historical docs (fixes, plans, specs, verification, research) should keep their original content unchanged — they document what happened at the time. The 3 active guides (plugin-development-best-practices.md, plugin-quick-reference.md, plugin-version-management.md) should have plugins/ paths updated to reflect current flat root structure (`claude-notify/`, `windows-git-commit/`, `codepoint/`). R003 (supporting) makes this S02's partial responsibility.

## Implementation Landscape

### Git moves (preserve history):
```
git mv docs/superpowers docs/codepoint
git mv docs/research/codepoint docs/codepoint/research
```

### File moves (reorganization):
```
# claude-notify docs
git mv docs/plans/2026-02-25-*.md docs/claude-notify/plans/

# windows-git-commit docs
git mv docs/fixes/windows-git-commit-*.md docs/windows-git-commit/fixes/

# project docs
git mv docs/plugin-*.md docs/project/
git mv docs/HOW_TO_ADD_NEW_SKILL.md docs/project/how-to-add-new-skill.md
git mv docs/PROJECT_STRUCTURE.md docs/project/structure.md
git mv docs/verification docs/project/verification/
git mv docs/bugs docs/project/bugs/
git mv docs/plans docs/project/plans/
```

### Cleanup:
- Delete `docs/superpowers/` → `docs/codepoint/` (git mv)
- After all moves, old `docs/plans/`, `docs/fixes/`, `docs/bugs/`, `docs/verification/` directories should be empty and can be removed
- Delete `docs/plans/README.md` (empty template) → moved to `docs/project/plans/`
- Delete `docs/bugs/README.md` (empty template) → moved to `docs/project/bugs/`

### docs/README.md rewrite:
Replace entirely with a skill-category index:
```markdown
# 文档索引

## claude-notify
- [计划文档](./claude-notify/plans/)

## windows-git-commit
- [修复记录](./windows-git-commit/fixes/)

## codepoint
- [计划文档](./codepoint/plans/)
- [设计规格](./codepoint/specs/)
- [研究资料](./codepoint/research/)

## 项目通用
- [插件开发最佳实践](./project/plugin-development-best-practices.md)
- [快速参考卡片](./project/plugin-quick-reference.md)
- [版本管理](./project/plugin-version-management.md)
- [添加新技能](./project/how-to-add-new-skill.md)
- [项目结构](./project/structure.md)
- [验证记录](./project/verification/)
- [Bug 记录](./project/bugs/)
- [计划模板](./project/plans/)
```

### Risk: Low
Straightforward file reorganization. No code changes. git mv preserves history. Historical docs keep original content.

### Estimated tasks: 2-3
1. Git moves and directory restructuring
2. docs/README.md rewrite + plugins/ reference cleanup in active guides (R003 partial)
3. Verification — confirm directory structure matches acceptance criteria
