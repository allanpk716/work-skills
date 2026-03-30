# Phase 22: Plugin Structure Fix - Research

**Researched:** 2026-03-29
**Domain:** Plugin directory restructuring for installer compatibility
**Confidence:** HIGH

## Summary

windows-git-commit 插件的 SKILL.md 文件位于 `skills/windows-git-commit/SKILL.md`(嵌套两层),而 claude-notify 的 SKILL.md 位于插件根目录 `SKILL.md`(扁平结构)。安装器 `isPluginInstalled()` 在 `~/.claude/skills/<name>/SKILL.md` 路径检测 SKILL.md 是否存在。安装器使用 `fs.cpSync()` 将整个插件源目录递归复制到 `~/.claude/skills/<name>/`,导致 windows-git-commit 的 SKILL.md 最终位于 `~/.claude/skills/windows-git-commit/skills/windows-git-commit/SKILL.md`,无法被检测到。

**Primary recommendation:** 将 windows-git-commit 插件的 `skills/windows-git-commit/` 子目录内容提升到插件根目录,使 SKILL.md 位于根层级,与 claude-notify 结构一致。同时更新 SKILL.md 内部的硬编码路径引用和 pre-commit hook 中的路径计算逻辑。

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STRUCT-01 | windows-git-commit 插件结构与安装器检测逻辑保持一致 | 将 SKILL.md 提升到插件根目录,使 `isPluginInstalled()` 的检测路径 `~/.claude/skills/<name>/SKILL.md` 能命中 |
| STRUCT-02 | 所有插件的 SKILL.md 安装后都在 `~/.claude/skills/<name>/SKILL.md` 路径可访问 | 安装器使用 `fs.cpSync(sourcePath, targetPath, {recursive: true})` 复制整个插件源目录,源目录根必须包含 SKILL.md |
</phase_requirements>

## Architecture Patterns

### Current Structure (PROBLEM)

```
plugins/windows-git-commit/
  +-- .claude-plugin/plugin.json
  +-- security-scanner/requirements.txt     # 根级别的 Python 依赖声明
  +-- skills/
       +-- windows-git-commit/              # 嵌套的 skill 目录
            +-- SKILL.md                    # <-- SKILL.md 在两层嵌套之下
            +-- hooks/pre-commit
            +-- scanner/
            |    +-- executor.py
            |    +-- ...
            +-- tests/
                 +-- ...
```

安装后变成:
```
~/.claude/skills/windows-git-commit/
  +-- .claude-plugin/plugin.json
  +-- security-scanner/requirements.txt
  +-- skills/
       +-- windows-git-commit/
            +-- SKILL.md                    # <-- isPluginInstalled 找不到!
```

`isPluginInstalled()` 查找: `~/.claude/skills/windows-git-commit/SKILL.md` -- 不存在

### Target Structure (FIX)

```
plugins/windows-git-commit/
  +-- .claude-plugin/plugin.json
  +-- SKILL.md                              # <-- 根层级,与 claude-notify 一致
  +-- hooks/pre-commit
  +-- scanner/
  |    +-- executor.py
  |    +-- ...
  +-- security-scanner/requirements.txt
  +-- tests/
       +-- ...
```

安装后变成:
```
~/.claude/skills/windows-git-commit/
  +-- .claude-plugin/plugin.json
  +-- SKILL.md                              # <-- isPluginInstalled 能找到!
  +-- hooks/pre-commit
  +-- scanner/
  +-- ...
```

### Reference: claude-notify Structure (WORKING)

```
plugins/claude-notify/
  +-- .claude-plugin/plugin.json
  +-- SKILL.md                              # 根层级 -- 正确
  +-- hooks/
  +-- scripts/
  +-- tests/
```

安装后:
```
~/.claude/skills/claude-notify/
  +-- .claude-plugin/plugin.json
  +-- SKILL.md                              # 检测成功
  +-- hooks/
  +-- scripts/
  +-- tests/
```

## Root Cause Analysis

### 安装器安装流程 (plugin-installer.js)

```javascript
// 第 57-64 行
const sourcePath = path.join(tempDir, plugin.source.replace('./', ''));
// sourcePath = "<temp>/plugins/windows-git-commit"

const targetPath = path.join(getSkillsDir(), plugin.name);
// targetPath = "~/.claude/skills/windows-git-commit"

fs.cpSync(sourcePath, targetPath, { recursive: true });
// 复制整个 plugins/windows-git-commit/ 目录内容到 targetPath
```

marketplace.json 中的 source 为 `"./plugins/windows-git-commit"`,安装器复制该目录的所有内容到 `~/.claude/skills/windows-git-commit/`。

### 检测逻辑 (plugin-installer.js)

```javascript
// 第 26-29 行
function isPluginInstalled(pluginName) {
  const skillPath = path.join(getSkillsDir(), pluginName, 'SKILL.md');
  return fs.existsSync(skillPath);
}
```

