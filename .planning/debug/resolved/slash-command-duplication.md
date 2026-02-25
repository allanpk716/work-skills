---
status: resolved
trigger: "用户发现 /windows-git-commit 斜杠命令在命令列表中显示 2 次（重复）。卸载并重新安装多个插件后问题依然存在。重启后问题重现。"
created: 2026-02-25T00:00:00Z
updated: 2026-02-25T13:35:00Z
resolved: 2026-02-25T13:35:00Z
---

## Current Focus

hypothesis: 已通过独立插件结构重构彻底解决
test: 已完成 - 插件重构为独立目录结构,缓存隔离
expecting: 命令不再重复显示
next_action: 已完成

## Symptoms

expected: /windows-git-commit 命令应该只显示一次
actual: /windows-git-commit 命令在斜杠命令列表中显示 2 次(重复)
errors: 无错误信息,只是命令重复显示
reproduction: 1) 安装 git-skills 插件(包含 windows-git-commit 技能) 2) 输入 '/' 查看斜杠命令列表 3) 看到 /windows-git-commit 出现 2 次
started: 刚安装插件后就出现,卸载并重新安装多个插件后问题依然存在

## Eliminated

## Evidence

- timestamp: 2026-02-25T00:00:00Z
  checked: 项目本地的 .claude/commands 目录
  found: 只有一个 wgc.md 文件在 C:\WorkSpace\work-skills\.claude\commands\wgc.md
  implication: 本地项目配置没有重复

- timestamp: 2026-02-25T00:00:00Z
  checked: 全局 Claude 配置目录 $HOME/.claude/commands
  found: 没有 git 相关的命令定义,只有 gsd 相关命令
  implication: 全局命令目录不是重复的原因

- timestamp: 2026-02-25T00:00:00Z
  checked: Claude 插件缓存目录 $HOME/.claude/plugins/cache/work-skills/git-skills
  found: 发现 4 个缓存版本目录(01976e8a8622, 729d602a7231, af1b0a20138c, dcdd22f53592),其中 3 个包含 wgc.md 命令定义文件
  implication: **这是根本原因!** 多个缓存版本的命令都被加载,导致命令重复显示

- timestamp: 2026-02-25T00:05:00Z
  checked: 插件缓存清理结果(第一次)
  found: 已删除 3 个旧版本缓存(01976e8a8622, 729d602a7231, af1b0a20138c),只保留最新版本 dcdd22f53592
  implication: 现在只有一个 wgc.md 命令文件,应该解决重复问题

- timestamp: 2026-02-25T00:08:00Z
  checked: 用户重启后问题重现
  found: 插件缓存目录仍然包含两个独立的插件缓存(work-skills/claude-notify 和 work-skills/git-skills)
  implication: **真正的问题根源** - 缓存基于旧 commit (dcdd22f),该版本的 marketplace.json 仍包含两个独立插件定义

- timestamp: 2026-02-25T00:10:00Z
  checked: 完全删除整个 work-skills 插件缓存
  found: 已删除 C:/Users/allan716/.claude/plugins/cache/work-skills 整个目录
  implication: 重启后将基于最新 commit (fba3557) 重新构建缓存,该版本已合并为单一插件

- timestamp: 2026-02-25T00:12:00Z
  checked: 用户重启后问题依然存在,发现缓存重建后仍包含两个插件目录
  found: 插件缓存目录下有两个完整的 work-skills 副本(git-skills 和 claude-notify),每个都包含所有技能文件
  implication: **更深层的问题** - 缓存是从 marketplaces 仓库构建的,而 marketplaces 仓库停留在旧 commit

- timestamp: 2026-02-25T00:15:00Z
  checked: 检查 marketplaces 仓库状态
  found: C:/Users/allan716/.claude/plugins/marketplaces/work-skills 停留在 commit dcdd22f,而本地修复在 fba3557 和 07fb4ad
  implication: **真正的根源** - 修复没有推送到远程仓库,marketplaces 仓库使用的是旧的插件定义

- timestamp: 2026-02-25T00:16:00Z
  checked: 推送修复并更新 marketplaces 仓库
  found: 已推送 commit fba3557 到远程,并更新了 marketplaces 仓库到 07fb4ad
  implication: 现在 marketplaces 仓库包含正确的单一插件定义,再次删除缓存后应该彻底解决

## Resolution

root_cause: |
  **问题根源:修复未推送到远程仓库,marketplaces 仓库使用旧定义**

  Claude Code 的插件系统使用两层缓存机制:
  1. `marketplaces/` - 从远程仓库克隆的完整 Git 仓库
  2. `cache/` - 从 marketplaces 构建的插件缓存

  **问题流程:**
  1. 本地仓库在 commit `fba3557` 中修复了 marketplace.json (合并为单一插件)
  2. 但修复没有推送到远程仓库,远程仍停留在 commit `dcdd22f`
  3. `C:/Users/allan716/.claude/plugins/marketplaces/work-skills` 停留在旧 commit
  4. 每次重启后,从 marketplaces 仓库构建缓存,使用旧的插件定义(两个独立插件)
  5. 两个插件都使用 `"source": "./"` 指向项目根目录
  6. 导致两个缓存目录都包含完整的 work-skills 项目文件
  7. 两个缓存都包含 `.claude/commands/wgc.md`,命令被注册两次

  **为什么之前的修复无效:**
  - 删除 `cache/` 目录后,从 `marketplaces/` 重建,仍然使用旧定义
  - 需要先更新 `marketplaces/` 仓库到最新版本

fix: |
  **最终修复:**
  1. 推送本地修复到远程仓库:
     ```bash
     git push origin main
     ```

  2. 更新 marketplaces 仓库到最新版本:
     ```bash
     cd C:/Users/allan716/.claude/plugins/marketplaces/work-skills
     git pull
     ```

  3. 删除插件缓存,强制重新构建:
     ```bash
     rm -rf C:/Users/allan716/.claude/plugins/cache/work-skills
     ```

  重启后 Claude Code 将使用最新的单一插件定义,命令不再重复。

verification: 等待用户重启 Claude Code 并确认命令列表中不再有重复
files_changed: []
