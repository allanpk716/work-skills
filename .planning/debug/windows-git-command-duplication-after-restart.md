---
status: verifying
trigger: "用户重启 Claude Code 后再次看到 /windows-git-commit 命令重复显示 2 次,即使之前已经清理了插件缓存"
created: 2026-02-25T00:00:00.000Z
updated: 2026-02-25T00:15:00.000Z
---

## Current Focus

hypothesis: 修复已应用(marketplace.json 已更新,缓存已清理)
test: 用户重启 Claude Code,输入 '/' 查看命令列表
expecting: /windows-git-commit 命令只显示一次
next_action: 等待用户验证修复效果

## Symptoms

expected: /windows-git-commit 命令应该只显示一次
actual: 重启 Claude Code 后,/windows-git-commit 命令在斜杠命令列表中显示 2 次
errors: 无错误信息,只是命令重复显示
reproduction:
1. 清理插件缓存后命令正常(只显示一次)
2. 重启 Claude Code
3. 输入 '/' 查看斜杠命令列表
4. /windows-git-commit 又显示 2 次
started: 之前修复过一次(清理插件缓存),但重启后问题重现

## Eliminated

(暂无)

## Evidence

- timestamp: 2026-02-25T00:00:00Z
  checked: Claude 插件缓存目录
  found: 发现 3 个 wgc.md 命令文件:
    1. /c/Users/allan716/.claude/plugins/cache/work-skills/claude-notify/729d602a7231/.claude/commands/wgc.md
    2. /c/Users/allan716/.claude/plugins/cache/work-skills/claude-notify/dcdd22f53592/.claude/commands/wgc.md
    3. /c/Users/allan716/.claude/plugins/cache/work-skills/git-skills/dcdd22f53592/.claude/commands/wgc.md
  implication: **关键发现!** claude-notify 和 git-skills 两个插件都包含了 wgc.md 命令定义

- timestamp: 2026-02-25T00:05:00Z
  checked: marketplace.json 配置文件
  found: 两个插件的配置都使用 `"source": "./"` 指向同一个根目录:
    - git-skills: source="./", skills=["./skills/windows-git-commit"]
    - claude-notify: source="./", skills=["./skills/claude-notify"]
  implication: **根本原因!** 两个插件共享同一个源目录,而该目录包含 .claude/commands/wgc.md 文件,导致两个插件都加载了这个命令文件,使命令被注册了两次

- timestamp: 2026-02-25T00:10:00Z
  checked: 插件缓存中的 marketplace.json 文件
  found: git-skills 和 claude-notify 两个插件的缓存版本都包含了完整的 marketplace.json(包括两个插件配置)
  implication: Claude 插件系统为每个插件创建了完整的缓存副本,包括命令文件

- timestamp: 2026-02-25T00:15:00Z
  checked: 修改后的 marketplace.json
  found: 已将两个插件定义合并为一个 work-skills 插件,包含两个技能
  implication: 修复已应用,现在只有一个插件会加载 .claude/commands/wgc.md 文件

- timestamp: 2026-02-25T00:16:00Z
  checked: 插件缓存清理
  found: 已删除旧的 claude-notify 和 git-skills 插件缓存
  implication: 下次重启 Claude Code 时,将使用新的单一插件配置加载

## Resolution

root_cause: marketplace.json 中定义了两个插件(git-skills 和 claude-notify)都使用 source="./" 指向同一个根目录。当插件加载时,两个插件都会扫描并加载 .claude/commands/wgc.md 文件,导致该命令被注册两次,在斜杠命令列表中显示重复。

fix: 将两个技能合并到一个插件中,只定义一个 work-skills 插件,包含两个技能。这样命令文件只会被加载一次。

方案对比:
- 方案 A: 移动 wgc.md 到子目录 - 不推荐(命令文件必须在 .claude/commands/ 下)
- 方案 B: 分离 source 目录 - 不推荐(需要大规模重构)
- 方案 C: 合并为单一插件 - **已采用**(简单直接,符合实际使用场景)
- 方案 D: 删除 wgc.md - 不推荐(改变用户体验)

修改内容:
- 将 git-skills 和 claude-notify 两个插件定义合并为一个 work-skills 插件
- 新插件包含两个技能: ./skills/windows-git-commit 和 ./skills/claude-notify
- 这样 .claude/commands/wgc.md 只会被加载一次

verification: 待验证
files_changed: [.claude-plugin/marketplace.json]