检测路径: `~/.claude/skills/windows-git-commit/SKILL.md`
实际路径: `~/.claude/skills/windows-git-commit/skills/windows-git-commit/SKILL.md`

路径不匹配,所以永远返回 false。

## Files Requiring Changes

### 1. 目录结构重组 (文件移动)

| 操作 | 源路径 | 目标路径 |
|------|--------|----------|
| 移动 | `plugins/windows-git-commit/skills/windows-git-commit/SKILL.md` | `plugins/windows-git-commit/SKILL.md` |
| 移动 | `plugins/windows-git-commit/skills/windows-git-commit/hooks/` | `plugins/windows-git-commit/hooks/` |
| 移动 | `plugins/windows-git-commit/skills/windows-git-commit/scanner/` | `plugins/windows-git-commit/scanner/` |
| 移动 | `plugins/windows-git-commit/skills/windows-git-commit/tests/` | `plugins/windows-git-commit/tests/` |
| 删除 | `plugins/windows-git-commit/skills/` | (删除空的嵌套目录) |

注意: `security-scanner/requirements.txt` 已在根目录,保持不动。

### 2. SKILL.md 内部路径引用更新

SKILL.md 中有两处硬编码路径需要更新:

**第 202 行:**
```
1. Open `plugins/windows-git-commit/skills/windows-git-commit/SKILL.md`
```
改为:
```
1. Open `plugins/windows-git-commit/SKILL.md`
```

**第 851 行:**
```
cp plugins/windows-git-commit/skills/windows-git-commit/hooks/pre-commit .git/hooks/pre-commit
```
改为:
```
cp plugins/windows-git-commit/hooks/pre-commit .git/hooks/pre-commit
```

### 3. Pre-commit Hook 路径逻辑

`hooks/pre-commit` 第 22-24 行:
```python
hook_dir = Path(__file__).parent
skill_root = hook_dir.parent  # windows-git-commit skill root
sys.path.insert(0, str(skill_root))
```

**重组前:** hook 在 `skills/windows-git-commit/hooks/pre-commit`,所以 `hook_dir.parent` = `skills/windows-git-commit/` (包含 scanner 的正确根)

**重组后:** hook 在 `hooks/pre-commit`,所以 `hook_dir.parent` = 插件根目录 (仍包含 scanner 的正确根)

结论: pre-commit hook 中的路径计算逻辑**无需修改**,因为 `Path(__file__).parent.parent` 在重组后仍然正确指向包含 scanner 的目录。但需要验证 `__pycache__` 缓存不会干扰。

### 4. Python 模块中的相对导入

scanner 目录下所有 Python 文件使用相对导入 (如 `from scanner.executor import run_pre_commit_scan`),只要 scanner 目录在插件根目录下,导入路径不会改变。

## Common Pitfalls

### Pitfall 1: __pycache__ 缓存干扰
**What goes wrong:** 移动 Python 文件后,`.pyc` 缓存文件仍指向旧路径,可能导致 import 错误
**Why it happens:** Python 编译的字节码缓存包含源文件路径
**How to avoid:** 移动文件后删除所有 `__pycache__` 目录
**Warning signs:** 移动后运行 hook 时出现 `ImportError` 或 `ModuleNotFoundError`

### Pitfall 2: Git 历史断裂
**What goes wrong:** 使用简单的 `mv` + `git add` 会导致 Git 无法追踪文件重命名,丢失历史
**Why it happens:** Git 不会自动检测跨目录的文件移动
**How to avoid:** 使用 `git mv` 命令移动文件,Git 能更好地追踪重命名历史
**Warning signs:** `git log --follow` 无法追踪移动文件的完整历史

### Pitfall 3: 已安装插件的用户需重新安装
**What goes wrong:** 用户已安装的旧结构插件不会被自动更新
**Why it happens:** `~/.claude/skills/windows-git-commit/` 仍然保留旧的嵌套结构
**How to avoid:** 此 Phase 只修改源码结构,Phase 23 处理安装检测逻辑,会覆盖安装
**Warning signs:** 本地开发环境中的插件加载路径可能需要清理缓存

### Pitfall 4: 测试文件中的路径引用
**What goes wrong:** 测试文件中可能硬编码了 `skills/windows-git-commit/` 路径前缀
**Why it happens:** 测试可能引用了相对于旧结构的路径
**How to avoid:** 搜索并更新所有测试中的路径引用
**Warning signs:** `pytest` 运行时出现 `FileNotFoundError`

### Pitfall 5: CLAUDE.md 中的插件开发规范可能冲突
**What goes wrong:** CLAUDE.md 指示使用 `plugins/<name>/skills/<skill>/SKILL.md` 结构,但此次修改将 SKILL.md 提升到根目录
**Why it happens:** CLAUDE.md 中的开发规范与实际安装器需求不一致
**How to avoid:** 注意此处是安装器复制后的结构问题,源码结构变化后 CLAUDE.md 的规范描述也需要相应更新或注明例外
**Warning signs:** 开发者按 CLAUDE.md 规范新建插件时可能重复此问题

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 目录移动 | 手动创建/删除目录 | `git mv` | 保留 Git 历史追踪 |
| __pycache__ 清理 | 手动逐个删除 | `find . -type d -name __pycache__ -exec rm -rf {} +` | 避免遗漏 |
| 插件安装 | 手动复制文件到 ~/.claude/skills/ | 安装器的 `installPlugin()` | 确保与生产环境一致 |

