# S01: 目录结构与配置修复 — Research

**Date:** 2026-04-20

## Summary

S01 是纯粹的目录重组和引用修复工作，不涉及功能逻辑变更。当前 8 个 codepoint 子技能（codepoint-implement、codepoint-instrument、codepoint-plan、codepoint-run、codepoint-scan、codepoint-test-plan、codepoint-validate、codepoint-verify）平铺在项目根目录，需要用 `git mv` 移入 `codepoint/` 下。同时删除 6 个过时的根级文件/目录（.claude-plugin/marketplace.json、scripts/、pytest.ini、tests/、INSTALLATION.md、INSTALLATION.zh.md、QUICK-START.md），以及修正所有 SKILL.md 中的 `../codepoint/` 路径引用和 `plugins/` 过时引用。

所有 11 个 SKILL.md 当前已通过 `skills-ref validate`。`npx skills add . --list` 发现 12 个技能（包括从 node_modules 来的 playwright-cli），移动后根级应为 3 个。风险集中在路径引用修复的完整性——遗漏任何一处 `../codepoint/` 引用会导致子技能找不到 references/ 和 templates/。

## Recommendation

分两步执行：先 `git mv` 移动 8 个 codepoint 子技能到 codepoint/ 下，然后批量修复路径引用（`../codepoint/references/` → `../references/`、`../codepoint/templates/` → `../templates/`、`plugins/` 引用）。每步后运行 `skills-ref validate` 验证。使用 PowerShell `rg` 搜索确认无遗漏引用。

## Implementation Landscape

### Key Files

#### 需要移动的目录（8 个 codepoint 子技能，每个只有 SKILL.md）

- `codepoint-implement/` — 移入 codepoint/ 下
- `codepoint-instrument/` — 移入 codepoint/ 下
- `codepoint-plan/` — 移入 codepoint/ 下
- `codepoint-run/` — 移入 codepoint/ 下
- `codepoint-scan/` — 移入 codepoint/ 下
- `codepoint-test-plan/` — 移入 codepoint/ 下
- `codepoint-validate/` — 移入 codepoint/ 下
- `codepoint-verify/` — 移入 codepoint/ 下

#### 需要删除的文件/目录

- `.claude-plugin/marketplace.json` — 旧 marketplace 配置，指向 plugins/ 路径
- `scripts/` — clear-cache.bat 和 update-plugin-version.sh，过时脚本
- `pytest.ini` — 根级 pytest 配置（引用 claude-notify/tests 和 windows-git-commit/tests，但每个技能有自己的 tests）
- `tests/` — 根级测试（test_security_rules.py + e2e/codepoint-v2/ 测试项目）
- `INSTALLATION.md` — 旧安装文档（被 installer/ 取代）
- `INSTALLATION.zh.md` — 旧安装文档中文版
- `QUICK-START.md` — 旧快速开始文档

#### 需要修复路径引用的 SKILL.md（移动后）

- `codepoint/codepoint-implement/SKILL.md` — 3 处 `../codepoint/references/` → `../references/`（golang.md、python.md、frontend.md）
- `codepoint/codepoint-instrument/SKILL.md` — 2 处 `../codepoint/references/` → `../references/`（data-model.md、frontend.md）
- `codepoint/codepoint-test-plan/SKILL.md` — 4 处 `../codepoint/references/` → `../references/`（test-probes.md）
- `codepoint/codepoint-verify/SKILL.md` — 1 处 `../codepoint/templates/` → `../templates/`（verification.md）

#### 需要修复 plugins/ 引用的文件

- `codepoint/codepoint-implement/SKILL.md` — 第 226 行 `git add plugins/codepoint/skills/implement/SKILL.md`
- `codepoint/codepoint-scan/SKILL.md` — 第 134 行 `git add plugins/codepoint/skills/scan/SKILL.md`
- `CLAUDE.md` — 第 44、49、54 行 plugins/ 引用（插件开发规范部分）

#### 不需要 S01 修改的文件（其他 slice 负责）

