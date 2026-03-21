# Phase 18: Marketplace Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 18-marketplace-integration
**Areas discussed:** 市场源注册方式, 插件发现机制, 插件安装流程
**Mode:** Auto (--auto flag)

---

## 市场源注册方式

| Option | Description | Selected |
|--------|-------------|----------|
| Claude Code 配置系统 | 通过 config.json 添加市场源,使用 GitHub 仓库 URL | ✓ |
| 手动编辑配置文件 | 用户手动编辑 ~/.claude/config.json | |
| 环境变量注册 | 使用环境变量指定市场源 URL | |

**User's choice:** Claude Code 配置系统
**Notes:** 使用配置 API 更安全,避免手动编辑错误。与现有配置系统一致。

---

## 插件发现机制

| Option | Description | Selected |
|--------|-------------|----------|
| 读取 marketplace.json | 从 GitHub 仓库读取现有 marketplace.json 文件 | ✓ |
| 扫描插件目录 | 动态扫描 plugins/ 目录生成插件列表 | |
| 本地缓存 | 使用本地缓存的插件列表 | |

**User's choice:** 读取 marketplace.json
**Notes:** 现有 marketplace.json 结构良好,无需重新发明轮子。使用 raw content URL 更快。

---

## 插件安装流程

| Option | Description | Selected |
|--------|-------------|----------|
| enquirer 多选提示 | 使用 Checkbox 让用户选择多个插件 | ✓ |
| 单独提示每个插件 | 逐个询问是否安装 | |
| 自动安装所有插件 | 不询问,直接安装所有插件 | |

**User's choice:** enquirer 多选提示
**Notes:** 多选更高效,用户体验更好。与 Phase 17 交互式引导模式一致。

---

## 文件复制方式

| Option | Description | Selected |
|--------|-------------|----------|
| Node.js fs 模块 | 使用 fs.cp 或 fs-extra 复制目录 | ✓ |
| git clone 子目录 | 克隆仓库后提取插件 | |
| 下载 ZIP | 下载仓库 ZIP 后解压 | |

**User's choice:** Node.js fs 模块
**Notes:** 最简单直接。已在 Node.js 环境中,无需额外工具。

---

## Claude's Discretion

以下领域由 Claude 在规划/实现时自行决定:

- GitHub API 错误处理详细程度
- 网络失败重试策略(重试次数、延迟)
- 本地文件权限检查
- 安装后验证方式
- 进度显示格式

## Deferred Ideas

None — 讨论保持在阶段范围内