## Code Examples

### Git MV 操作序列

```bash
# 从嵌套目录提升到根目录
cd plugins/windows-git-commit

git mv skills/windows-git-commit/SKILL.md ./SKILL.md
git mv skills/windows-git-commit/hooks ./hooks
git mv skills/windows-git-commit/scanner ./scanner
git mv skills/windows-git-commit/tests ./tests

# 删除空的嵌套目录
rm -rf skills/

# 清理 Python 缓存
find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
```

### 验证 Pre-commit Hook 路径逻辑

```python
# hooks/pre-commit (第 22-24 行)
# 重组前: hooks/pre-commit 在 skills/windows-git-commit/hooks/pre-commit
#   hook_dir = .../skills/windows-git-commit/hooks
#   skill_root = .../skills/windows-git-commit (scanner 在此)

# 重组后: hooks/pre-commit 在 hooks/pre-commit
#   hook_dir = .../windows-git-commit/hooks
#   skill_root = .../windows-git-commit (scanner 仍在此)
# 结论: 路径计算逻辑不变,无需修改
hook_dir = Path(__file__).parent
skill_root = hook_dir.parent
sys.path.insert(0, str(skill_root))
```

### 验证安装检测

```bash
# 重组后安装,验证 SKILL.md 可被检测
# 模拟安装器的检测路径
SKILLS_DIR="$HOME/.claude/skills"
test -f "$SKILLS_DIR/windows-git-commit/SKILL.md" && echo "DETECT OK" || echo "DETECT FAIL"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SKILL.md 嵌套在 skills/<name>/ 子目录 | SKILL.md 位于插件根目录 | 本次修复 | 安装器检测逻辑无需修改 |

## Open Questions

1. **CLAUDE.md 插件开发规范是否需要更新?**
   - What we know: CLAUDE.md 指示使用 `plugins/<name>/skills/<skill>/SKILL.md` 结构
   - What's unclear: 是否应在此次 Phase 中一并更新 CLAUDE.md
   - Recommendation: 不在本次修改范围内,但应在后续考虑统一规范

2. **已安装用户的旧结构是否需要清理?**
   - What we know: `~/.claude/skills/windows-git-commit/` 仍有旧的嵌套结构
   - What's unclear: Phase 23 的安装检测修复是否会自动覆盖
   - Recommendation: Phase 23 重新安装时会覆盖整个目录,无需额外清理步骤

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (installer tests) / pytest (scanner tests) |
| Config file | `installer/jest.config.js` |
| Quick run command | `cd installer && npx jest --testPathPattern="plugin-installer" --no-coverage` |
| Full suite command | `cd installer && npx jest && cd ../plugins/windows-git-commit && python -m pytest tests/` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRUCT-01 | SKILL.md at plugin root after restructuring | manual verification | `test -f plugins/windows-git-commit/SKILL.md` | N/A (filesystem check) |
| STRUCT-02 | SKILL.md at ~/.claude/skills/<name>/SKILL.md after install | integration | `cd installer && npx jest --testPathPattern="plugin-installer"` | Wave 0 (existing tests) |

### Sampling Rate
- **Per task commit:** `test -f plugins/windows-git-commit/SKILL.md`
- **Per wave merge:** `cd installer && npx jest --no-coverage`
- **Phase gate:** Full installer test suite green + filesystem verification

### Wave 0 Gaps
- None -- restructuring is primarily filesystem moves, existing installer tests cover detection logic

## Sources

### Primary (HIGH confidence)
- `installer/src/marketplace/plugin-installer.js` - 安装和检测逻辑源码分析
- `plugins/claude-notify/SKILL.md` - 正确结构的参考实现
- `plugins/windows-git-commit/skills/windows-git-commit/SKILL.md` - 当前有问题的结构
- `hooks/pre-commit` - 路径计算逻辑分析

### Secondary (MEDIUM confidence)
- `marketplace.json` - 插件配置和 source 路径定义
- `docs/plugin-development-best-practices.md` - 插件开发规范
- `.claude/skills/windows-git-commit/` - 已安装插件的实际目录结构

## Metadata

**Confidence breakdown:**
- Root cause analysis: HIGH - 源码级别验证,安装器检测路径和实际文件位置完全确认
- Architecture: HIGH - claude-notify 作为参考实现,目标结构明确
- Pitfalls: HIGH - 基于 Python/Git 通用知识和项目特定代码分析
- File change list: HIGH - 基于目录扫描和 Grep 搜索确认

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable - structural change)