- `README.md`、`README.zh.md` — plugins/ 引用由 S03 处理
- `docs/` 下的文件 — plugins/ 引用由 S02 处理
- `.claude/commands/` — 属于 claude-notify 的功能命令，不动
- `codepoint/.claude-plugin/plugin.json`、`claude-notify/.claude-plugin/plugin.json`、`windows-git-commit/.claude-plugin/plugin.json` — 保留（skills-ref 不依赖它们，但 npx skills 可能读取）

### Build Order

1. **删除过时文件/目录** — 先清理垃圾，减少后续操作干扰
   - `git rm` 删除 .claude-plugin/marketplace.json、scripts/、pytest.ini、tests/、INSTALLATION.md、INSTALLATION.zh.md、QUICK-START.md
2. **移动 codepoint 子技能** — `git mv` 8 个子技能目录到 codepoint/ 下
3. **修复路径引用** — 在移动后的 SKILL.md 中更新相对路径
4. **修复 plugins/ 引用** — 在 codepoint 子技能 SKILL.md 和 CLAUDE.md 中
5. **验证** — 运行 `skills-ref validate` 所有 SKILL.md，`npx skills add . --list` 确认根级 3 个技能

### Verification Approach

```bash
# 1. 所有 SKILL.md 通过验证
npx skills-ref validate claude-notify
npx skills-ref validate windows-git-commit
npx skills-ref validate codepoint
npx skills-ref validate codepoint/codepoint-implement
npx skills-ref validate codepoint/codepoint-instrument
npx skills-ref validate codepoint/codepoint-plan
npx skills-ref validate codepoint/codepoint-run
npx skills-ref validate codepoint/codepoint-scan
npx skills-ref validate codepoint/codepoint-test-plan
npx skills-ref validate codepoint/codepoint-validate
npx skills-ref validate codepoint/codepoint-verify

# 2. 根级只发现 3 个技能
npx skills add . --list  # 应显示 claude-notify, codepoint, windows-git-commit

# 3. codepoint 子技能能被发现
npx skills add ./codepoint --list  # 应显示 8 个子技能

# 4. 无 plugins/ 过时引用
rg "plugins/" --type md -g "!.planning/**" -g "!installer/**" -g "!node_modules/**"
rg "../codepoint/" --type md

# 5. 过时文件已删除
test ! -f .claude-plugin/marketplace.json
test ! -d scripts/
test ! -f pytest.ini
test ! -d tests/
test ! -f INSTALLATION.md
test ! -f INSTALLATION.zh.md
test ! -f QUICK-START.md
```

## Constraints

- Windows 开发环境，使用 PowerShell 或 Git Bash
- `git mv` 保留文件历史，避免直接 `mv`
- 移动后 SKILL.md 的 `name` 字段不变（仍匹配目录名，保留 codepoint- 前缀）
- `codepoint/` 目录下已有 references/、templates/、.claude-plugin/ 等内容，移动后不冲突
- `.claude-plugin/plugin.json` 在 3 个根级技能内保留（npx skills 可能依赖）
- CLAUDE.md 不重写，只更新过时引用行（S01 范围限制）

## Common Pitfalls

- **遗漏路径引用** — 移动后 `../codepoint/references/` 变成 `../references/`，容易漏改。用 `rg "../codepoint/"` 全局搜索确认
- **pytest.ini 删除后影响技能内测试** — 不会。claude-notify/tests/ 和 windows-git-commit/tests/ 是技能内部测试，有自己 conftest.py，不依赖根级 pytest.ini
- **git mv 冲突** — codepoint/ 目录下已有文件（SKILL.md、references/、templates/），但 8 个子技能目录名不冲突，可以安全移入
- **npx skills add . --list 包含 node_modules 技能** — playwright-cli 来自 node_modules，这是已知行为。验证时应只关注根级 3 个技能

## Open Risks

- `npx skills add ./codepoint --list` 子技能发现未验证 —— 需要移动后实测确认嵌套结构是否被正确识别
- `.claude-plugin/plugin.json` 是否被 npx skills 读取 —— 当前 3 个根技能都有，移动后子技能不需要（没有 .claude-plugin/ 目录）
