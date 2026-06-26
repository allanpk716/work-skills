# Design: 使用文档对齐 v3.0 现实

**Date:** 2026-06-26
**Goal:** 将 claude-notify 的使用文档与 v3.0 单技能项目现实对齐 — 清理过期的 marketplace 措辞、补齐 installer 作为备选安装方式、修正根 README 项目结构。
**Approach chosen:** B — 平衡对齐 (focused, not a rewrite)

## Context

v3.0 里程碑 (shipped 2026-06-26) 将项目从多技能集合瘦身回归为单一 claude-notify 技能项目,并裁剪了 NPX 安装器 (移除 marketplace/、git/ssh detectors+configurators)。但 claude-notify 的使用文档未同步更新:

- `claude-notify/SKILL.md` 有 2 处 "v2.0.0 起 hooks 注册在全局 settings.json,不再依赖 marketplace 插件机制" 的注释 — marketplace 已在 v3.0 完全移除,这种"与 marketplace 对比"的措辞现在令人困惑
- `npx @allanpk716/work-skills-setup` 安装器 (Phase 54 裁剪后仍可用,提供引导式 Pushover 配置 + 环境检测 + hooks 注册 + 验证) 在任何用户文档中都未提及
- 根 README 项目结构块只列 `claude-notify/`,漏了实际的 `installer/` 和 `docs/`

claude-notify 自身代码在 v3.0 未改 (仅回归测试),所以其 changelog 不需要 v3.0.0 条目。

## Design Decision: Install-path Narrative

**Primary install (保持不变):** `npx skills add allanpk716/work-skills/claude-notify`
- Agent Skills 开放标准路径,轻量
- 注册全局 hooks、复制脚本、安装技能
- 用户手动 `setx` 配置 Pushover (或 PowerShell)
- 保持为首选 — 项目近期轨迹已标准化于此 (commit "Replace old installer commands with npx skills add")

**Alternative install (文档新增):** `npx @allanpk716/work-skills-setup`
- 引导式安装器,适合新用户
- Windows 检测 + Python/pip 检测 (+ pip 安装 requests 若缺失) + 交互式 Pushover 凭据验证 + hooks 注册 + `--verify` 自动验证
- 已随项目发布 (Phase 54 裁剪为仅服务 claude-notify),仅是未文档化

## Cleanup Principle

- **当前使用说明** 中的 marketplace 措辞 → 清理 (marketplace 已不存在,对比无意义)
- **changelog 历史条目** → 保留 (变更日志记录过去是恰当的)
- 判据:"这是在描述*现在*怎么用,还是记录*过去*改了什么?" — 只清理前者

## File-by-File Changes

### File 1: `claude-notify/SKILL.md` (主要使用文档)
- **Step 1 (安装插件):** 保留 `npx skills add allanpk716/work-skills/claude-notify` 为首选。删除 line 82 的 v2.0.0 marketplace 注释。新增简短 **"备选:引导式安装器"** 子节,指向 `npx @allanpk716/work-skills-setup`,一行描述其能力 (引导式 Pushover 配置 + 环境检测 + hooks 注册 + 验证)。
- **Step 4 (测试) 注释, line 176:** 简化 "通知 hooks 通过全局 ~/.claude/settings.json 注册,而非 marketplace 插件机制" 为 "通知 hooks 注册在全局 ~/.claude/settings.json,确保在所有项目中生效" (去掉 marketplace 对比)。
- 其他章节 (前提条件、Pushover 配置、斜杠命令、参考文档表) 已正确,不动。

### File 2: `claude-notify/references/setup.md`
- 新增 **"引导式安装 (推荐新用户)"** 节,介绍安装器作为手动 `setx` Pushover 配置的备选。列出安装器能力 (Windows/Python/`requests` 检测、交互式 Pushover 凭据验证、hooks 注册、`--verify`)。交叉链接回 SKILL.md 安装节。

### File 3 & 4: `README.md` + `README.zh.md` (根)
- **Project Structure 块:** 添加 `installer/` 和 `docs/` 行 (目前仅 `claude-notify/`)。反映实际根目录布局。
- **Quick Start:** 保持 `npx skills add ...` 单行 (保持简洁)。根 README 不提安装器 — 根 README 是导航/概览;安装器详情归属 `claude-notify/` 文档。

### File 5: `claude-notify/references/changelog.md` — **不改**
- 历史 v2.0.0 marketplace 条目是合法变更日志历史;v3.0 未改 claude-notify 代码,无需 v3.0.0 条目 (里程碑已在根 CHANGELOG.md 记录)。

## Verification (implementation 后)

- `grep -niE "marketplace" claude-notify/SKILL.md` → 空 (当前使用说明无 marketplace 对比)
- `grep -rn "@allanpk716/work-skills-setup" claude-notify/SKILL.md claude-notify/references/setup.md` → 命中 (安装器已文档化)
- 所有跨文档 markdown 链接可解析 (无死链) — 手动核对 SKILL.md ↔ references/ ↔ setup.md 互链
- 根 README 项目结构与实际 `ls -d */` 一致 (claude-notify/, installer/, docs/)

## Out of Scope

- 不重写 `commands.md` / `faq.md` / `technical.md` (它们已 clean,无 stale 引用)
- 不改任何代码 (claude-notify/、installer/src/、installer/package.json 均不动)
- 不动 `.planning/`
- 不在根 README Quick Start 加安装器 (根 README 保持导航/概览定位)
- 不给 claude-notify changelog 加 v3.0.0 条目

## Success Criteria

- [ ] `claude-notify/SKILL.md` 无 marketplace 对比措辞,新增备选安装器子节
- [ ] `claude-notify/references/setup.md` 新增引导式安装节
- [ ] 根 `README.md` + `README.zh.md` 项目结构含 installer/ + docs/
- [ ] `claude-notify/references/changelog.md` 未改 (历史保留)
- [ ] 跨文档链接全部可解析
- [ ] 无代码改动
